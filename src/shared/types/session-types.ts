/**
 * Capture session types for photobooth user flow
 */

export type SessionState =
  | 'idle'
  | 'frame-selection'
  | 'preview-live'
  | 'countdown'
  | 'capturing'
  | 'photo-preview'
  | 'processing'
  | 'uploading'
  | 'qr-display'
  | 'done'

export interface CapturedPhoto {
  id: string
  index: number
  path: string
  capturedAt: Date
}

export interface CaptureSession {
  id: string
  frameId: string
  state: SessionState
  currentPhotoIndex: number
  totalPhotos: number
  capturedPhotos: CapturedPhoto[]
  compositePath: string | null
  driveFileId: string | null
  downloadLink: string | null
  startedAt: Date
  completedAt: Date | null
}
