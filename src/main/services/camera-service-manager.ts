/**
 * Camera Service Manager
 * Switches between real camera (DCC), webcam, and mock camera services.
 * Persists camera mode via electron-store.
 */

import Store from 'electron-store'
import { CameraService } from './camera-service'
import { MockCameraService, getMockCameraService } from './mock-camera-service'
import { WebcamCameraService, getWebcamCameraService } from './webcam-camera-service'
import type { CameraMode } from '../../shared/types/camera-types'

const store = new Store({ defaults: { cameraMode: 'dcc' as CameraMode } })

class CameraServiceManager {
  private realCamera: CameraService | null = null
  private currentMode: CameraMode

  constructor() {
    this.currentMode = store.get('cameraMode', 'dcc') as CameraMode
    console.log(`[CameraServiceManager] Loaded mode: ${this.currentMode}`)
  }

  getService(): CameraService | MockCameraService | WebcamCameraService {
    switch (this.currentMode) {
      case 'webcam':
        return getWebcamCameraService()
      case 'mock':
        return getMockCameraService()
      case 'dcc':
      default:
        if (!this.realCamera) {
          this.realCamera = new CameraService()
        }
        return this.realCamera
    }
  }

  setMode(mode: CameraMode): void {
    console.log(`[CameraServiceManager] Mode: ${this.currentMode} -> ${mode}`)
    this.currentMode = mode
    store.set('cameraMode', mode)
  }

  getMode(): CameraMode {
    return this.currentMode
  }

  // Backward compat
  setMockMode(enabled: boolean): void {
    this.setMode(enabled ? 'mock' : 'dcc')
  }

  isMockMode(): boolean {
    return this.currentMode === 'mock'
  }
}

// Singleton instance
let managerInstance: CameraServiceManager | null = null

export const getCameraServiceManager = (): CameraServiceManager => {
  if (!managerInstance) {
    managerInstance = new CameraServiceManager()
  }
  return managerInstance
}

// Export convenience function that returns the active service
export const getCameraService = () => {
  return getCameraServiceManager().getService()
}
