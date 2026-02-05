/**
 * Camera Service Manager
 * Switches between real camera service and mock camera service
 */

import { CameraService } from './camera-service'
import { MockCameraService, getMockCameraService } from './mock-camera-service'

class CameraServiceManager {
  private realCamera: CameraService | null = null
  private mockMode = false

  getService(): CameraService | MockCameraService {
    if (this.mockMode) {
      return getMockCameraService()
    }

    if (!this.realCamera) {
      this.realCamera = new CameraService()
    }
    return this.realCamera
  }

  setMockMode(enabled: boolean): void {
    console.log(`[CameraServiceManager] Mock mode: ${enabled ? 'ENABLED' : 'DISABLED'}`)
    this.mockMode = enabled
  }

  isMockMode(): boolean {
    return this.mockMode
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
