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
      console.log('DCC monitor already running')
      return
    }

    console.log('Starting DCC process monitor...')
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
    console.log('DCC monitor stopped')
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
      console.log('Manual retry triggered, resetting circuit breaker')
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
    console.log(`DCC state: ${oldState} -> ${newState}`)
    this.emit('state-changed', newState, oldState)
  }

  private async performHealthCheck(): Promise<void> {
    // Skip if in recovery or failed state
    if (this.state === 'recovering') return

    try {
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
        // DCC not responding
        this.handleOffline()
      }
    } catch (error) {
      console.error('Health check error:', error)
      this.handleOffline()
    }
  }

  /**
   * OPTIMIZED: Uses HTTP client with connection pooling
   */
  private async checkHealth(): Promise<DccHealthStatus> {
    const client = getDccHttpClient()
    const [api, liveView] = await Promise.all([
      client.checkApiHealth(),
      client.checkLiveViewHealth()
    ])

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

    console.log(`Recovery attempt ${this.recoveryAttempts}/${this.config.maxRecoveryAttempts}`)

    // Calculate backoff delay
    const delay = Math.min(
      this.config.maxBackoffMs,
      this.config.initialBackoffMs * Math.pow(2, this.recoveryAttempts - 1)
    )

    // Check if DCC process is running
    const isRunning = await this.checkDccProcess()

    if (!isRunning) {
      console.log('DCC process not running, waiting for user to start it...')
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
