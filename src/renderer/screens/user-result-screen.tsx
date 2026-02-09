/**
 * User Result Screen - Gen-Z Vibrant Design
 * Displays final composite photo and QR code for download
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import { CompositeImageDisplay } from '../components/user-result-composite-image-display'
import { QRSection } from '../components/user-result-qr-section'
import { ResultActionButtons } from '../components/user-result-action-buttons'
import { AnimatedBackgroundOrbs } from '../components/animated-background-orbs'
import { UserResultHeader } from '../components/user-result-header'
import Confetti from 'react-confetti'

interface LocationState {
  sessionId: string
  compositePath?: string
  downloadUrl?: string
}

export function UserResultScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, downloadUrl } = (location.state as LocationState) || {}

  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (!sessionId) {
      navigate('/user/select-frame')
      return
    }

    // Load composite image
    const loadComposite = async () => {
      try {
        setIsLoading(true)
        console.log('[RENDERER] Loading composite for session:', sessionId)
        const dataUrl = await window.electronAPI.session.getComposite(sessionId)
        console.log('[RENDERER] Composite loaded, data URL length:', dataUrl?.length)
        console.log('[RENDERER] Data URL prefix:', dataUrl?.substring(0, 100))
        setCompositeDataUrl(dataUrl)
      } catch (err) {
        console.error('[RENDERER] Failed to load composite:', err)
        setError('Không thể tải ảnh. Vui lòng thử lại!')
      } finally {
        setIsLoading(false)
      }
    }

    loadComposite()

    // Hide confetti after 5 seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(confettiTimer)
  }, [sessionId, navigate])

  const handleRetake = () => {
    // Go back to frame selection to start over
    navigate('/user/select-frame')
  }

  const handleNewSession = async () => {
    // Create new session and navigate to frame selection
    try {
      await window.electronAPI.session.create()
      navigate('/user/select-frame')
    } catch (err) {
      console.error('Failed to create new session:', err)
      navigate('/user/select-frame')
    }
  }

  const finalDownloadUrl = downloadUrl || ''
  const hasQrLink = finalDownloadUrl.length > 0

  const handleOpenFolder = async () => {
    if (!sessionId) return
    try {
      await window.electronAPI.session.openFolder(sessionId)
    } catch (err) {
      console.error('Failed to open folder:', err)
    }
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white p-8"
        style={{
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
        }}
      >
        <div className="text-center">
          <p className="text-2xl text-red-400 mb-8">{error}</p>
          <button
            onClick={handleRetake}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-xl"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white p-8 flex flex-col relative overflow-hidden"
      style={{
        fontFamily: 'var(--font-body)',
        background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 25%, #1a2535 50%, #1f2937 100%)'
      }}
    >
      {/* Confetti celebration */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={false}
          colors={['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981']}
        />
      )}

      {/* Animated background orbs */}
      <AnimatedBackgroundOrbs />

      {/* Header */}
      <UserResultHeader hasQrLink={hasQrLink} mounted={mounted} />

      {/* Main content */}
      <div className="flex-1 flex gap-8 relative z-10 items-center justify-center">
        {/* Left: Composite Image */}
        <div
          className={`transition-all duration-700 flex items-center justify-center ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <CompositeImageDisplay
            compositeDataUrl={compositeDataUrl}
            isLoading={isLoading}
            onOpenFolder={handleOpenFolder}
          />
        </div>

        {/* Right: QR Code or Fallback Message */}
        <QRSection
          downloadUrl={finalDownloadUrl}
          hasQrLink={hasQrLink}
          mounted={mounted}
        />
      </div>

      {/* Download button */}
      <div className="relative z-10 flex justify-center mt-8">
        <button
          onClick={handleOpenFolder}
          className="group relative cursor-pointer"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-3xl blur-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 group-hover:opacity-70 transition-opacity" />

          {/* Button content */}
          <div
            className="relative flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 text-white group-hover:scale-105"
            style={{
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Download className="w-7 h-7" />
            <span>Tải ảnh về</span>
          </div>
        </button>
      </div>

      {/* Action buttons */}
      <ResultActionButtons
        onRetake={handleRetake}
        onNewSession={handleNewSession}
      />

    </div>
  )
}
