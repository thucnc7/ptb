// Camera types for Canon EDSDK integration

export interface CameraInfo {
  id: string
  model: string
  serialNumber: string
}

export interface CameraStatus {
  connected: boolean
  liveViewActive: boolean
  cameraInfo: CameraInfo | null
  error: string | null
}

export interface LiveViewFrame {
  imageData: string // Base64 encoded JPEG
  timestamp: number
}

export interface CaptureResult {
  success: boolean
  filePath?: string
  previewUrl?: string
  timestamp?: number
  thumbnailPath?: string
  error?: string
}

export type CameraConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export type LiveViewState = 'stopped' | 'starting' | 'streaming' | 'error'
