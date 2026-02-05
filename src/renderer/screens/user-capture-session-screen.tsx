/**
 * Main user capture session screen - Gen-Z Edition
 * Orchestrates: live preview → countdown → capture → photo preview → review all
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Sparkles, Camera, Heart, Star } from 'lucide-react'
import type { Frame } from '../../shared/types/frame-types'
import { useCaptureSessionStateMachine } from '../hooks/use-capture-session-state-machine'
import { useCameraConnection } from '../hooks/use-camera-connection'
import { DccLiveView } from '../components/dcc-live-view'
import { CountdownOverlayFullscreen, CaptureFlashEffect } from '../components/countdown-overlay-fullscreen'
import { CapturedPhotosPreviewGrid } from '../components/captured-photos-preview-grid'

export function UserCaptureSessionScreen() {
  const { frameId } = useParams<{ frameId: string }>()
  const navigate = useNavigate()

  const [frame, setFrame] = useState<Frame | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFlash, setShowFlash] = useState(false)
  const [dccAvailable, setDccAvailable] = useState(false)

  const {
    session,
    selectFrame,
    startCountdown,
    onCaptureComplete,
    onCaptureError,
    retakePhoto,
    confirmPhotos,
    resetSession,
    isCapturing,
    isCountingDown,
    shotProgress
  } = useCaptureSessionStateMachine()

  const { connect, capture, status: cameraStatus } = useCameraConnection()

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
        selectFrame(loadedFrame)

        const available = await window.electronAPI.camera.checkDccAvailable()
        setDccAvailable(available)

        if (available) {
          await connect()
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

  const performCapture = async () => {
    try {
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 300)

      const result = await capture()

      if (result.success && result.filePath) {
        onCaptureComplete(result.filePath, result.previewUrl)
      } else {
        onCaptureError(result.error || 'Capture failed')
      }
    } catch (err) {
      onCaptureError(String(err))
    }
  }

  const handleStartCapture = useCallback(() => {
    startCountdown()
  }, [startCountdown])

  const handleConfirm = useCallback(() => {
    confirmPhotos()
    navigate('/user/processing', {
      state: {
        frameId: frame?.id,
        photos: session.capturedPhotos
      }
    })
  }, [confirmPhotos, navigate, frame, session.capturedPhotos])

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

  // Review all photos state
  if (session.state === 'review-all') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          fontFamily: 'var(--font-body)',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <CapturedPhotosPreviewGrid
          photos={session.capturedPhotos}
          totalSlots={session.totalPhotos}
          onRetake={retakePhoto}
          onConfirm={handleConfirm}
          canRetake={true}
        />

        <button
          onClick={handleCancel}
          className="fixed bottom-8 left-8 flex items-center gap-2 px-6 py-3 rounded-2xl text-white transition-all duration-200 cursor-pointer hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <X className="w-5 h-5" />
          Hủy
        </button>
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

  // Main capture view
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Live view */}
      <div className="absolute inset-0">
        {dccAvailable ? (
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
            Nhấn để chụp
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
