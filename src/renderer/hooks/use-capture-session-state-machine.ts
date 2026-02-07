/**
 * Capture session state machine hook
 * Orchestrates the full capture flow with date-based timers and auto-sequence mode
 */

import { useReducer, useCallback, useRef, useEffect } from 'react'
import type { Frame } from '../../shared/types/frame-types'
import type { CapturedPhoto } from '../../shared/types/session-types'
import type { CountdownConfig } from '../../shared/types/countdown-types'
import { createInitialSession, sessionReducer } from '../../shared/types/session-types'

const PHOTO_PREVIEW_DURATION_MS = 1500
const INTER_PHOTO_PAUSE_MS = 2000
const CAPTURE_TIMEOUT_MS = 15000  // Reduced from 30s - if autofocus fails, user shouldn't wait too long

export function useCaptureSessionStateMachine() {
  const [session, dispatch] = useReducer(sessionReducer, null, createInitialSession)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const interPhotoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRetakingRef = useRef(false)
  const countdownTargetTimeRef = useRef<number>(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [])

  const clearAllTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
    if (interPhotoTimeoutRef.current) {
      clearTimeout(interPhotoTimeoutRef.current)
      interPhotoTimeoutRef.current = null
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current)
      captureTimeoutRef.current = null
    }
  }

  // Select a frame and start the session
  const selectFrame = useCallback((frame: Frame) => {
    dispatch({ type: 'SELECT_FRAME', frame })
  }, [])

  // Configure countdown (called from countdown selection screen)
  const configureCountdown = useCallback((config: CountdownConfig) => {
    dispatch({ type: 'CONFIGURE_COUNTDOWN', config })
  }, [])

  // Enable auto-sequence mode
  const enableAutoSequence = useCallback(() => {
    dispatch({ type: 'ENABLE_AUTO_SEQUENCE' })
  }, [])

  // Start countdown with date-based timer (no drift)
  const startCountdown = useCallback(() => {
    dispatch({ type: 'START_COUNTDOWN' })

    const duration = session.countdownConfig?.duration || 5
    countdownTargetTimeRef.current = Date.now() + (duration * 1000)

    // Check every 100ms for accuracy, update UI only on second changes
    let lastValue = duration
    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.ceil((countdownTargetTimeRef.current - Date.now()) / 1000)

      if (remaining > 0 && remaining !== lastValue) {
        lastValue = remaining
        dispatch({ type: 'COUNTDOWN_TICK', value: remaining })
      } else if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        dispatch({ type: 'CAPTURE_START' })

        // Set capture timeout (30s)
        captureTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'CAPTURE_ERROR', error: 'Capture timeout - camera not responding' })
        }, CAPTURE_TIMEOUT_MS)
      }
    }, 100)
  }, [session.countdownConfig])

  // Handle successful capture
  const onCaptureComplete = useCallback((filePath: string, previewUrl?: string) => {
    // Clear capture timeout
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current)
      captureTimeoutRef.current = null
    }

    const photo: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      index: session.currentPhotoIndex,
      path: filePath,
      previewUrl: previewUrl || `file://${filePath}`,
      capturedAt: new Date()
    }

    dispatch({ type: 'CAPTURE_COMPLETE', photo })

    // Show preview for a short time, then proceed
    previewTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'PHOTO_PREVIEW_DONE' })
      isRetakingRef.current = false

      // If auto-sequence and more photos needed, start inter-photo pause
      if (session.autoSequenceEnabled && session.capturedPhotos.length + 1 < session.totalPhotos) {
        interPhotoTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'INTER_PHOTO_DONE' })
          // Auto-start next countdown after inter-photo
          setTimeout(() => {
            startCountdown()
          }, 50)
        }, INTER_PHOTO_PAUSE_MS)
      }
    }, PHOTO_PREVIEW_DURATION_MS)
  }, [session.currentPhotoIndex, session.autoSequenceEnabled, session.capturedPhotos.length, session.totalPhotos, startCountdown])

  // Handle capture error
  const onCaptureError = useCallback((error: string) => {
    // Clear capture timeout
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current)
      captureTimeoutRef.current = null
    }
    dispatch({ type: 'CAPTURE_ERROR', error })
  }, [])

  // Pause session
  const pauseSession = useCallback(() => {
    clearAllTimers()
    dispatch({ type: 'PAUSE_SESSION' })
  }, [])

  // Resume session
  const resumeSession = useCallback(() => {
    dispatch({ type: 'RESUME_SESSION' })
  }, [])

  // Cancel session
  const cancelSession = useCallback(() => {
    clearAllTimers()
    dispatch({ type: 'CANCEL_SESSION' })
  }, [])

  // Retake a specific photo
  const retakePhoto = useCallback((index: number) => {
    isRetakingRef.current = true
    clearAllTimers()
    dispatch({ type: 'RETAKE_PHOTO', index })
  }, [])

  // Confirm all photos and proceed to processing
  const confirmPhotos = useCallback(() => {
    dispatch({ type: 'CONFIRM_PHOTOS' })
  }, [])

  // Processing complete - move to upload
  const onProcessingComplete = useCallback((compositePath: string) => {
    dispatch({ type: 'PROCESSING_COMPLETE', compositePath })
  }, [])

  // Upload complete - show QR
  const onUploadComplete = useCallback(
    (driveFileId: string, downloadLink: string, qrCodeDataUrl: string) => {
      dispatch({
        type: 'UPLOAD_COMPLETE',
        driveFileId,
        downloadLink,
        qrCodeDataUrl
      })
    },
    []
  )

  // Reset the session for a new user
  const resetSession = useCallback(() => {
    clearAllTimers()
    isRetakingRef.current = false
    dispatch({ type: 'RESET_SESSION' })
  }, [])

  // Set error
  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', error })
  }, [])

  // Computed values
  const isCapturing = session.state === 'capturing'
  const isCountingDown = session.state === 'countdown'
  const isPaused = session.state === 'paused'
  const isInterPhoto = session.state === 'inter-photo'
  const canRetake = session.state === 'review-all'
  const shotProgress = {
    current: session.currentPhotoIndex + 1,
    total: session.totalPhotos
  }
  const isRetaking = isRetakingRef.current

  return {
    session,
    // Actions
    selectFrame,
    configureCountdown,
    enableAutoSequence,
    startCountdown,
    onCaptureComplete,
    onCaptureError,
    pauseSession,
    resumeSession,
    cancelSession,
    retakePhoto,
    confirmPhotos,
    onProcessingComplete,
    onUploadComplete,
    resetSession,
    setError,
    // Computed
    isCapturing,
    isCountingDown,
    isPaused,
    isInterPhoto,
    canRetake,
    shotProgress,
    isRetaking
  }
}
