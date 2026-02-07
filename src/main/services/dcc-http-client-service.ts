/**
 * DCC HTTP Client Service
 * HTTP client with connection pooling (keepAlive) for DCC API calls
 */

import * as http from 'http'

/**
 * DCC Session data from session.json endpoint
 */
export interface DccSessionData {
  Name: string
  Folder: string
  Counter: number
  Files?: Array<{
    FileName: string
    ShortName: string
    FileNameTemplates?: Array<{
      Name: string
      Value: string
    }>
  }>
}

/**
 * Parsed camera info from DCC session
 */
export interface DccCameraInfo {
  model: string
  serial: string
  connected: boolean
}

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
   * Fetch session.json from DCC (contains camera info)
   * @returns Parsed JSON object or null on error
   */
  async fetchSessionJson(): Promise<DccSessionData | null> {
    try {
      const url = `http://${this.config.host}:${this.config.apiPort}/session.json`
      const response = await this.request(url, 5000)

      // Validate response before parsing
      if (!response || response.trim().length === 0) {
        console.warn('DCC session.json returned empty response')
        return null
      }

      // Validate response starts with JSON object
      if (!response.trim().startsWith('{')) {
        console.warn('DCC session.json returned non-JSON response')
        return null
      }

      return JSON.parse(response) as DccSessionData
    } catch (error) {
      console.error('Failed to fetch session.json:', error)
      return null
    }
  }

  /**
   * Get camera info from DCC session data
   * Parses [Camera Name] field which contains "Model (Serial)"
   */
  async getCameraInfo(): Promise<DccCameraInfo | null> {
    const session = await this.fetchSessionJson()
    if (!session) {
      return null
    }

    // Find camera name in session files' FileNameTemplates
    // Format: "Canon EOS RP (401029001101)"
    let cameraName = ''
    if (session.Files && session.Files.length > 0) {
      const templates = session.Files[0].FileNameTemplates
      if (templates) {
        const cameraTemplate = templates.find(t => t.Name === '[Camera Name]')
        if (cameraTemplate) {
          cameraName = cameraTemplate.Value
        }
      }
    }

    if (!cameraName) {
      // DCC is running but no camera detected
      return { model: 'No camera', serial: 'unknown', connected: false }
    }

    // Parse "Model (Serial)" format
    const match = cameraName.match(/^(.+?)\s*\((\d+)\)$/)
    if (match) {
      return {
        model: match[1].trim(),
        serial: match[2],
        connected: true
      }
    }

    // Fallback if format is different
    return {
      model: cameraName,
      serial: 'unknown',
      connected: true
    }
  }

  /**
   * Check live view MJPEG stream availability (port 5514)
   * Note: Stream only works when Live View window is open in DCC
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
