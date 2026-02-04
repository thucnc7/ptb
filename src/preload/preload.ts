import { contextBridge, ipcRenderer } from 'electron'
import type { Frame } from '../shared/types/frame-types'

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
  // camera: {
  //   connect: () => Promise<void>
  //   startLiveView: () => Promise<void>
  //   capture: () => Promise<string>
  //   disconnect: () => Promise<void>
  // }

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
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
