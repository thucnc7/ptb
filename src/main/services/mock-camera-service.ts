/**
 * Mock Camera Service for UI Testing
 * Simulates camera operations without real hardware
 */

import { app, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import type { CameraInfo, CameraStatus, CaptureResult } from '../../shared/types/camera-types'

export class MockCameraService {
  private connected = false
  private liveViewActive = false
  private captureCount = 0
  private mockImagesDir: string

  constructor() {
    // Use app's temp directory for mock images
    this.mockImagesDir = path.join(app.getPath('temp'), 'photobooth-mock-images')
  }

  /**
   * Initialize mock images directory
   */
  private async ensureMockImagesDir(): Promise<void> {
    try {
      await fs.mkdir(this.mockImagesDir, { recursive: true })
    } catch (e) {
      console.error('Failed to create mock images dir:', e)
    }
  }

  /**
   * Generate a mock image using nativeImage
   * Creates a gradient PNG with text overlay
   */
  private async generateMockImage(): Promise<string> {
    await this.ensureMockImagesDir()

    const timestamp = Date.now()
    const filename = `mock-capture-${timestamp}.png`
    const filePath = path.join(this.mockImagesDir, filename)

    // Create a simple colored canvas (800x600)
    const colors = [
      { r: 255, g: 107, b: 157 }, // Pink
      { r: 196, g: 69, b: 105 },  // Dark pink
      { r: 168, g: 230, b: 207 }, // Mint
      { r: 255, g: 217, b: 61 },  // Yellow
      { r: 108, g: 92, b: 231 }   // Purple
    ]

    const color = colors[this.captureCount % colors.length]
    const width = 800
    const height = 600

    // Create RGBA buffer (solid color)
    const buffer = Buffer.alloc(width * height * 4)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4

        // Create gradient effect
        const gradientFactor = x / width
        buffer[offset] = Math.floor(color.r * (1 - gradientFactor * 0.3))     // R
        buffer[offset + 1] = Math.floor(color.g * (1 - gradientFactor * 0.3)) // G
        buffer[offset + 2] = Math.floor(color.b * (1 - gradientFactor * 0.3)) // B
        buffer[offset + 3] = 255                                               // A
      }
    }

    // Create NativeImage from buffer
    const image = nativeImage.createFromBuffer(buffer, { width, height })

    // Save as PNG
    const pngBuffer = image.toPNG()
    await fs.writeFile(filePath, pngBuffer)

    return filePath
  }

  async checkDccAvailable(): Promise<boolean> {
    // Mock camera is always "available"
    return true
  }

  async isDccInstalled(): Promise<boolean> {
    return true
  }

  async launchDcc(): Promise<void> {
    console.log('[MOCK] DigiCamControl launched (simulated)')
    await new Promise(r => setTimeout(r, 500))
  }

  async autoSetupDcc(): Promise<void> {
    // Mock DCC is always "installed" and ready
    console.log('[MOCK] DCC auto-setup (simulated - no action needed)')
    await new Promise(r => setTimeout(r, 500))
  }

  async getStatus(): Promise<CameraStatus> {
    return {
      connected: this.connected,
      liveViewActive: this.liveViewActive,
      cameraInfo: this.connected ? {
        id: 'mock-camera-001',
        model: 'Mock Camera Pro',
        serialNumber: 'MOCK-12345'
      } : null,
      error: null
    }
  }

  async getCameras(): Promise<CameraInfo[]> {
    return [
      {
        id: 'mock-camera-001',
        model: 'Mock Camera Pro',
        serialNumber: 'MOCK-12345'
      }
    ]
  }

  async connect(cameraId?: string): Promise<CameraInfo> {
    console.log('[MOCK] Connecting to camera...')
    await new Promise(r => setTimeout(r, 800))

    this.connected = true

    const info: CameraInfo = {
      id: 'mock-camera-001',
      model: 'Mock Camera Pro',
      serialNumber: 'MOCK-12345'
    }

    console.log('[MOCK] Connected to camera:', info.model)
    return info
  }

  async disconnect(): Promise<void> {
    console.log('[MOCK] Disconnecting from camera...')
    await new Promise(r => setTimeout(r, 300))

    this.liveViewActive = false
    this.connected = false
    console.log('[MOCK] Disconnected from camera')
  }

  getLiveViewStreamUrl(): string {
    // Return a data URL with a gradient (for mock live view)
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGRjZCOUQ7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4QjVDRjY7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDZCNkQ0O3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSJ1cmwoI2cpIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Nb2NrIExpdmUgVmlldyDwn5OzPC90ZXh0Pjwvc3ZnPg=='
  }

  async checkLiveViewAvailable(): Promise<boolean> {
    return this.connected
  }

  async startLiveView(callback: (imageData: string) => void): Promise<void> {
    if (!this.connected) {
      throw new Error('Camera not connected')
    }

    console.log('[MOCK] Starting live view...')
    await new Promise(r => setTimeout(r, 500))

    this.liveViewActive = true
    console.log('[MOCK] Live view started')

    // Simulate periodic frame updates
    // In real implementation, this would send actual frames
  }

  async stopLiveView(): Promise<void> {
    console.log('[MOCK] Stopping live view...')
    await new Promise(r => setTimeout(r, 200))

    this.liveViewActive = false
    console.log('[MOCK] Live view stopped')
  }

  async capture(): Promise<CaptureResult> {
    if (!this.connected) {
      throw new Error('Camera not connected')
    }

    console.log('[MOCK] Capturing photo...')

    // Simulate capture delay
    await new Promise(r => setTimeout(r, 1200))

    try {
      const filePath = await this.generateMockImage()
      this.captureCount++

      console.log(`[MOCK] Captured photo ${this.captureCount}:`, filePath)

      return {
        success: true,
        filePath,
        previewUrl: `file://${filePath}`,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock capture failed'
      }
    }
  }

  setMainWindow(window: any) {
    console.log('[MOCK] Main window set')
  }
}

// Singleton instance
let mockInstance: MockCameraService | null = null

export const getMockCameraService = (): MockCameraService => {
  if (!mockInstance) {
    mockInstance = new MockCameraService()
  }
  return mockInstance
}
