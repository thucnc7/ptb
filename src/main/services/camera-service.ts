import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import type { CameraInfo, CameraStatus, CaptureResult } from '../../shared/types/camera-types'
import { pathToFileUrl } from '../../shared/utils/file-url-helper'
import { DccInstallerService } from './dcc-installer-service'
import { getDccProcessMonitor } from './dcc-process-monitor-service'
import { getDccFileWatcher } from './dcc-capture-file-watcher-service'
import { getDccHttpClient } from './dcc-http-client-service'
import type { BrowserWindow } from 'electron'

export class CameraService {
  private connected = false
  private liveViewActive = false
  private liveViewCallback: ((imageData: string) => void) | null = null

  // Performance: Track last captured file
  private lastCapturedFile: string | null = null

  // Cache camera info to avoid repeated API calls
  private cachedCameraInfo: CameraInfo | null = null

  private dccInstaller: DccInstallerService

  constructor() {
    this.dccInstaller = new DccInstallerService()
  }

  /**
   * Reset all connection state (called on connect/disconnect/offline)
   */
  private resetState(): void {
    this.liveViewActive = false
    this.liveViewCallback = null
    this.lastCapturedFile = null
    this.cachedCameraInfo = null
  }

  setMainWindow(window: BrowserWindow) {
    this.dccInstaller.setMainWindow(window)
  }

  // --- digiCamControl Integration ---

  async checkDccAvailable(): Promise<boolean> {
    // OPTIMIZED: Use cached monitor state (instant, <1ms)
    return getDccProcessMonitor().isOnline()
  }

  async isDccInstalled(): Promise<boolean> {
    return this.dccInstaller.isDccInstalled()
  }

  async autoSetupDcc(): Promise<void> {
    // Download and open installer - user must complete installation manually
    // After install completes, user should click "Launch App" button
    await this.dccInstaller.downloadAndInstall()
    // Note: We don't auto-launch because shell.openPath is fire-and-forget
    // The installer UI will appear and user needs to complete it
  }

  async launchDcc(): Promise<void> {
    await this.dccInstaller.launchDcc()
  }

  /**
   * OPTIMIZED: Uses HTTP client with connection pooling
   */
  private async sendCommand(command: string): Promise<string> {
    return getDccHttpClient().sendCommand(command)
  }

  async getStatus(): Promise<CameraStatus> {
    // Return internal state - let frontend handle display
    // Don't auto-reset live view based on health check alone
    // (health check may be stale, and DccLiveView component has its own retry logic)
    return {
      connected: this.connected,
      liveViewActive: this.liveViewActive,
      cameraInfo: this.cachedCameraInfo,
      error: null
    }
  }

  async getCameras(): Promise<CameraInfo[]> {
    try {
      if (!await this.checkDccAvailable()) {
        return []
      }

      // DCC usually controls one active camera, but we can try to fetch info
      // Simple implementation: check if execution returns camera info
      const info = await this.getCameraInfo()
      if (info) {
        return [info]
      }
      return []
    } catch (error) {
      console.error('Error getting cameras:', error)
      return []
    }
  }

  /**
   * Get real camera info from DCC via session.json
   * No longer triggers capture - uses safe session query
   */
  private async getCameraInfo(): Promise<CameraInfo | null> {
    try {
      // Use HTTP client to get real camera data from session.json
      const dccInfo = await getDccHttpClient().getCameraInfo()

      if (!dccInfo || !dccInfo.connected) {
        console.log('No camera detected by DCC')
        return null
      }

      return {
        id: dccInfo.serial || 'dcc-camera',
        model: dccInfo.model,
        serialNumber: dccInfo.serial
      }
    } catch (error) {
      console.error('Failed to get camera info:', error)
      return null
    }
  }

  async connect(cameraId?: string): Promise<CameraInfo> {
    console.log('Connecting to DigiCamControl...')

    // OPTIMIZED: Use cached monitor state instead of blocking health check
    if (!getDccProcessMonitor().isOnline()) {
      throw new Error('DigiCamControl not available. Please ensure it is running or wait for auto-recovery.')
    }

    // Reset all state on fresh connect (fixes stale live view issue)
    this.resetState()

    // Query actual camera info from DCC
    const info = await this.getCameraInfo()
    if (!info) {
      throw new Error('No camera detected. Please connect a camera to your computer.')
    }

    // Cache the camera info and mark as connected
    this.cachedCameraInfo = info
    this.connected = true

    console.log(`Connected to camera: ${info.model} (${info.serialNumber})`)
    return info
  }

