/**
 * Capture session state machine hook
 * Orchestrates the full capture flow: frame selection → countdown → capture → preview → confirm
 */

import { useReducer, useCallback, useRef, useEffect } from 'react'
import type { Frame } from '../../shared/types/frame-types'
import type { CapturedPhoto } from '../../shared/types/session-types'
import { createInitialSession, sessionReducer } from '../../shared/types/session-types'

const COUNTDOWN_SECONDS = 3
const PHOTO_PREVIEW_DURATION_MS = 1500

export function useCaptureSessionStateMachine() {
  const [session, dispatch] = useReducer(sessionReducer, null, createInitialSession)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRetakingRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [])

  // Select a frame and start the session
  const selectFrame = useCallback((frame: Frame) => {
    dispatch({ type: 'SELECT_FRAME', frame })
  }, [])

  // Start countdown (3-2-1)
  const startCountdown = useCallback(() => {
    dispatch({ type: 'START_COUNTDOWN' })

    let count = COUNTDOWN_SECONDS
    countdownIntervalRef.current = setInterval(() => {
      count--
      if (count > 0) {
        dispatch({ type: 'COUNTDOWN_TICK', value: count })
      } else {
        // Countdown finished, start capture
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        dispatch({ type: 'CAPTURE_START' })
      }
    }, 1000)
  }, [])

  // Handle successful capture
  const onCaptureComplete = useCallback((filePath: string, previewUrl?: string) => {
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
    }, PHOTO_PREVIEW_DURATION_MS)
  }, [session.currentPhotoIndex])

  // Handle capture error
  const onCaptureError = useCallback((error: string) => {
    dispatch({ type: 'CAPTURE_ERROR', error })
  }, [])

  // Retake a specific photo
  const retakePhoto = useCallback((index: number) => {
    isRetakingRef.current = true
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
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
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
    startCountdown,
    onCaptureComplete,
    onCaptureError,
    retakePhoto,
    confirmPhotos,
    onProcessingComplete,
    onUploadComplete,
    resetSession,
    setError,
    // Computed
    isCapturing,
    isCountingDown,
    canRetake,
    shotProgress,
    isRetaking
  }
}
