import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Electron API
global.window = global.window || {}
;(global.window as any).electronAPI = {
  getAppVersion: vi.fn(() => Promise.resolve('1.0.0')),
  frames: {
    getAll: vi.fn(() => Promise.resolve([])),
    getById: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    selectBackgroundImage: vi.fn(),
    importBackgroundImage: vi.fn()
  },
  camera: {
    getStatus: vi.fn(() =>
      Promise.resolve({
        connected: false,
        liveViewActive: false,
        cameraInfo: null,
        error: null
      })
    ),
    getCameras: vi.fn(() => Promise.resolve([])),
    connect: vi.fn(),
    disconnect: vi.fn(),
    startLiveView: vi.fn(),
    stopLiveView: vi.fn(),
    capture: vi.fn(),
    onLiveViewFrame: vi.fn(() => () => {})
  }
}