  async disconnect(): Promise<void> {
    // Stop live view if active (ignore errors during disconnect)
    if (this.liveViewActive) {
      try {
        await this.stopLiveView()
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Reset all state
    this.resetState()
    this.connected = false
    console.log('Disconnected from camera')
  }

  getLiveViewStreamUrl(): string {
    // Static JPEG endpoint - component will poll for live view
    // MJPEG on port 5514 doesn't work reliably
    return 'http://127.0.0.1:5513/liveview.jpg'
  }

  // Check if live view is available (used by IPC handler)
  async checkLiveViewAvailable(): Promise<boolean> {
    // Check if API is online (live view is served on same port 5513)
    return getDccProcessMonitor().isOnline()
  }

  async startLiveView(callback: (imageData: string) => void): Promise<void> {
    if (!this.connected) {
      throw new Error('Camera not connected')
    }

    try {
      // OPTIMIZED: Use monitor's cached health status
      const health = getDccProcessMonitor().getHealthStatus()

      if (!health?.liveView) {
        // Monitor handles recovery in background, just warn user
        console.warn('Live View port 5514 is unresponsive. Monitor will attempt recovery.')
      }

      // Enable live view in DCC
      console.log('Sending LiveViewWnd_Show...')
      await this.sendCommand('cmd=LiveViewWnd_Show')

      // OPTIMIZED: Reduced wait from 1000ms to 500ms
      await new Promise(r => setTimeout(r, 500))

      console.log('Sending DoLiveView...')
      await this.sendCommand('cmd=DoLiveView')

      this.liveViewActive = true
      this.liveViewCallback = callback

    } catch (error) {
      console.error('Failed to start live view:', error)
      throw error
    }
  }

  async stopLiveView(): Promise<void> {
    this.liveViewActive = false
    this.liveViewCallback = null
    try {
      await this.sendCommand('cmd=LiveViewWnd_Hide')
    } catch (e) {
      // ignore
    }
  }

  /**
   * OPTIMIZED CAPTURE - Uses file watcher for instant detection
   */
  async capture(): Promise<CaptureResult> {
    if (!this.connected) {
      throw new Error('Camera not connected')
    }

    const captureStart = Date.now()
    console.log('[DEBUG] capture() started at', new Date().toISOString())

    // Check if file watcher is available
    if (getDccFileWatcher().isRunning()) {
      console.log('[DEBUG] File watcher is running, using optimized capture')
      try {
        // OPTIMIZED: Set up file watcher BEFORE sending capture command
        console.log('[DEBUG] Setting up file watcher promise...')
        const capturePromise = getDccFileWatcher().waitForNextCapture(15000) // 15s timeout - balance between RAW file write time and autofocus failure
        console.log('[DEBUG] File watcher promise created')

        // Trigger capture via DCC
        console.log('Sending capture command to DCC (optimized)...')
        const cmdStart = Date.now()
        await this.sendCommand('cmd=Capture')
        console.log(`[DEBUG] DCC capture command completed in ${Date.now() - cmdStart}ms`)

        // Wait for file watcher to detect the new image
        console.log('[DEBUG] Waiting for file watcher to detect image...')
        const filePath = await capturePromise
        console.log('[DEBUG] File watcher resolved with:', filePath)

        const captureTime = Date.now() - captureStart
        console.log(`✓ Optimized capture complete in ${captureTime}ms:`, filePath)

        this.lastCapturedFile = filePath
        return {
          success: true,
          filePath,
          previewUrl: pathToFileUrl(filePath),
          timestamp: Date.now()
        }

      } catch (error) {
        console.warn('[DEBUG] File watcher capture failed:', error)
        console.warn('File watcher capture failed, falling back to scan:', error)
        // Fall through to legacy scan method
      }
    } else {
      console.log('[DEBUG] File watcher NOT running, using fallback')
    }

    // FALLBACK: Legacy scanning method
    return this.captureFallback(captureStart)
  }

  /**
   * Fallback capture method using folder scanning
   */
  private async captureFallback(captureStart: number): Promise<CaptureResult> {
    try {
      // If we didn't use file watcher, send capture command now
      if (!getDccFileWatcher().isRunning()) {
        console.log('Sending capture command to DCC (fallback)...')
        await this.sendCommand('cmd=Capture')
      }

      // Wait for file to be written
      await new Promise(r => setTimeout(r, 1500))

      const picturesPath = app.getPath('pictures')
      const dccBasePath = path.join(picturesPath, 'digiCamControl')

      let newestFile: { path: string; time: number } | null = null

      try {
        const entries = await fs.readdir(dccBasePath)

        const sessionFolders = await Promise.all(
          entries.map(async (name) => {
            const fullPath = path.join(dccBasePath, name)
            try {
              const stats = await fs.stat(fullPath)
              return { name, path: fullPath, stats, isDir: stats.isDirectory() }
            } catch {
              return null
            }
          })
        )

        const sortedSessions = sessionFolders
          .filter((f): f is NonNullable<typeof f> => f !== null && f.isDir)
          .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())

        const sessionsToScan = sortedSessions.slice(0, 2)

        for (const session of sessionsToScan) {
          const files = await fs.readdir(session.path)
          const images = files.filter(f => /\.(jpg|jpeg|nef|cr2|arw)$/i.test(f))

          for (const img of images) {
            const imgPath = path.join(session.path, img)
            const imgStat = await fs.stat(imgPath)
            if (!newestFile || imgStat.mtime.getTime() > newestFile.time) {
              newestFile = { path: imgPath, time: imgStat.mtime.getTime() }
            }
          }
        }
      } catch (e) {
        console.error('Error scanning DCC folders:', e)
      }

      if (newestFile && Date.now() - newestFile.time < 20000) {
        const captureTime = Date.now() - captureStart
        console.log(`Found captured image (fallback) in ${captureTime}ms:`, newestFile.path)
        this.lastCapturedFile = newestFile.path
        return {
          success: true,
          filePath: newestFile.path,
          previewUrl: pathToFileUrl(newestFile.path),
          timestamp: newestFile.time
        }
      }

      return {
        success: false,
        error: 'Capture timed out or file not found'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Lazy singleton instance
let instance: CameraService | null = null;

export const getCameraService = (): CameraService => {
  if (!instance) {
    instance = new CameraService();
  }
  return instance;
};
