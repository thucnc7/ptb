/**
 * Main user capture session screen - Gen-Z Edition
 * Orchestrates: live preview → countdown → capture → photo preview → review all
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { X, Sparkles, Camera, Heart, Star } from 'lucide-react'
import type { Frame } from '../../shared/types/frame-types'
import type { CountdownConfig } from '../../shared/types/countdown-types'
import { useCaptureSessionStateMachine } from '../hooks/use-capture-session-state-machine'
import { useCameraConnection } from '../hooks/use-camera-connection'
import { useAudioFeedback } from '../hooks/use-audio-feedback'
import { DccLiveView } from '../components/dcc-live-view'
import { WebcamLiveView, type WebcamLiveViewRef } from '../components/webcam-live-view'
import { CountdownOverlayFullscreen, CaptureFlashEffect } from '../components/countdown-overlay-fullscreen'
import { PhotoSelectionPanel } from '../components/photo-selection-panel'
import { useVideoRecorder } from '../hooks/use-video-recorder'

export function UserCaptureSessionScreen() {
  const { frameId } = useParams<{ frameId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const countdownConfig = location.state?.countdownConfig as CountdownConfig | undefined

  const [frame, setFrame] = useState<Frame | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFlash, setShowFlash] = useState(false)
  const [dccAvailable, setDccAvailable] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const {
    session,
    selectFrame,
    configureCountdown,
    enableAutoSequence,
    startCountdown,
    onCaptureComplete,
    onCaptureError,
    confirmPhotos,
    resetSession,
    isCapturing,
    isCountingDown,
    shotProgress
  } = useCaptureSessionStateMachine()

  const { connect, capture, cameraMode, webcamCapture } = useCameraConnection()
  const webcamRef = useRef<WebcamLiveViewRef>(null)
  const { startRecording, stopRecording, isRecording, videoPath } = useVideoRecorder(sessionId)
  const recordingStartedRef = useRef(false)
  const {
    playCountdownTick,
    playShutterSound,
    playSuccessSound,
    playStartSound
  } = useAudioFeedback()

  // Load frame and initialize
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)

        if (!frameId) {
          navigate('/user/select-frame')
          return
        }

        const loadedFrame = await window.electronAPI.frames.getById(frameId)
        if (!loadedFrame) {
          navigate('/user/select-frame')
          return
        }

        setFrame(loadedFrame)

        // Fetch extraPhotos setting for total capture count (fallback to 3 if settings API not available)
        let extraPhotos = 3
        try {
          extraPhotos = await window.electronAPI.settings.getExtraPhotos()
        } catch (e) {
          console.warn('Failed to fetch extraPhotos, using default:', e)
        }
        selectFrame(loadedFrame, extraPhotos)

        // Create backend session for storing photos
        const newSession = await window.electronAPI.session.create()
        setSessionId(newSession.id)
        console.log('Created session:', newSession.id)

        // Configure countdown from selection screen
        if (countdownConfig) {
          configureCountdown(countdownConfig)
          enableAutoSequence() // Enable auto-sequence mode
        }

        // Non-DCC modes: skip DCC check, auto-connect
        const mode = await window.electronAPI.camera.getMode()
        if (mode === 'webcam' || mode === 'mock') {
          setDccAvailable(true) // non-DCC modes are always "available"
          await connect()
        } else {
          const available = await window.electronAPI.camera.checkDccAvailable()
          setDccAvailable(available)
          if (available) {
            await connect()
          }
        }
      } catch (err) {
        console.error('Failed to initialize capture session:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [frameId, navigate, selectFrame, connect])

  // Handle capture when in capturing state
  useEffect(() => {
    if (session.state === 'capturing') {
      performCapture()
    }
  }, [session.state])

  // Restore Live View when returning to idle state
  useEffect(() => {
    if (session.state === 'idle' && dccAvailable) {
      console.log('Restoring Live View...')
      window.electronAPI.camera.startLiveView()
        .catch(e => console.error('Failed to restore live view:', e))
    }
  }, [session.state, dccAvailable])

  // Start video recording on first countdown (when webcam stream available)
  useEffect(() => {
    if (session.state === 'countdown' && !recordingStartedRef.current) {
      const stream = webcamRef.current?.getStream()
      if (stream) {
        startRecording(stream)
        recordingStartedRef.current = true
      }
    }
  }, [session.state, startRecording])

  // Stop video recording when entering photo-selection
  useEffect(() => {
    if (session.state === 'photo-selection' && recordingStartedRef.current) {
      stopRecording()
      recordingStartedRef.current = false
    }
  }, [session.state, stopRecording])

  // Play countdown tick sound
  useEffect(() => {
    if (session.state === 'countdown' && session.countdownValue > 0) {
      playCountdownTick(session.countdownValue)
    }
  }, [session.countdownValue, session.state, playCountdownTick])

  // Play success sound after capture
  useEffect(() => {
    if (session.state === 'photo-preview') {
      playSuccessSound()
    }
  }, [session.state, playSuccessSound])

  const performCapture = async () => {
    console.log('[DEBUG-UI] performCapture() started, state:', session.state)
    try {
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 300)

      // Play shutter sound
      playShutterSound()

      console.log('[DEBUG-UI] Calling capture()...')
      const captureStart = Date.now()

      let result
      if (cameraMode === 'webcam' && webcamRef.current) {
        const frameData = await webcamRef.current.captureFrame()
        result = await webcamCapture(frameData)
      } else {
        result = await capture()
      }
      console.log('[DEBUG-UI] capture() returned in', Date.now() - captureStart, 'ms:', result)

      if (result.success && result.filePath) {
        // Save photo to backend session
        if (sessionId) {
          try {
            console.log('[DEBUG-UI] Saving photo to session...')
            await window.electronAPI.session.savePhoto(
              sessionId,
              session.currentPhotoIndex,
              result.filePath
            )
            console.log(`[DEBUG-UI] Saved photo ${session.currentPhotoIndex} to session ${sessionId}`)
          } catch (saveErr) {
            console.error('[DEBUG-UI] Failed to save photo to session:', saveErr)
          }
        }
        console.log('[DEBUG-UI] Calling onCaptureComplete...')
        onCaptureComplete(result.filePath, result.previewUrl)
        console.log('[DEBUG-UI] onCaptureComplete done')
      } else {
        console.log('[DEBUG-UI] Capture failed:', result.error)
        onCaptureError(result.error || 'Capture failed')
      }
    } catch (err) {
      console.error('[DEBUG-UI] performCapture error:', err)
      onCaptureError(String(err))
    }
  }

  const handleStartCapture = useCallback(() => {
    playStartSound()
    startCountdown()
  }, [startCountdown, playStartSound])

  const handleConfirmWithSelection = useCallback((selectedPhotoIndices: number[]) => {
    confirmPhotos(selectedPhotoIndices)
    navigate('/user/processing', {
      state: {
        sessionId,
        frameId: frame?.id,
        frame,
        selectedPhotoIndices,
        videoPath
      }
    })
  }, [confirmPhotos, navigate, frame, sessionId, videoPath])

  const handleCancel = useCallback(() => {
    resetSession()
    navigate('/user/select-frame')
  }, [resetSession, navigate])

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-4"
            style={{
              border: '4px solid rgba(168, 139, 250, 0.3)',
              borderTopColor: '#A78BFA',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <p className="text-purple-300 text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Đang khởi tạo...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Error state - show error message and retry option
  if (session.state === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <div className="text-center max-w-md">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid rgba(239, 68, 68, 0.5)'
            }}
          >
            <Camera className="w-12 h-12 text-red-400" />
          </div>
          <h2
            className="text-3xl font-bold mb-4 text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Chụp ảnh thất bại
          </h2>
          <p className="text-gray-400 mb-8">
            {session.error || 'Không thể chụp ảnh. Vui lòng kiểm tra camera và thử lại.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={async () => {
                // Reset error and go back to idle to retry
                resetSession()
                if (frame) {
                  const extraPhotos = await window.electronAPI.settings.getExtraPhotos()
                  selectFrame(frame, extraPhotos)
                  if (countdownConfig) {
                    configureCountdown(countdownConfig)
                    enableAutoSequence()
                  }
                }
              }}
              className="px-8 py-4 rounded-2xl font-bold text-white transition-all duration-200 cursor-pointer hover:scale-105"
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)'
              }}
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              Thử lại
            </button>
            <button
              onClick={handleCancel}
              className="px-8 py-4 rounded-2xl font-bold text-white transition-all duration-200 cursor-pointer hover:scale-105"
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <X className="w-5 h-5 inline mr-2" />
              Hủy
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Photo selection state: user picks best N photos from N+extra captures
  if (session.state === 'photo-selection' && frame) {
    return (
      <div
        className="min-h-screen"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <PhotoSelectionPanel
          capturedPhotos={session.capturedPhotos}
          frame={frame}
          onConfirm={handleConfirmWithSelection}
        />
      </div>
    )
  }

  // Photo preview state (brief display after each capture)
  if (session.state === 'photo-preview') {
    const lastPhoto = session.capturedPhotos[session.capturedPhotos.length - 1]
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <div className="text-center">
          {lastPhoto && (
            <div className="relative" style={{ animation: 'pop-in 0.3s ease-out' }}>
              <img
                src={lastPhoto.previewUrl}
                alt="Captured"
                className="max-h-[70vh] rounded-3xl"
                style={{
                  boxShadow: '0 20px 60px rgba(124, 58, 237, 0.4), 0 0 100px rgba(236, 72, 153, 0.2)'
                }}
              />
              <div
                className="absolute top-4 right-4 px-4 py-2 rounded-full font-bold flex items-center gap-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)'
                }}
              >
                <Heart className="w-5 h-5" />
                Đã chụp {shotProgress.current}/{shotProgress.total}
              </div>

              {/* Celebration particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <Star
                    key={i}
                    className="absolute text-yellow-400"
                    style={{
                      width: '24px',
                      height: '24px',
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 20}%`,
                      animation: `float-particle 2s ease-out ${i * 0.1}s infinite`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <style>{`
          @keyframes pop-in {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes float-particle {
            0% { opacity: 1; transform: translateY(0) rotate(0deg); }
            100% { opacity: 0; transform: translateY(-50px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

  // Inter-photo pause state (brief pause between auto-captures)
  if (session.state === 'inter-photo') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <div className="text-center">
          <div style={{ animation: 'pulse-scale 1s ease-in-out infinite' }}>
            <Sparkles className="w-24 h-24 text-pink-400 mx-auto mb-6" />
          </div>
          <h2
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Chuẩn bị tạo dáng tiếp nhé!
          </h2>
          <p className="text-purple-300 text-xl">
            Ảnh tiếp theo sẽ chụp ngay...
          </p>
        </div>
        <style>{`
          @keyframes pulse-scale {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
        `}</style>
      </div>
    )
  }

  // Main capture view
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Live view */}
      <div className="absolute inset-0">
        {cameraMode === 'webcam' ? (
          <WebcamLiveView ref={webcamRef} className="w-full h-full" mirror={true} />
        ) : dccAvailable ? (
          <DccLiveView className="w-full h-full" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)' }}
          >
            <div className="text-center">
              <Camera className="w-24 h-24 text-purple-400/50 mx-auto mb-4" />
              <p className="text-purple-300 text-xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Camera chưa kết nối
              </p>
              <p className="text-gray-500">Vui lòng liên hệ nhân viên</p>
            </div>
          </div>
        )}
      </div>

      {/* Shot progress indicator - cute pill design */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full flex items-center gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <Sparkles className="w-6 h-6 text-pink-400" />
        <span
          className="text-white text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Ảnh {shotProgress.current} / {shotProgress.total}
        </span>
        <Sparkles className="w-6 h-6 text-purple-400" />
      </div>

      {/* Frame name */}
      {frame && (
        <div
          className="absolute top-6 left-6 px-4 py-2 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <span className="text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {frame.name}
          </span>
        </div>
      )}

      {/* Capture button - pulsing animation */}
      {session.state === 'idle' && !isCapturing && !isCountingDown && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
          <button
            onClick={handleStartCapture}
            className="relative w-28 h-28 rounded-full cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              boxShadow: '0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
              animation: 'pulse-button 2s ease-in-out infinite'
            }}
          >
            {/* Inner white ring */}
            <div
              className="absolute inset-2 rounded-full border-4 border-white/80 group-hover:border-white transition-colors"
            />
            {/* Center dot */}
            <div
              className="absolute inset-6 rounded-full bg-white group-hover:scale-110 transition-transform"
            />
          </button>
          <p
            className="text-white/90 mt-4 text-lg"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {session.autoSequenceEnabled && shotProgress.current === 1
              ? 'Bắt đầu chụp liên tục'
              : 'Nhấn để chụp'}
          </p>
        </div>
      )}

      {/* Countdown overlay */}
      {isCountingDown && (
        <CountdownOverlayFullscreen value={session.countdownValue} />
      )}

      {/* Capture flash effect */}
      <CaptureFlashEffect active={showFlash} />

      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="absolute bottom-8 left-8 flex items-center gap-2 px-6 py-3 rounded-2xl text-white transition-all duration-200 cursor-pointer hover:scale-105"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <X className="w-5 h-5" />
        Hủy
      </button>

      {/* Captured photos thumbnails */}
      {session.capturedPhotos.length > 0 && (
        <div className="absolute bottom-8 right-8 flex gap-3">
          {session.capturedPhotos.map((photo, i) => (
            <div
              key={photo.id}
              className="w-16 h-20 rounded-xl overflow-hidden"
              style={{
                border: '2px solid rgba(168, 139, 250, 0.5)',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
                animation: `pop-in 0.3s ease-out ${i * 0.1}s both`
              }}
            >
              <img src={photo.previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Inline animations */}
      <style>{`
        @keyframes pulse-button {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(139, 92, 246, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(236, 72, 153, 0.7), 0 0 100px rgba(139, 92, 246, 0.5); }
        }
        @keyframes pop-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
