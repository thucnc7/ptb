/**
 * User Result Screen - Gen-Z Vibrant Design
 * Displays final composite photo and QR code for download
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Camera, Zap, Star, Heart } from 'lucide-react'
import { QRCodeDisplay } from '../components/qr-code-display'
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
        const dataUrl = await window.electronAPI.session.getComposite(sessionId)
        setCompositeDataUrl(dataUrl)
      } catch (err) {
        console.error('Failed to load composite:', err)
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

  const finalDownloadUrl = downloadUrl || `https://photobooth.app/download/${sessionId}`

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
            top: '-200px',
            right: '-100px',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
            bottom: '-150px',
            left: '-100px',
            animation: 'float 10s ease-in-out infinite reverse'
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse-glow 4s ease-in-out infinite'
          }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-12 h-12 text-yellow-400" fill="currentColor" />
          <h1
            className={`text-6xl font-bold transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
            }`}
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(245, 158, 11, 0.3)'
            }}
          >
            Xong rồi nè! 🎉
          </h1>
          <Heart className="w-12 h-12 text-pink-400" fill="currentColor" />
        </div>
        <p className="text-xl text-purple-300/80">
          Ảnh siêu đẹp của bạn đây! Quét mã QR để tải về nhé ✨
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-8 relative z-10 items-center justify-center">
        {/* Left: Composite Image */}
        <div
          className={`transition-all duration-700 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
              maxWidth: '600px',
              maxHeight: '800px'
            }}
          >
            {isLoading ? (
              <div className="w-[600px] h-[800px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Sparkles className="w-16 h-16 text-purple-400 animate-spin" />
                  <p className="text-xl text-purple-300">Đang tải ảnh...</p>
                </div>
              </div>
            ) : compositeDataUrl ? (
              <img
                src={compositeDataUrl}
                alt="Composite photo"
                className="w-full h-full object-contain"
                style={{ animation: 'fade-in 0.5s ease-out' }}
              />
            ) : (
              <div className="w-[600px] h-[800px] flex items-center justify-center">
                <p className="text-xl text-red-400">Không tải được ảnh</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: QR Code */}
        <div
          className={`transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}
        >
          <QRCodeDisplay
            url={finalDownloadUrl}
            size={280}
            showUrl={false}
          />

          {/* Fun message */}
          <div
            className="mt-6 p-6 rounded-2xl text-center"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-lg text-purple-200 font-medium">
              Dùng điện thoại quét QR nhé! 📱
            </p>
            <p className="text-sm text-purple-300/60 mt-2">
              Ảnh sẽ tự động tải về máy
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 flex gap-6 justify-center mt-8">
        {/* Retake button */}
        <button
          onClick={handleRetake}
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
            <Camera className="w-7 h-7" />
            <span>Chụp lại</span>
          </div>
        </button>

        {/* New session button */}
        <button
          onClick={handleNewSession}
          className="group relative cursor-pointer"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-3xl blur-lg bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50 group-hover:opacity-70 transition-opacity" />

          {/* Button content */}
          <div
            className="relative flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-500 text-white group-hover:scale-105"
            style={{
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 20px 60px rgba(6, 182, 212, 0.4)'
            }}
          >
            <Zap className="w-7 h-7" />
            <span>Chụp tiếp</span>
          </div>
        </button>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
