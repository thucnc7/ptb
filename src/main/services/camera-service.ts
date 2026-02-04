import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import type { CameraInfo, CameraStatus, CaptureResult } from '../../shared/types/camera-types'

class CameraService {
  private connected = false
  private liveViewActive = false
  private liveViewCallback: ((imageData: string) => void) | null = null
  private liveViewInterval: NodeJS.Timeout | null = null
  private capturesPath: string
  private mockCameraInfo: CameraInfo = {
    id: 'mock-camera-001',
    model: 'Canon EOS R6 Mark II (Mock)',
    serialNumber: 'MOCK123456'
  }

  constructor() {
    this.capturesPath = path.join(app.getPath('userData'), 'captures')
    this.ensureCapturesDirectory()
  }

  private async ensureCapturesDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.capturesPath, { recursive: true })
    } catch (error) {
      console.error('Failed to create captures directory:', error)
    }
  }

  async getCameras(): Promise<CameraInfo[]> {
    // Mock implementation - returns one camera
    return [this.mockCameraInfo]
  }

  async connect(cameraId?: string): Promise<CameraInfo> {
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    if (this.connected) {
      throw new Error('Camera already connected')
    }

    this.connected = true
    return this.mockCameraInfo
  }

  async disconnect(): Promise<void> {
    if (this.liveViewActive) {
      await this.stopLiveView()
    }
    this.connected = false
  }

  async startLiveView(callback: (imageData: string) => void): Promise<void> {
    if (!this.connected) {
      throw new Error('Camera not connected')
    }

    if (this.liveViewActive) {
      throw new Error('Live view already active')
    }

    this.liveViewCallback = callback
    this.liveViewActive = true

    // Mock live view with a test pattern
    this.liveViewInterval = setInterval(() => {
      if (!this.liveViewActive || !this.liveViewCallback) {
        return
      }

      // Generate a simple test pattern (gradient)
      const canvas = this.generateMockFrame()
      this.liveViewCallback(canvas)
    }, 33) // ~30fps
  }

  private generateMockFrame(): string {
    // Generate a mock frame with timestamp overlay
    // For now, return a simple data URL with text
    const timestamp = new Date().toLocaleTimeString()
    const svg = `
      <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(30,41,59);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(15,23,42);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#grad1)" />
        <text x="960" y="500" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
          Mock Camera Feed
        </text>
        <text x="960" y="580" font-family="Arial" font-size="36" fill="#94a3b8" text-anchor="middle">
          ${timestamp}
        </text>
        <text x="960" y="650" font-family="Arial" font-size="24" fill="#64748b" text-anchor="middle">
          This is a development mock. Real camera will be used in production.
        </text>
      </svg>
    `
    const base64 = Buffer.from(svg).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  }

  async stopLiveView(): Promise<void> {
    this.liveViewActive = false
    this.liveViewCallback = null
    if (this.liveViewInterval) {
      clearInterval(this.liveViewInterval)
      this.liveViewInterval = null
    }
  }

  async capture(): Promise<CaptureResult> {
    if (!this.connected) {
      throw new Error('Camera not connected')
    }

    try {
      // Mock capture - generate a test image
      const fileName = `capture_${Date.now()}.jpg`
      const filePath = path.join(this.capturesPath, fileName)

      // Create a simple test image (SVG converted to data)
      const svg = `
        <svg width="6000" height="4000" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(59,130,246);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(139,92,246);stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="6000" height="4000" fill="url(#bg)" />
          <text x="3000" y="1800" font-family="Arial" font-size="200" fill="white" text-anchor="middle">
            Captured Photo
          </text>
          <text x="3000" y="2200" font-family="Arial" font-size="120" fill="#e0e7ff" text-anchor="middle">
            ${new Date().toLocaleString()}
          </text>
          <text x="3000" y="2400" font-family="Arial" font-size="80" fill="#c7d2fe" text-anchor="middle">
            Mock Capture - Replace with real Canon EDSDK
          </text>
        </svg>
      `

      // Write mock image
      await fs.writeFile(filePath, svg)

      return {
        filePath,
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Capture failed: ${error}`)
    }
  }

  getStatus(): CameraStatus {
    return {
      connected: this.connected,
      liveViewActive: this.liveViewActive,
      cameraInfo: this.connected ? this.mockCameraInfo : null,
      error: null
    }
  }
}

export const cameraService = new CameraService()
