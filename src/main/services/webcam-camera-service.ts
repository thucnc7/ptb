/**
 * Webcam Camera Service
 * Thin wrapper in main process for webcam mode.
 * Actual stream lives in renderer via getUserMedia.
 * This service handles state management and saving captured images to disk.
 */

import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import type { CameraInfo, CameraStatus, CaptureResult } from '../../shared/types/camera-types'

export class WebcamCameraService {
  private connected = false
  private liveViewActive = false
  private captureCount = 0
  private savePath: string

  constructor() {
    this.savePath = path.join(app.getPath('pictures'), 'photobooth-webcam')
  }

  private async ensureSaveDir(): Promise<void> {
    await fs.mkdir(this.savePath, { recursive: true })
  }

  async checkDccAvailable(): Promise<boolean> {
    return true
  }

  async isDccInstalled(): Promise<boolean> {
    return true
  }

  async launchDcc(): Promise<void> {
    // No-op for webcam mode
  }

  async autoSetupDcc(): Promise<void> {
    // No-op for webcam mode
  }

  async getStatus(): Promise<CameraStatus> {
    return {
      connected: this.connected,
      liveViewActive: this.liveViewActive,
      cameraInfo: this.connected
        ? { id: 'webcam-001', model: 'Webcam', serialNumber: 'WEBCAM-LOCAL' }
        : null,
      error: null
    }
  }

  async getCameras(): Promise<CameraInfo[]> {
    return [{ id: 'webcam-001', model: 'Webcam', serialNumber: 'WEBCAM-LOCAL' }]
  }

  async connect(_cameraId?: string): Promise<CameraInfo> {
    console.log('[WEBCAM] Connecting...')
    this.connected = true
    const info: CameraInfo = { id: 'webcam-001', model: 'Webcam', serialNumber: 'WEBCAM-LOCAL' }
    console.log('[WEBCAM] Connected')
    return info
  }

  async disconnect(): Promise<void> {
    console.log('[WEBCAM] Disconnecting...')
    this.liveViewActive = false
    this.connected = false
    console.log('[WEBCAM] Disconnected')
  }

  getLiveViewStreamUrl(): string {
    // Marker for renderer to use getUserMedia instead of polling
    return 'webcam://local'
  }

  async checkLiveViewAvailable(): Promise<boolean> {
    return this.connected
  }

  async startLiveView(_callback: (imageData: string) => void): Promise<void> {
    if (!this.connected) throw new Error('Camera not connected')
    this.liveViewActive = true
    console.log('[WEBCAM] Live view started (renderer handles stream)')
  }

  async stopLiveView(): Promise<void> {
    this.liveViewActive = false
    console.log('[WEBCAM] Live view stopped')
  }

  /**
   * Save captured frame from renderer to disk
   * @param imageDataUrl - base64 data URL from canvas.toDataURL('image/png')
   */
  async capture(imageDataUrl?: string): Promise<CaptureResult> {
    if (!this.connected) throw new Error('Camera not connected')

    if (!imageDataUrl) {
      return { success: false, error: 'No image data provided for webcam capture' }
    }

    try {
      // Validate data URL format
      const match = imageDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
      if (!match) {
        return { success: false, error: 'Invalid image data URL format' }
      }

      const ext = match[1] === 'jpg' ? 'jpeg' : match[1]
      const base64Data = match[2]
      const buffer = Buffer.from(base64Data, 'base64')

      await this.ensureSaveDir()

      const timestamp = Date.now()
      const filename = `webcam-capture-${timestamp}.${ext === 'jpeg' ? 'jpg' : ext}`
      // Sanitize path: only use our known save directory + filename
      const filePath = path.join(this.savePath, filename)

      await fs.writeFile(filePath, buffer)
      this.captureCount++

      console.log(`[WEBCAM] Saved capture ${this.captureCount}: ${filePath}`)

      return {
        success: true,
        filePath,
        previewUrl: `file://${filePath}`,
        timestamp
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webcam capture failed'
      }
    }
  }

  setMainWindow(_window: unknown): void {
    // No-op for webcam mode
  }
}

// Singleton
let webcamInstance: WebcamCameraService | null = null

export const getWebcamCameraService = (): WebcamCameraService => {
  if (!webcamInstance) {
    webcamInstance = new WebcamCameraService()
  }
  return webcamInstance
}
