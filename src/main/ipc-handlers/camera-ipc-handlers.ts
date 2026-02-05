import { ipcMain, BrowserWindow } from 'electron'
import { getCameraService, getCameraServiceManager } from '../services/camera-service-manager'
import { getDccProcessMonitor } from '../services/dcc-process-monitor-service'

export function registerCameraIpcHandlers(): void {
  // --- digiCamControl Handlers ---

  ipcMain.handle('camera:check-dcc-installed', async () => {
    return await getCameraService().isDccInstalled()
  })

  ipcMain.handle('camera:check-dcc-available', async () => {
    return await getCameraService().checkDccAvailable()
  })

  ipcMain.handle('camera:auto-setup-dcc', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    if (mainWindow) {
      getCameraService().setMainWindow(mainWindow)
    }
    await getCameraService().autoSetupDcc()
  })

  ipcMain.handle('camera:launch-dcc', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    if (mainWindow) {
      getCameraService().setMainWindow(mainWindow)
    }
    await getCameraService().launchDcc()
  })

  ipcMain.handle('camera:get-live-view-url', async () => {
    return getCameraService().getLiveViewStreamUrl()
  })

  ipcMain.handle('camera:check-live-view-available', async () => {
    return await getCameraService().checkLiveViewAvailable()
  })

  // --- Standard Camera Handlers ---

  // Get camera status
  ipcMain.handle('camera:get-status', async () => {
    try {
      return getCameraService().getStatus()
    } catch (error) {
      throw new Error(`Failed to get camera status: ${error}`)
    }
  })

  // Get available cameras
  ipcMain.handle('camera:get-cameras', async () => {
    try {
      return await getCameraService().getCameras()
    } catch (error) {
      throw new Error(`Failed to get cameras: ${error}`)
    }
  })

  // Connect to camera
  ipcMain.handle('camera:connect', async (_event, cameraId?: string) => {
    try {
      return await getCameraService().connect(cameraId)
    } catch (error) {
      throw new Error(`Failed to connect to camera: ${error}`)
    }
  })

  // Disconnect camera
  ipcMain.handle('camera:disconnect', async () => {
    try {
      await getCameraService().disconnect()
    } catch (error) {
      throw new Error(`Failed to disconnect camera: ${error}`)
    }
  })

  // Start live view
  ipcMain.handle('camera:start-live-view', async (event) => {
    try {
      const mainWindow = BrowserWindow.fromWebContents(event.sender)
      if (!mainWindow) {
        throw new Error('Main window not found')
      }

      getCameraService().setMainWindow(mainWindow)

      await getCameraService().startLiveView((imageData: string) => {
        mainWindow.webContents.send('camera:live-view-frame', imageData)
      })
    } catch (error) {
      throw new Error(`Failed to start live view: ${error}`)
    }
  })

  // Stop live view
  ipcMain.handle('camera:stop-live-view', async () => {
    try {
      await getCameraService().stopLiveView()
    } catch (error) {
      throw new Error(`Failed to stop live view: ${error}`)
    }
  })

  // Capture photo
  ipcMain.handle('camera:capture', async () => {
    try {
      return await getCameraService().capture()
    } catch (error) {
      throw new Error(`Failed to capture photo: ${error}`)
    }
  })

  // --- DCC Process Monitor Handlers ---

  // Get DCC monitor state (instant, cached)
  ipcMain.handle('camera:get-dcc-state', () => {
    return {
      state: getDccProcessMonitor().getState(),
      isOnline: getDccProcessMonitor().isOnline(),
      health: getDccProcessMonitor().getHealthStatus()
    }
  })

  // Manual retry after circuit breaker opened
  ipcMain.handle('camera:dcc-manual-retry', () => {
    getDccProcessMonitor().manualRetry()
  })

  // --- Mock Camera Handlers ---

  // Enable/disable mock camera mode
  ipcMain.handle('camera:set-mock-mode', (_event, enabled: boolean) => {
    getCameraServiceManager().setMockMode(enabled)
    return { success: true, mockMode: enabled }
  })

  // Get current mock mode status
  ipcMain.handle('camera:get-mock-mode', () => {
    return getCameraServiceManager().isMockMode()
  })
}
