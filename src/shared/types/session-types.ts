import { Frame } from './frame-types'
import { CountdownConfig } from './countdown-types'

// Session Storage Types (Phase 1)
export interface SessionInfo {
  id: string
  folderPath: string
  createdAt: Date
  photoCount: number
}

export interface SavePhotoResult {
  success: boolean
  path: string
  index: number
}

export interface CompositeResult {
  success: boolean
  path: string
  dataUrl?: string
}

export type SessionState =
  | 'selecting-frame'
  | 'idle'           // Ready to start
  | 'countdown'      // Configurable countdown
  | 'capturing'      // Saving photo
  | 'photo-preview'  // Brief preview of just captured photo
  | 'inter-photo'    // Breathing room between captures (2s)
  | 'review-all'     // Session complete, review all photos
  | 'processing'     // Compositing
  | 'uploading'      // Uploading to drive
  | 'qr-display'     // Show QR code
  | 'error'
  | 'paused'         // Session paused by user

export interface CapturedPhoto {
  id: string
  index: number
  path: string
  previewUrl: string
  capturedAt: Date
}

export interface CaptureSession {
  id: string
  state: SessionState
  frameId: string | null
  totalPhotos: number
  currentPhotoIndex: number
  capturedPhotos: CapturedPhoto[]
  countdownValue: number
  countdownConfig: CountdownConfig | null  // User-selected countdown
  autoSequenceEnabled: boolean             // Auto-capture mode
  compositePath: string | null
  driveFileId: string | null
  downloadLink: string | null
  qrCodeDataUrl: string | null
  error: string | null
}

export type SessionAction =
  | { type: 'SELECT_FRAME'; frame: Frame }
  | { type: 'CONFIGURE_COUNTDOWN'; config: CountdownConfig }
  | { type: 'ENABLE_AUTO_SEQUENCE' }
  | { type: 'START_COUNTDOWN' }
  | { type: 'COUNTDOWN_TICK'; value: number }
  | { type: 'CAPTURE_START' }
  | { type: 'CAPTURE_COMPLETE'; photo: CapturedPhoto }
  | { type: 'CAPTURE_ERROR'; error: string }
  | { type: 'PHOTO_PREVIEW_DONE' }
  | { type: 'INTER_PHOTO_START' }
  | { type: 'INTER_PHOTO_DONE' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'CANCEL_SESSION' }
  | { type: 'RETAKE_PHOTO'; index: number }
  | { type: 'CONFIRM_PHOTOS' }
  | { type: 'PROCESSING_COMPLETE'; compositePath: string }
  | { type: 'UPLOAD_COMPLETE'; driveFileId: string; downloadLink: string; qrCodeDataUrl: string }
  | { type: 'RESET_SESSION' }
  | { type: 'SET_ERROR'; error: string }

export const createInitialSession = (): CaptureSession => ({
  id: '',
  state: 'selecting-frame',
  frameId: null,
  totalPhotos: 0,
  currentPhotoIndex: 0,
  capturedPhotos: [],
  countdownValue: 5,
  countdownConfig: null,
  autoSequenceEnabled: false,
  compositePath: null,
  driveFileId: null,
  downloadLink: null,
  qrCodeDataUrl: null,
  error: null
})

export function sessionReducer(state: CaptureSession, action: SessionAction): CaptureSession {
  switch (action.type) {
    case 'SELECT_FRAME':
      return {
        ...createInitialSession(),
        id: `session-${Date.now()}`,
        state: 'idle',
        frameId: action.frame.id,
        totalPhotos: action.frame.imageCaptures,
        currentPhotoIndex: 0
      }

    case 'CONFIGURE_COUNTDOWN':
      return {
        ...state,
        countdownConfig: action.config,
        countdownValue: action.config.duration
      }

    case 'ENABLE_AUTO_SEQUENCE':
      return {
        ...state,
        autoSequenceEnabled: true
      }

    case 'START_COUNTDOWN': {
      const duration = state.countdownConfig?.duration || 5
      return {
        ...state,
        state: 'countdown',
        countdownValue: duration,
        error: null
      }
    }

    case 'COUNTDOWN_TICK':
      return {
        ...state,
        countdownValue: action.value
      }

    case 'CAPTURE_START':
      return {
        ...state,
        state: 'capturing'
      }

    case 'CAPTURE_COMPLETE': {
      const isRetake = state.capturedPhotos.some(p => p.index === action.photo.index)
      let newPhotos = [...state.capturedPhotos]

      if (isRetake) {
        newPhotos = newPhotos.map(p => p.index === action.photo.index ? action.photo : p)
      } else {
        newPhotos.push(action.photo)
      }

      // Sort by index
      newPhotos.sort((a, b) => a.index - b.index)

      return {
        ...state,
        state: 'photo-preview',
        capturedPhotos: newPhotos
      }
    }

    case 'CAPTURE_ERROR':
      return {
        ...state,
        state: 'error',
        error: action.error
      }

    case 'PHOTO_PREVIEW_DONE': {
      const isComplete = state.capturedPhotos.length >= state.totalPhotos

      if (isComplete) {
        return {
          ...state,
          state: 'review-all'
        }
      }

      // Auto-sequence enabled: go to inter-photo pause
      if (state.autoSequenceEnabled) {
        return {
          ...state,
          state: 'inter-photo'
        }
      }

      // Manual mode: return to idle, wait for user to press capture again
      const nextIndex = state.currentPhotoIndex + 1
      return {
        ...state,
        state: 'idle',
        currentPhotoIndex: nextIndex
      }
    }

    case 'INTER_PHOTO_START':
      return {
        ...state,
        state: 'inter-photo'
      }

    case 'INTER_PHOTO_DONE': {
      const nextIndex = state.currentPhotoIndex + 1
      return {
        ...state,
        state: 'countdown', // Auto-start next countdown
        currentPhotoIndex: nextIndex,
        countdownValue: state.countdownConfig?.duration || 5
      }
    }

    case 'PAUSE_SESSION':
      return {
        ...state,
        state: 'paused'
      }

    case 'RESUME_SESSION':
      return {
        ...state,
        state: 'idle'
      }

    case 'CANCEL_SESSION':
      return createInitialSession()

    case 'RETAKE_PHOTO':
      return {
        ...state,
        state: 'idle',
        currentPhotoIndex: action.index,
        autoSequenceEnabled: false // Disable auto-sequence for retake
      }

    case 'CONFIRM_PHOTOS':
      return {
        ...state,
        state: 'processing'
      }

    case 'PROCESSING_COMPLETE':
      return {
        ...state,
        state: 'uploading',
        compositePath: action.compositePath
      }

    case 'UPLOAD_COMPLETE':
      return {
        ...state,
        state: 'qr-display',
        driveFileId: action.driveFileId,
        downloadLink: action.downloadLink,
        qrCodeDataUrl: action.qrCodeDataUrl
      }

    case 'RESET_SESSION':
      return createInitialSession()

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error
      }

    default:
      return state
  }
}
