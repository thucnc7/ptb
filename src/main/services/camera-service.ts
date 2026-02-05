import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import type { CameraInfo, CameraStatus, CaptureResult } from '../../shared/types/camera-types'
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

  private dccInstaller: DccInstallerService

  constructor() {
    this.dccInstaller = new DccInstallerService()
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
    return {
      connected: this.connected,
      liveViewActive: this.liveViewActive,
      cameraInfo: this.connected ? {
        id: 'dcc-camera',
        model: 'Canon Camera (via DCC)',
        serialNumber: 'unknown'
      } : null,
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

  private async getCameraInfo(): Promise<CameraInfo | null> {
    try {
      // DCC doesn't have a perfect JSON API for this, we assume if we can talk to it,
      // there is a camera. We can try to get session data.
      // Often simple query 'camera' might suffice or we check session
      // For now returning a generic connected camera if DCC is responsive
      const response = await this.sendCommand('cmd=Capture') // Just testing connection primarily
      // Ideally we would parse "c.DoCommand(Cmd)" output if documented well.
      // Let's use a dummy info if connected for Phase 3 MVP
      return {
        id: 'dcc-camera',
        model: 'Canon Camera (via DCC)',
        serialNumber: 'unknown'
      }
    } catch {
      return null
    }
  }

  async connect(cameraId?: string): Promise<CameraInfo> {
    console.log('Connecting to DigiCamControl...')

    // OPTIMIZED: Use cached monitor state instead of blocking health check
    // Monitor handles recovery in background, no blocking here
    if (!getDccProcessMonitor().isOnline()) {
      throw new Error('DigiCamControl not available. Please ensure it is running or wait for auto-recovery.')
    }

    this.connected = true
    return {
      id: 'dcc-camera',
      model: 'Canon Camera (via DCC)',
      serialNumber: '000000'
    }
  }

  // OLD Connect removed

  async disconnect(): Promise<void> {
    if (this.liveViewActive) {
      await this.stopLiveView()
    }
    this.connected = false
  }

  getLiveViewStreamUrl(): string {
    return 'http://127.0.0.1:5514/live'
  }

  // Check if live view port is available (used by IPC handler)
  async checkLiveViewAvailable(): Promise<boolean> {
    // OPTIMIZED: Use monitor's cached health status
    const health = getDccProcessMonitor().getHealthStatus()
    return health?.liveView ?? false
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

    // Check if file watcher is available
    if (getDccFileWatcher().isRunning()) {
      try {
        // OPTIMIZED: Set up file watcher BEFORE sending capture command
        const capturePromise = getDccFileWatcher().waitForNextCapture(20000)

        // Trigger capture via DCC
        console.log('Sending capture command to DCC (optimized)...')
        await this.sendCommand('cmd=Capture')

        // Wait for file watcher to detect the new image
        const filePath = await capturePromise

        const captureTime = Date.now() - captureStart
        console.log(`✓ Optimized capture complete in ${captureTime}ms:`, filePath)

        this.lastCapturedFile = filePath
        return {
          success: true,
          filePath,
          previewUrl: `file://${filePath}`,
          timestamp: Date.now()
        }

      } catch (error) {
        console.warn('File watcher capture failed, falling back to scan:', error)
        // Fall through to legacy scan method
      }
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
          previewUrl: `file://${newestFile.path}`,
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
