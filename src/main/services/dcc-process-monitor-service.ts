/**
 * DCC Process Monitor Service
 * Background monitoring for digiCamControl with auto-recovery and circuit breaker
 */

import { EventEmitter } from 'events'
import { exec } from 'child_process'
import { getDccHttpClient } from './dcc-http-client-service'
import type {
  DccState,
  DccHealthStatus,
  DccMonitorConfig
} from '../../shared/types/dcc-monitor-types'

// Safe logging wrapper to prevent EPIPE errors when stdout is closed
const safeLog = (...args: unknown[]): void => {
  try {
    console.log(...args)
  } catch {
    // Ignore EPIPE/write errors when console is unavailable
  }
}

const safeError = (...args: unknown[]): void => {
  try {
    console.error(...args)
  } catch {
    // Ignore EPIPE/write errors when console is unavailable
  }
}

const DEFAULT_CONFIG: DccMonitorConfig = {
  healthCheckIntervalMs: 10000,  // 10s as validated
  apiTimeoutMs: 2000,
  maxRecoveryAttempts: 5,
  recoveryWindowMs: 120000,      // 2 min circuit breaker window
  initialBackoffMs: 1000,
  maxBackoffMs: 30000
}

export class DccProcessMonitorService extends EventEmitter {
  private state: DccState = 'stopped'
  private healthStatus: DccHealthStatus | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private config: DccMonitorConfig

  // Circuit breaker state
  private recoveryAttempts = 0
  private recoveryStartTime = 0

  constructor(config: Partial<DccMonitorConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start background monitoring
   */
  start(): void {
    if (this.state !== 'stopped') {
      safeLog('DCC monitor already running')
      return
    }

    safeLog('Starting DCC process monitor...')
    this.setState('checking')

    // Initial check
    this.performHealthCheck()

    // Start interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckIntervalMs)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    this.setState('stopped')
    this.removeAllListeners()
    safeLog('DCC monitor stopped')
  }

  /**
   * Get current state (instant, cached)
   */
  getState(): DccState {
    return this.state
  }

  /**
   * Quick online check (instant, cached)
   */
  isOnline(): boolean {
    return this.state === 'online'
  }

  /**
   * Get last health status
   */
  getHealthStatus(): DccHealthStatus | null {
    return this.healthStatus
  }

  /**
   * Manual retry after circuit breaker opened
   */
  manualRetry(): void {
    if (this.state === 'failed') {
      safeLog('Manual retry triggered, resetting circuit breaker')
      this.recoveryAttempts = 0
      this.recoveryStartTime = 0
      this.setState('checking')
      this.performHealthCheck()
    }
  }

  private setState(newState: DccState): void {
    if (this.state === newState) return

    const oldState = this.state
    this.state = newState
    safeLog(`DCC state: ${oldState} -> ${newState}`)
    this.emit('state-changed', newState, oldState)
  }

  private async performHealthCheck(): Promise<void> {
    // Skip if in recovery or failed state
    if (this.state === 'recovering') return

    try {
      // First check if DCC process is running (fast)
      const isProcessRunning = await this.checkDccProcess()
      safeLog('[DEBUG] DCC process running:', isProcessRunning)

      if (!isProcessRunning) {
        // Process not running, go offline
        safeLog('[DEBUG] DCC process not running, going offline')
        this.handleOffline()
        return
      }

      // Process is running, check API health
      const health = await this.checkHealth()
      this.healthStatus = health
      this.emit('api-health', health)

      if (health.api) {
        // DCC is responding
        if (this.state !== 'online') {
          this.setState('online')
          // Reset circuit breaker on success
          this.recoveryAttempts = 0
          this.recoveryStartTime = 0
        }
      } else {
        // Process running but API not responding - might be starting up
        if (this.state === 'checking') {
          safeLog('[DEBUG] DCC process running but API not ready, waiting...')
          // Don't go offline immediately, wait for API to be ready
          // This handles the case when DCC is just starting up
        } else {
          // Was online before, now API not responding
          this.handleOffline()
        }
      }
    } catch (error) {
      safeError('Health check error:', error)
      this.handleOffline()
    }
  }

  /**
   * OPTIMIZED: Uses HTTP client with connection pooling
   */
  private async checkHealth(): Promise<DccHealthStatus> {
    const client = getDccHttpClient()
    safeLog('[DEBUG] Checking API health on ports 5513/5514...')
    const [api, liveView] = await Promise.all([
      client.checkApiHealth(),
      client.checkLiveViewHealth()
    ])
    safeLog('[DEBUG] Health result - API:', api, 'LiveView:', liveView)

    return {
      api,
      liveView,
      timestamp: Date.now()
    }
  }

  private handleOffline(): void {
    if (this.state === 'online' || this.state === 'checking') {
      this.setState('offline')
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      this.setState('failed')
      this.emit('recovery-failed', 'Circuit breaker opened: max retries exceeded')
      return
    }

    // Attempt recovery
    this.attemptRecovery()
  }

  private isCircuitOpen(): boolean {
    const now = Date.now()

    // Reset window if enough time passed
    if (this.recoveryStartTime > 0 &&
      now - this.recoveryStartTime > this.config.recoveryWindowMs) {
      this.recoveryAttempts = 0
      this.recoveryStartTime = 0
    }

    return this.recoveryAttempts >= this.config.maxRecoveryAttempts
  }

  private async attemptRecovery(): Promise<void> {
    if (this.state === 'recovering') return

    this.setState('recovering')
    this.emit('recovery-started')

    // Track recovery attempts
    if (this.recoveryStartTime === 0) {
      this.recoveryStartTime = Date.now()
    }
    this.recoveryAttempts++

    safeLog(`Recovery attempt ${this.recoveryAttempts}/${this.config.maxRecoveryAttempts}`)

    // Check if DCC process is running
    const isRunning = await this.checkDccProcess()
    safeLog('[DEBUG] Recovery - DCC process running:', isRunning)

    // Calculate backoff delay - shorter if process is running (API might be starting)
    const delay = isRunning
      ? Math.min(2000, this.config.initialBackoffMs)  // Quick retry if process is running
      : Math.min(
          this.config.maxBackoffMs,
          this.config.initialBackoffMs * Math.pow(2, this.recoveryAttempts - 1)
        )

    if (!isRunning) {
      safeLog('DCC process not running, waiting for user to start it...')
    } else {
      safeLog('DCC process running but API not ready, retrying in', delay, 'ms')
    }

    // Wait with backoff then check again
    setTimeout(() => {
      this.setState('checking')
      this.performHealthCheck()
    }, delay)
  }

  private checkDccProcess(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('tasklist /FI "IMAGENAME eq CameraControl.exe" /FO CSV /NH', (error, stdout) => {
        if (error) {
          resolve(false)
          return
        }
        resolve(stdout.includes('CameraControl.exe'))
      })
    })
  }
}

// Singleton instance
// Lazy singleton instance
let instance: DccProcessMonitorService | null = null;

export const getDccProcessMonitor = (): DccProcessMonitorService => {
  if (!instance) {
    instance = new DccProcessMonitorService();
  }
  return instance;
};
