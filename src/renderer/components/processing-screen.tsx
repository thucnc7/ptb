/**
 * Processing screen with animated progress
 * Shows while compositing photos
 */

import { useEffect, useState } from 'react'
import { Sparkles, Zap, Star } from 'lucide-react'

interface ProcessingScreenProps {
  message?: string
  progress?: number // 0-100
}

export function ProcessingScreen({ message = 'Đang xử lý ma thuật...', progress }: ProcessingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (progress !== undefined) {
      setDisplayProgress(progress)
    } else {
      // Fake progress animation if real progress not provided
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev >= 95) return prev
          return prev + Math.random() * 10
        })
      }, 300)

      return () => clearInterval(interval)
    }
  }, [progress])

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: 'var(--font-body)',
        background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a2535 100%)'
      }}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
            top: '-100px',
            right: '-50px',
            animation: 'float-slow 6s ease-in-out infinite'
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
            bottom: '-100px',
            left: '-50px',
            animation: 'float-slow 8s ease-in-out infinite reverse'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 max-w-2xl">
        {/* Spinning icons */}
        <div className="flex justify-center gap-6 mb-8" style={{ animation: 'bounce-slow 2s ease-in-out infinite' }}>
          <Sparkles className="w-12 h-12 text-pink-400" style={{ animation: 'spin-slow 3s linear infinite' }} />
          <Zap className="w-16 h-16 text-purple-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Star className="w-12 h-12 text-cyan-400" style={{ animation: 'spin-slow 3s linear infinite reverse' }} />
        </div>

        {/* Title */}
        <h2
          className="text-5xl font-bold mb-6"
          style={{
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {message}
        </h2>

        {/* Progress bar */}
        <div
          className="w-full h-4 rounded-full overflow-hidden mb-4"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${displayProgress}%`,
              background: 'linear-gradient(90deg, #EC4899 0%, #8B5CF6 50%, #06B6D4 100%)',
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)'
            }}
          />
        </div>

        {/* Progress percentage */}
        <p className="text-purple-300 text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          {Math.round(displayProgress)}%
        </p>

        {/* Subtitle */}
        <p className="text-gray-400 mt-4 text-lg">
          Chờ tí xíu thôi nha, sắp xong rồi! ✨
        </p>
      </div>

      {/* Inline styles */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
