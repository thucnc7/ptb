

// Prevent EPIPE crash when stdout/stderr pipe is closed in production (no terminal)
process.stdout?.on?.('error', () => {})
process.stderr?.on?.('error', () => {})

import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerFrameIpcHandlers } from './ipc-handlers/frame-ipc-handlers'
import { registerCameraIpcHandlers } from './ipc-handlers/camera-ipc-handlers'
import { registerSessionIpcHandlers } from './ipc-handlers/session-ipc-handlers'
import { registerSettingsIpcHandlers } from './ipc-handlers/settings-ipc-handlers'
import { registerDriveIpcHandlers } from './ipc-handlers/drive-ipc-handlers'
import { registerVideoIpcHandlers } from './ipc-handlers/video-ipc-handlers'
import { getDccProcessMonitor } from './services/dcc-process-monitor-service'
import { getDccFileWatcher } from './services/dcc-capture-file-watcher-service'
import { getDccHttpClient } from './services/dcc-http-client-service'
import { getCameraService } from './services/camera-service'
import { getCameraServiceManager } from './services/camera-service-manager'

let mainWindow: BrowserWindow | null = null

// Check if running in development (lazy check to avoid module load time issues)
function isDev(): boolean {
  return process.env.NODE_ENV === 'development' || !!process.env['ELECTRON_RENDERER_URL']
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // Allow loading MJPEG stream from digiCamControl (localhost:5514)
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Log load errors for debugging
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[LOAD FAIL] code=${code} desc=${desc}`)
  })
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('[RENDERER CRASHED]', details)
  })

  // Load the renderer
  const rendererPath = join(__dirname, '../renderer/index.html')
  console.log('[MAIN] __dirname:', __dirname)
  console.log('[MAIN] Loading renderer from:', rendererPath)
  if (isDev() && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(rendererPath)
  }

  // Always open DevTools for debugging production issues
  mainWindow.webContents.openDevTools()

  // F11 fullscreen, F12 DevTools (works in all modes)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow?.setFullScreen(!mainWindow.isFullScreen())
    }
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools()
    }
  })
}

// App lifecycle
app.whenReady().then(() => {
  // Set app user model id for windows
  app.setAppUserModelId('com.photobooth.app')

  // Register IPC handlers
  registerFrameIpcHandlers()
  registerCameraIpcHandlers()
  registerSessionIpcHandlers()
  registerSettingsIpcHandlers()
  registerDriveIpcHandlers()
  registerVideoIpcHandlers()

  // DCC services
  console.log('Starting DCC process monitor...')
  getDccProcessMonitor().start()
  console.log('Starting DCC file watcher...')
  getDccFileWatcher().start().catch(err => {
    console.error('Failed to start file watcher:', err)
  })
  getDccProcessMonitor().on('state-changed', (newState, oldState) => {
    console.log(`DCC state: ${oldState} -> ${newState}`)
    mainWindow?.webContents.send('dcc:state-changed', { newState, oldState })

    // Force cleanup camera state when DCC goes offline - only if in DCC mode
    if (newState === 'offline' || newState === 'failed') {
      const currentMode = getCameraServiceManager().getMode()
      if (currentMode === 'dcc') {
        console.log('DCC offline - disconnecting camera service')
        getCameraService().disconnect().catch(() => {
          // Ignore errors during cleanup
        })
      }
    }
  })
  getDccProcessMonitor().on('recovery-failed', (reason) => {
    console.error('DCC recovery failed:', reason)
    mainWindow?.webContents.send('dcc:recovery-failed', { reason })
  })
  getDccFileWatcher().on('image-captured', ({ filePath }) => {
    console.log('File watcher detected capture:', filePath)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', async () => {
  console.log('Shutting down DCC services...')
  getDccProcessMonitor().stop()
  await getDccFileWatcher().stop()
  getDccHttpClient().destroy()
})

// IPC handler for app version
ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

// Additional IPC handlers will be registered in later phases
// Camera (Phase 3), Image Processing (Phase 5), Google Drive (Phase 6)

