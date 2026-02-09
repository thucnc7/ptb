import { contextBridge, ipcRenderer } from 'electron'
import type { Frame } from '../shared/types/frame-types'
import type {
  CameraInfo,
  CameraMode,
  CameraStatus,
  CaptureResult
} from '../shared/types/camera-types'
import type {
  SessionInfo,
  SavePhotoResult,
  CompositeResult
} from '../shared/types/session-types'

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
    // Mock camera mode (backward compat)
    setMockMode: (enabled: boolean) => Promise<{ success: boolean; mockMode: boolean }>
    getMockMode: () => Promise<boolean>
    // Camera mode switching
    setMode: (mode: CameraMode) => Promise<{ success: boolean; mode: CameraMode }>
    getMode: () => Promise<CameraMode>
    // Webcam capture
    webcamCapture: (imageDataUrl: string) => Promise<CaptureResult>
  }

  // Session management (Phase 5 - Image Compositing)
  session: {
    create: () => Promise<SessionInfo>
    savePhoto: (sessionId: string, photoIndex: number, imageData: string) => Promise<SavePhotoResult>
    composite: (sessionId: string, frame: Frame, selectedPhotoIndices?: number[]) => Promise<CompositeResult>
    getComposite: (sessionId: string) => Promise<string> // data URL
    getInfo: (sessionId: string) => Promise<SessionInfo | null>
    delete: (sessionId: string) => Promise<void>
    getFolderPath: (sessionId: string) => Promise<string | null>
    openFolder: (sessionId: string) => Promise<boolean> // Open folder containing composite
  }

  // Settings
  settings: {
    getExtraPhotos: () => Promise<number>
    setExtraPhotos: (count: number) => Promise<{ success: boolean }>
    getCloudinaryConfig: () => Promise<{ cloudName: string; apiKey: string; apiSecret: string }>
    setCloudinaryConfig: (config: { cloudName: string; apiKey: string; apiSecret: string }) => Promise<{ success: boolean }>
  }

  // Video recording
  video: {
    save: (sessionId: string, data: number[]) => Promise<{ success: boolean; path: string }>
    getPath: (sessionId: string) => Promise<string | null>
  }

  // Google Drive slot management (Phase 6)
  drive: {
    initPool: () => Promise<{ total: number; available: number; claimed: number; uploaded: number }>
    getPoolStatus: () => Promise<{ total: number; available: number; claimed: number; uploaded: number }>
    claimSlot: (sessionId: string) => Promise<{ fileId: string; downloadLink: string }>
    uploadRealImage: (fileId: string, imagePath: string) => Promise<{ success: boolean }>
    releaseSlot: (fileId: string) => Promise<{ success: boolean }>
    refillPool: () => Promise<{ total: number; available: number; claimed: number; uploaded: number }>
  }
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
    },
    // Mock camera mode (backward compat)
    setMockMode: (enabled) => ipcRenderer.invoke('camera:set-mock-mode', enabled),
    getMockMode: () => ipcRenderer.invoke('camera:get-mock-mode'),
    // Camera mode switching
    setMode: (mode) => ipcRenderer.invoke('camera:set-mode', mode),
    getMode: () => ipcRenderer.invoke('camera:get-mode'),
    // Webcam capture
    webcamCapture: (imageDataUrl) => ipcRenderer.invoke('camera:webcam-capture', imageDataUrl)
  },

  session: {
    create: () => ipcRenderer.invoke('session:create'),
    savePhoto: (sessionId, photoIndex, imageData) =>
      ipcRenderer.invoke('session:save-photo', sessionId, photoIndex, imageData),
    composite: (sessionId, frame, selectedPhotoIndices) =>
      ipcRenderer.invoke('session:composite', sessionId, frame, selectedPhotoIndices),
    getComposite: (sessionId) =>
      ipcRenderer.invoke('session:get-composite', sessionId),
    getInfo: (sessionId) =>
      ipcRenderer.invoke('session:get-info', sessionId),
    delete: (sessionId) =>
      ipcRenderer.invoke('session:delete', sessionId),
    getFolderPath: (sessionId) =>
      ipcRenderer.invoke('session:get-folder-path', sessionId),
    openFolder: (sessionId) =>
      ipcRenderer.invoke('session:open-folder', sessionId)
  },

  settings: {
    getExtraPhotos: () => ipcRenderer.invoke('settings:get-extra-photos'),
    setExtraPhotos: (count) => ipcRenderer.invoke('settings:set-extra-photos', count),
    getCloudinaryConfig: () => ipcRenderer.invoke('settings:get-cloudinary-config'),
    setCloudinaryConfig: (config) => ipcRenderer.invoke('settings:set-cloudinary-config', config)
  },

  video: {
    save: (sessionId, data) => ipcRenderer.invoke('video:save', sessionId, data),
    getPath: (sessionId) => ipcRenderer.invoke('video:get-path', sessionId)
  },

  drive: {
    initPool: () => ipcRenderer.invoke('drive:init-pool'),
    getPoolStatus: () => ipcRenderer.invoke('drive:get-pool-status'),
    claimSlot: (sessionId) => ipcRenderer.invoke('drive:claim-slot', sessionId),
    uploadRealImage: (fileId, imagePath) => ipcRenderer.invoke('drive:upload-real-image', fileId, imagePath),
    releaseSlot: (fileId) => ipcRenderer.invoke('drive:release-slot', fileId),
    refillPool: () => ipcRenderer.invoke('drive:refill-pool')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
