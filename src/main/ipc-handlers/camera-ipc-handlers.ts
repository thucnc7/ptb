import { ipcMain, BrowserWindow } from 'electron'
import { cameraService } from '../services/camera-service'

export function registerCameraIpcHandlers(): void {
  // Get camera status
  ipcMain.handle('camera:get-status', async () => {
    try {
      return cameraService.getStatus()
    } catch (error) {
      throw new Error(`Failed to get camera status: ${error}`)
    }
  })

  // Get available cameras
  ipcMain.handle('camera:get-cameras', async () => {
    try {
      return await cameraService.getCameras()
    } catch (error) {
      throw new Error(`Failed to get cameras: ${error}`)
    }
  })

  // Connect to camera
  ipcMain.handle('camera:connect', async (_event, cameraId?: string) => {
    try {
      return await cameraService.connect(cameraId)
    } catch (error) {
      throw new Error(`Failed to connect to camera: ${error}`)
    }
  })

  // Disconnect camera
  ipcMain.handle('camera:disconnect', async () => {
    try {
      await cameraService.disconnect()
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

      await cameraService.startLiveView((imageData) => {
        mainWindow.webContents.send('camera:live-view-frame', imageData)
      })
    } catch (error) {
      throw new Error(`Failed to start live view: ${error}`)
    }
  })

  // Stop live view
  ipcMain.handle('camera:stop-live-view', async () => {
    try {
      await cameraService.stopLiveView()
    } catch (error) {
      throw new Error(`Failed to stop live view: ${error}`)
    }
  })

  // Capture photo
  ipcMain.handle('camera:capture', async () => {
    try {
      return await cameraService.capture()
    } catch (error) {
      throw new Error(`Failed to capture photo: ${error}`)
    }
  })
}
