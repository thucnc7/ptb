import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerFrameIpcHandlers } from './ipc-handlers/frame-ipc-handlers'

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
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the renderer
  if (isDev() && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (isDev()) {
    mainWindow.webContents.openDevTools()
  }

  // F11 for fullscreen toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow?.setFullScreen(!mainWindow.isFullScreen())
    }
    // F12 for DevTools in dev mode
    if (input.key === 'F12' && isDev()) {
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

// IPC handler for app version
ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

// Additional IPC handlers will be registered in later phases
// Camera (Phase 3), Image Processing (Phase 5), Google Drive (Phase 6)
