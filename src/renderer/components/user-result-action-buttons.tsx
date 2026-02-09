/**
 * Result Action Buttons Component
 * Retake and New Session buttons for the result screen
 */

import { Camera, Zap } from 'lucide-react'

interface ResultActionButtonsProps {
  onRetake: () => void
  onNewSession: () => void
}

export function ResultActionButtons({ onRetake, onNewSession }: ResultActionButtonsProps) {
  return (
    <div className="relative z-10 flex gap-6 justify-center mt-6">
      {/* Retake button */}
      <button
        onClick={onRetake}
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
        onClick={onNewSession}
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
  )
}
