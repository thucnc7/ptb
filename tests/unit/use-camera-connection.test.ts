import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCameraConnection } from '../../src/renderer/hooks/use-camera-connection'

describe('useCameraConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with disconnected status', async () => {
    const { result } = renderHook(() => useCameraConnection())

    await waitFor(() => {
      expect(result.current.status.connected).toBe(false)
      expect(result.current.status.liveViewActive).toBe(false)
      expect(result.current.connectionState).toBe('disconnected')
    })
  })

  it('should load initial status on mount', async () => {
    const mockStatus = {
      connected: true,
      liveViewActive: false,
      cameraInfo: {
        id: 'test-camera',
        model: 'Canon EOS R6',
        serialNumber: '123456'
      },
      error: null
    }

    vi.mocked(window.electronAPI.camera.getStatus).mockResolvedValue(mockStatus)

    const { result } = renderHook(() => useCameraConnection())

    await waitFor(() => {
      expect(result.current.status.connected).toBe(true)
      expect(result.current.status.cameraInfo).toEqual(mockStatus.cameraInfo)
    })
  })

  it('should refresh cameras list', async () => {
    const mockCameras = [
      {
        id: 'cam-1',
        model: 'Canon EOS R6',
        serialNumber: '123456'
      }
    ]

    vi.mocked(window.electronAPI.camera.getCameras).mockResolvedValue(
      mockCameras
    )

    const { result } = renderHook(() => useCameraConnection())

    await waitFor(() => {
      expect(result.current.cameras).toHaveLength(0)
    })

    await result.current.refreshCameras()

    await waitFor(() => {
      expect(result.current.cameras).toEqual(mockCameras)
    })
  })

  it('should connect to camera', async () => {
    const mockCameraInfo = {
      id: 'cam-1',
      model: 'Canon EOS R6',
      serialNumber: '123456'
    }

    vi.mocked(window.electronAPI.camera.connect).mockResolvedValue(
      mockCameraInfo
    )

    const { result } = renderHook(() => useCameraConnection())

    await waitFor(() => {
      expect(result.current.connectionState).toBe('disconnected')
    })

    await result.current.connect('cam-1')

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
      expect(result.current.status.connected).toBe(true)
      expect(result.current.status.cameraInfo).toEqual(mockCameraInfo)
    })
  })

  it('should handle connection error', async () => {
    vi.mocked(window.electronAPI.camera.connect).mockRejectedValue(
      new Error('Connection failed')
    )

    const { result } = renderHook(() => useCameraConnection())

    await waitFor(() => {
      expect(result.current.connectionState).toBe('disconnected')
    })

    await expect(result.current.connect()).rejects.toThrow('Connection failed')

    await waitFor(() => {
      expect(result.current.connectionState).toBe('error')
      expect(result.current.status.error).toBe('Error: Connection failed')
    })
  })

  it('should disconnect camera', async () => {
    const mockCameraInfo = {
      id: 'cam-1',
      model: 'Canon EOS R6',
      serialNumber: '123456'
    }

    vi.mocked(window.electronAPI.camera.connect).mockResolvedValue(mockCameraInfo)
    vi.mocked(window.electronAPI.camera.disconnect).mockResolvedValue()

    const { result } = renderHook(() => useCameraConnection())

    // Connect first
    await result.current.connect()
    
    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    // Then disconnect
    await result.current.disconnect()

    await waitFor(() => {
      expect(result.current.connectionState).toBe('disconnected')
      expect(result.current.status.connected).toBe(false)
      expect(result.current.status.cameraInfo).toBeNull()
    })
  })

  it('should start live view', async () => {
    vi.mocked(window.electronAPI.camera.startLiveView).mockResolvedValue()

    const { result } = renderHook(() => useCameraConnection())

    await result.current.startLiveView()

    await waitFor(() => {
      expect(result.current.status.liveViewActive).toBe(true)
    })

    expect(window.electronAPI.camera.startLiveView).toHaveBeenCalled()
  })

  it('should stop live view', async () => {
    vi.mocked(window.electronAPI.camera.stopLiveView).mockResolvedValue()

    const { result } = renderHook(() => useCameraConnection())

    await result.current.stopLiveView()

    await waitFor(() => {
      expect(result.current.status.liveViewActive).toBe(false)
    })

    expect(window.electronAPI.camera.stopLiveView).toHaveBeenCalled()
  })

  it('should capture photo', async () => {
    const mockCaptureResult = {
      filePath: '/path/to/capture_123.jpg',
      timestamp: Date.now()
    }

    vi.mocked(window.electronAPI.camera.capture).mockResolvedValue(
      mockCaptureResult
    )

    const { result } = renderHook(() => useCameraConnection())

    const captureResult = await result.current.capture()

    expect(captureResult).toEqual(mockCaptureResult)
    expect(window.electronAPI.camera.capture).toHaveBeenCalled()
  })

  it('should handle capture error', async () => {
    vi.mocked(window.electronAPI.camera.capture).mockRejectedValue(
      new Error('Capture failed')
    )

    const { result } = renderHook(() => useCameraConnection())

    await expect(result.current.capture()).rejects.toThrow('Capture failed')

    await waitFor(() => {
      expect(result.current.status.error).toBe('Error: Capture failed')
    })
  })
})
