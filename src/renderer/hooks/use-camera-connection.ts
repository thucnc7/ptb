import { useState, useEffect, useCallback } from 'react'
import type {
  CameraInfo,
  CameraStatus,
  CaptureResult,
  CameraConnectionState
} from '../../shared/types/camera-types'

export function useCameraConnection() {
  const [status, setStatus] = useState<CameraStatus>({
    connected: false,
    liveViewActive: false,
    cameraInfo: null,
    error: null
  })
  const [connectionState, setConnectionState] =
    useState<CameraConnectionState>('disconnected')
  const [cameras, setCameras] = useState<CameraInfo[]>([])

  // Load camera status on mount
  useEffect(() => {
    loadStatus()
  }, [])

  // Poll status every 5 seconds when connected to detect disconnects
  useEffect(() => {
    if (!status.connected) return

    const interval = setInterval(() => {
      loadStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [status.connected])

  // Listen to DCC state changes and auto-update when DCC goes offline
  useEffect(() => {
    const unsubscribe = window.electronAPI.camera.onDccStateChanged(({ newState }) => {
      if (newState === 'offline' || newState === 'failed') {
        console.log('DCC went offline, updating camera status')
        setStatus({
          connected: false,
          liveViewActive: false,
          cameraInfo: null,
          error: 'DigiCamControl disconnected'
        })
        setConnectionState('disconnected')
      }
    })

    return () => unsubscribe()
  }, [])

  const loadStatus = async () => {
    try {
      const currentStatus = await window.electronAPI.camera.getStatus()
      setStatus(currentStatus)
      setConnectionState(currentStatus.connected ? 'connected' : 'disconnected')
    } catch (error) {
      console.error('Failed to load camera status:', error)
    }
  }

  const refreshCameras = useCallback(async () => {
    try {
      const availableCameras = await window.electronAPI.camera.getCameras()
      setCameras(availableCameras)
    } catch (error) {
      console.error('Failed to refresh cameras:', error)
      setStatus((prev) => ({ ...prev, error: String(error) }))
    }
  }, [])

  const connect = useCallback(async (cameraId?: string) => {
    setConnectionState('connecting')
    setStatus((prev) => ({ ...prev, error: null }))

    try {
      const cameraInfo = await window.electronAPI.camera.connect(cameraId)
      setStatus({
        connected: true,
        liveViewActive: false,
        cameraInfo,
        error: null
      })
      setConnectionState('connected')
    } catch (error) {
      setConnectionState('error')
      setStatus((prev) => ({ ...prev, error: String(error) }))
      throw error
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      await window.electronAPI.camera.disconnect()
      setStatus({
        connected: false,
        liveViewActive: false,
        cameraInfo: null,
        error: null
      })
      setConnectionState('disconnected')
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: String(error) }))
      throw error
    }
  }, [])

  const startLiveView = useCallback(async () => {
    try {
      await window.electronAPI.camera.startLiveView()
      setStatus((prev) => ({ ...prev, liveViewActive: true }))
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: String(error) }))
      throw error
    }
  }, [])

  const stopLiveView = useCallback(async () => {
    try {
      await window.electronAPI.camera.stopLiveView()
      setStatus((prev) => ({ ...prev, liveViewActive: false }))
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: String(error) }))
      throw error
    }
  }, [])

  const capture = useCallback(async (): Promise<CaptureResult> => {
    try {
      return await window.electronAPI.camera.capture()
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: String(error) }))
      throw error
    }
  }, [])

  return {
    status,
    connectionState,
    cameras,
    refreshCameras,
    connect,
    disconnect,
    startLiveView,
    stopLiveView,
    capture
  }
}
