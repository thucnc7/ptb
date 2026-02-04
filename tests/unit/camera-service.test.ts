import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import path from 'path'
import os from 'os'

// Mock Electron app before importing
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => path.join(os.tmpdir(), 'test-photobooth'))
  }
}))

// Import camera service
import { cameraService } from '../../src/main/services/camera-service'

describe('CameraService', () => {
  beforeEach(async () => {
    // Reset camera state before each test
    await cameraService.disconnect().catch(() => {})
  })

  describe('getStatus', () => {
    it('should return disconnected status initially', () => {
      const status = cameraService.getStatus()

      expect(status.connected).toBe(false)
      expect(status.liveViewActive).toBe(false)
      expect(status.cameraInfo).toBeNull()
      expect(status.error).toBeNull()
    })
  })

  describe('getCameras', () => {
    it('should return mock camera list', async () => {
      const cameras = await cameraService.getCameras()

      expect(cameras).toHaveLength(1)
      expect(cameras[0]).toMatchObject({
        id: 'mock-camera-001',
        model: expect.stringContaining('Canon'),
        serialNumber: 'MOCK123456'
      })
    })
  })

  describe('connect', () => {
    it('should connect to mock camera', async () => {
      const cameraInfo = await cameraService.connect()

      expect(cameraInfo).toMatchObject({
        id: 'mock-camera-001',
        model: expect.stringContaining('Canon'),
        serialNumber: 'MOCK123456'
      })

      const status = cameraService.getStatus()
      expect(status.connected).toBe(true)
    })

    it('should throw error if already connected', async () => {
      await cameraService.connect()

      await expect(cameraService.connect()).rejects.toThrow(
        'Camera already connected'
      )
    })
  })

  describe('disconnect', () => {
    it('should disconnect camera', async () => {
      await cameraService.connect()
      await cameraService.disconnect()

      const status = cameraService.getStatus()
      expect(status.connected).toBe(false)
    })

    it('should stop live view when disconnecting', async () => {
      await cameraService.connect()
      await cameraService.startLiveView(vi.fn())
      await cameraService.disconnect()

      const status = cameraService.getStatus()
      expect(status.liveViewActive).toBe(false)
    })
  })

  describe('startLiveView', () => {
    it('should throw error if not connected', async () => {
      await expect(cameraService.startLiveView(vi.fn())).rejects.toThrow(
        'Camera not connected'
      )
    })

    it('should start live view when connected', async () => {
      await cameraService.connect()
      await cameraService.startLiveView(vi.fn())

      const status = cameraService.getStatus()
      expect(status.liveViewActive).toBe(true)
    })

    it('should call callback with frame data', async () => {
      const callback = vi.fn()
      await cameraService.connect()
      await cameraService.startLiveView(callback)

      // Wait for at least one frame
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(callback).toHaveBeenCalled()
      expect(callback.mock.calls[0][0]).toMatch(/^data:image/)
    })

    it('should throw error if already active', async () => {
      await cameraService.connect()
      await cameraService.startLiveView(vi.fn())

      await expect(cameraService.startLiveView(vi.fn())).rejects.toThrow(
        'Live view already active'
      )
    })
  })

  describe('stopLiveView', () => {
    it('should stop live view', async () => {
      const callback = vi.fn()
      await cameraService.connect()
      await cameraService.startLiveView(callback)
      await cameraService.stopLiveView()

      const status = cameraService.getStatus()
      expect(status.liveViewActive).toBe(false)

      // Wait to ensure no more callbacks
      await new Promise((resolve) => setTimeout(resolve, 100))
      const callCount = callback.mock.calls.length

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(callback.mock.calls.length).toBe(callCount)
    })
  })

  describe('capture', () => {
    it('should throw error if not connected', async () => {
      await expect(cameraService.capture()).rejects.toThrow(
        'Camera not connected'
      )
    })

    it('should capture photo when connected', async () => {
      await cameraService.connect()
      const result = await cameraService.capture()

      expect(result).toMatchObject({
        filePath: expect.stringContaining('capture_'),
        timestamp: expect.any(Number)
      })
    })

    it('should create unique file for each capture', async () => {
      await cameraService.connect()
      
      const result1 = await cameraService.capture()
      await new Promise((resolve) => setTimeout(resolve, 10))
      const result2 = await cameraService.capture()

      expect(result1.filePath).not.toBe(result2.filePath)
      expect(result1.timestamp).toBeLessThan(result2.timestamp)
    })
  })
})
