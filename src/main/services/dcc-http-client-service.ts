/**
 * DCC HTTP Client Service
 * HTTP client with connection pooling (keepAlive) for DCC API calls
 */

import * as http from 'http'

export interface DccHttpClientConfig {
  host: string
  apiPort: number
  liveViewPort: number
  requestTimeoutMs: number
  socketTimeoutMs: number
  maxSockets: number
  maxFreeSockets: number
}

const DEFAULT_CONFIG: DccHttpClientConfig = {
  host: '127.0.0.1',
  apiPort: 5513,
  liveViewPort: 5514,
  requestTimeoutMs: 25000,
  socketTimeoutMs: 30000,
  maxSockets: 10,
  maxFreeSockets: 5
}

export class DccHttpClientService {
  private agent: http.Agent
  private config: DccHttpClientConfig

  constructor(config: Partial<DccHttpClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    this.agent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: this.config.maxSockets,
      maxFreeSockets: this.config.maxFreeSockets,
      timeout: this.config.socketTimeoutMs
    })

    console.log('DCC HTTP client initialized with keepAlive')
  }

  /**
   * Send a command to the DCC API
   * @param command DCC command (e.g., 'cmd=Capture', 'cmd=LiveViewWnd_Show')
   * @returns Response body as string
   */
  async sendCommand(command: string): Promise<string> {
    const url = `http://${this.config.host}:${this.config.apiPort}/?${command}`
    return this.request(url)
  }

  /**
   * Check if a port is responding
   * @param port Port number to check
   * @param urlPath Optional path (default: /)
   * @returns true if responding, false otherwise
   */
  async checkPort(port: number, urlPath: string = '/'): Promise<boolean> {
    try {
      const url = `http://${this.config.host}:${port}${urlPath}`
      await this.request(url, 2000)  // Short timeout for health checks
      return true
    } catch {
      return false
    }
  }

  /**
   * Check DCC API health (port 5513)
   */
  async checkApiHealth(): Promise<boolean> {
    return this.checkPort(this.config.apiPort, '/?cmd=session')
  }

  /**
   * Check live view port health (port 5514)
   */
  async checkLiveViewHealth(): Promise<boolean> {
    return this.checkPort(this.config.liveViewPort, '/live')
  }

  private request(url: string, timeoutMs?: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = timeoutMs || this.config.requestTimeoutMs

      const req = http.get(url, { agent: this.agent }, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        })
      })

      req.setTimeout(timeout, () => {
        req.destroy()
        reject(new Error(`Request timeout after ${timeout}ms`))
      })

      req.on('error', (err) => {
        reject(err)
      })
    })
  }

  /**
   * Get agent statistics for debugging
   */
  getStats(): { sockets: number; freeSockets: number; requests: number } {
    const sockets = Object.values(this.agent.sockets).reduce(
      (sum, arr) => sum + (arr?.length || 0), 0
    )
    const freeSockets = Object.values(this.agent.freeSockets).reduce(
      (sum, arr) => sum + (arr?.length || 0), 0
    )
    const requests = Object.values(this.agent.requests).reduce(
      (sum, arr) => sum + (arr?.length || 0), 0
    )
    return { sockets, freeSockets, requests }
  }

  /**
   * Destroy agent and close all connections
   * Call this on app shutdown
   */
  destroy(): void {
    this.agent.destroy()
    console.log('DCC HTTP client destroyed')
  }
}

// Singleton instance
// Lazy singleton instance
let instance: DccHttpClientService | null = null;

export const getDccHttpClient = (): DccHttpClientService => {
  if (!instance) {
    instance = new DccHttpClientService();
  }
  return instance;
};
