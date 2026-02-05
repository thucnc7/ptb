import { Frame } from './frame-types'

export type SessionState =
  | 'selecting-frame'
  | 'idle'           // Ready to start
  | 'countdown'      // 3-2-1
  | 'capturing'      // Saving photo
  | 'photo-preview'  // Brief preview of just captured photo
  | 'review-all'     // Session complete, review all photos
  | 'processing'     // Compositing
  | 'uploading'      // Uploading to drive
  | 'qr-display'     // Show QR code
  | 'error'

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
  compositePath: string | null
  driveFileId: string | null
  downloadLink: string | null
  qrCodeDataUrl: string | null
  error: string | null
}

export type SessionAction =
  | { type: 'SELECT_FRAME'; frame: Frame }
  | { type: 'START_COUNTDOWN' }
  | { type: 'COUNTDOWN_TICK'; value: number }
  | { type: 'CAPTURE_START' }
  | { type: 'CAPTURE_COMPLETE'; photo: CapturedPhoto }
  | { type: 'CAPTURE_ERROR'; error: string }
  | { type: 'PHOTO_PREVIEW_DONE' }
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
  countdownValue: 3,
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

    case 'START_COUNTDOWN':
      return {
        ...state,
        state: 'countdown',
        countdownValue: 3,
        error: null
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

      // Sort by index to be safe
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
      // If we have all photos, go to review all
      // Unless we are retaking a specific index, then go to review all
      // Actually, if we are in sequence, we check if next index < total

      const nextIndex = state.currentPhotoIndex + 1
      const isComplete = state.capturedPhotos.length >= state.totalPhotos

      // If we just did a retake (how do we know? logic in machine or hook)
      // The hook handles 'isRetakingRef'.
      // But purely state wise:
      // If we have all photos, we review.

      if (isComplete) {
        return {
          ...state,
          state: 'review-all'
        }
      }

      // Else proceed to next
      return {
        ...state,
        state: 'idle', // Ready for next countdown
        currentPhotoIndex: nextIndex
      }
    }

    case 'RETAKE_PHOTO':
      return {
        ...state,
        state: 'idle',
        currentPhotoIndex: action.index,
        // We keep the photos, just reset state to idle to allow Start Countdown
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
