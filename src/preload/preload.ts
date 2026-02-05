import { contextBridge, ipcRenderer } from 'electron'
import type { Frame } from '../shared/types/frame-types'
import type {
  CameraInfo,
  CameraStatus,
  CaptureResult
} from '../shared/types/camera-types'

// Expose protected methods to renderer process via context bridge

export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>

  // Frame management (Phase 2)
  frames: {
    getAll: () => Promise<Frame[]>
    getById: (id: string) => Promise<Frame | null>
    create: (data: Omit<Frame, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Frame>
    update: (id: string, updates: Partial<Frame>) => Promise<Frame>
    delete: (id: string) => Promise<boolean>
    selectBackgroundImage: () => Promise<string | null>
    importBackgroundImage: (sourcePath: string) => Promise<string>
  }

  // Camera operations (Phase 3)
  camera: {
    getStatus: () => Promise<CameraStatus>
    getCameras: () => Promise<CameraInfo[]>
    connect: (cameraId?: string) => Promise<CameraInfo>
    disconnect: () => Promise<void>
    startLiveView: () => Promise<void>
    stopLiveView: () => Promise<void>
    capture: () => Promise<CaptureResult>
    onLiveViewFrame: (callback: (imageData: string) => void) => () => void

    // DCC specific
    checkDccInstalled: () => Promise<boolean>
    checkDccAvailable: () => Promise<boolean>
    checkLiveViewAvailable: () => Promise<boolean>
    autoSetupDcc: () => Promise<void>
    launchDcc: () => Promise<void>
    getLiveViewUrl: () => Promise<string>
    onSetupProgress: (callback: (data: { percent: number; message: string }) => void) => () => void
    // DCC Process Monitor (P1 optimization)
    getDccState: () => Promise<{ state: string; isOnline: boolean; health: { api: boolean; liveView: boolean; timestamp: number } | null }>
    dccManualRetry: () => Promise<void>
    onDccStateChanged: (callback: (data: { newState: string; oldState: string }) => void) => () => void
    onDccRecoveryFailed: (callback: (data: { reason: string }) => void) => () => void
  }

  // Image processing (Phase 5)
  // image: {
  //   composite: (backgroundPath: string, photos: string[], placeholders: Placeholder[]) => Promise<string>
  // }

  // Google Drive (Phase 6)
  // drive: {
  //   authenticate: () => Promise<void>
  //   upload: (filePath: string) => Promise<string>
  //   getDownloadLink: (fileId: string) => Promise<string>
  // }
}

const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  frames: {
    getAll: () => ipcRenderer.invoke('frames:get-all'),
    getById: (id) => ipcRenderer.invoke('frames:get-by-id', id),
    create: (data) => ipcRenderer.invoke('frames:create', data),
    update: (id, updates) => ipcRenderer.invoke('frames:update', id, updates),
    delete: (id) => ipcRenderer.invoke('frames:delete', id),
    selectBackgroundImage: () => ipcRenderer.invoke('frames:select-background-image'),
    importBackgroundImage: (sourcePath) => ipcRenderer.invoke('frames:import-background-image', sourcePath)
  },

  camera: {
    getStatus: () => ipcRenderer.invoke('camera:get-status'),
    getCameras: () => ipcRenderer.invoke('camera:get-cameras'),
    connect: (cameraId) => ipcRenderer.invoke('camera:connect', cameraId),
    disconnect: () => ipcRenderer.invoke('camera:disconnect'),
    startLiveView: () => ipcRenderer.invoke('camera:start-live-view'),
    stopLiveView: () => ipcRenderer.invoke('camera:stop-live-view'),
    capture: () => ipcRenderer.invoke('camera:capture'),
    onLiveViewFrame: (callback) => {
      const listener = (_event: unknown, imageData: string) => callback(imageData)
      ipcRenderer.on('camera:live-view-frame', listener)
      return () => ipcRenderer.removeListener('camera:live-view-frame', listener)
    },
    // Phase 3: DCC Integration
    checkDccInstalled: () => ipcRenderer.invoke('camera:check-dcc-installed'),
    checkDccAvailable: () => ipcRenderer.invoke('camera:check-dcc-available'),
    checkLiveViewAvailable: () => ipcRenderer.invoke('camera:check-live-view-available'),
    autoSetupDcc: () => ipcRenderer.invoke('camera:auto-setup-dcc'),
    launchDcc: () => ipcRenderer.invoke('camera:launch-dcc'),
    getLiveViewUrl: () => ipcRenderer.invoke('camera:get-live-view-url'),
    onSetupProgress: (callback) => {
      const listener = (_event: unknown, data: { percent: number; message: string }) => callback(data)
      ipcRenderer.on('camera:setup-progress', listener)
      return () => ipcRenderer.removeListener('camera:setup-progress', listener)
    },
    // DCC Process Monitor (P1 optimization)
    getDccState: () => ipcRenderer.invoke('camera:get-dcc-state'),
    dccManualRetry: () => ipcRenderer.invoke('camera:dcc-manual-retry'),
    onDccStateChanged: (callback) => {
      const listener = (_event: unknown, data: { newState: string; oldState: string }) => callback(data)
      ipcRenderer.on('dcc:state-changed', listener)
      return () => ipcRenderer.removeListener('dcc:state-changed', listener)
    },
    onDccRecoveryFailed: (callback) => {
      const listener = (_event: unknown, data: { reason: string }) => callback(data)
      ipcRenderer.on('dcc:recovery-failed', listener)
      return () => ipcRenderer.removeListener('dcc:recovery-failed', listener)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
