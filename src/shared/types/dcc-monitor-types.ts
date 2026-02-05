/**
 * DCC Process Monitor Types
 * Types for background process monitoring and state management
 */

export type DccState =
  | 'stopped'     // Monitor not running
  | 'checking'    // Initial check in progress
  | 'online'      // DCC API responding
  | 'offline'     // DCC not responding
  | 'recovering'  // Attempting restart
  | 'failed'      // Circuit breaker open

export interface DccHealthStatus {
  api: boolean       // Port 5513 responding
  liveView: boolean  // Port 5514 responding
  timestamp: number  // When last checked
}

export interface DccMonitorConfig {
  healthCheckIntervalMs: number  // Default: 10000
  apiTimeoutMs: number           // Default: 2000
  maxRecoveryAttempts: number    // Default: 5
  recoveryWindowMs: number       // Default: 120000 (2min)
  initialBackoffMs: number       // Default: 1000
  maxBackoffMs: number           // Default: 30000
}

export interface DccMonitorEvents {
  'state-changed': (newState: DccState, oldState: DccState) => void
  'recovery-started': () => void
  'recovery-failed': (reason: string) => void
  'api-health': (status: DccHealthStatus) => void
}
