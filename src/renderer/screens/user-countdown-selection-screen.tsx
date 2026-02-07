/**
 * Countdown Selection Screen - Gen-Z Vibrant Design
 * Allows users to choose countdown timer: 3s, 5s, 10s, or custom (1-60s)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Sparkles, Zap, Star } from 'lucide-react'
import type { CountdownPreset, CountdownConfig } from '../../shared/types/countdown-types'
import { COUNTDOWN_PRESETS, MIN_COUNTDOWN, MAX_COUNTDOWN, DEFAULT_COUNTDOWN } from '../../shared/types/countdown-types'

export function UserCountdownSelectionScreen() {
  const { frameId } = useParams<{ frameId: string }>()
  const navigate = useNavigate()

  const [selectedPreset, setSelectedPreset] = useState<CountdownPreset | null>(DEFAULT_COUNTDOWN as CountdownPreset)
  const [customValue, setCustomValue] = useState<string>('5')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!frameId) {
      navigate('/user/select-frame')
    }
  }, [frameId, navigate])

  const handlePresetClick = (preset: CountdownPreset) => {
    setSelectedPreset(preset)
    setShowCustomInput(false)
    setCustomValue(String(preset))
  }

  const handleCustomClick = () => {
    setShowCustomInput(true)
    setSelectedPreset(null)
  }

  const handleCustomChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= MIN_COUNTDOWN && num <= MAX_COUNTDOWN) {
      setCustomValue(value)
    } else if (value === '') {
      setCustomValue('')
    }
  }

  const handleContinue = () => {
    const duration = showCustomInput
      ? parseInt(customValue, 10) || DEFAULT_COUNTDOWN
      : selectedPreset || DEFAULT_COUNTDOWN

    const config: CountdownConfig = {
      duration,
      preset: selectedPreset || undefined,
      isCustom: showCustomInput
    }

    navigate(`/user/capture/${frameId}`, { state: { countdownConfig: config } })
  }

  const isValid = showCustomInput
    ? customValue !== '' && parseInt(customValue, 10) >= MIN_COUNTDOWN && parseInt(customValue, 10) <= MAX_COUNTDOWN
    : selectedPreset !== null

  return (
    <div
      className="min-h-screen text-white p-8 flex flex-col relative overflow-hidden"
      style={{
        fontFamily: 'var(--font-body)',
        background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 25%, #1a2535 50%, #1f2937 100%)'
      }}
    >
      {/* Animated background */}
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
      <div className="flex items-center mb-12 relative z-10">
        <button
          onClick={() => navigate(`/user/select-frame`)}
          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 mr-6 transition-all duration-200 cursor-pointer hover:scale-105 border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <Clock className="w-10 h-10 text-cyan-400" />
          <h1
            className={`text-5xl font-bold transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
            }`}
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 50%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(6, 182, 212, 0.3)'
            }}
          >
            Chọn Thời Gian Đếm Ngược
          </h1>
          <Sparkles className="w-10 h-10 text-pink-400" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex justify-center relative z-10">
        {/* Preset options */}
        <div className="max-w-3xl w-full flex flex-col gap-6">
          <p className="text-xl text-purple-300/80 mb-4">
            Chọn thời gian đếm ngược trước khi chụp mỗi ảnh:
          </p>

          {/* Preset cards */}
          <div className="grid grid-cols-3 gap-6">
            {COUNTDOWN_PRESETS.map((preset, index) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedPreset === preset && !showCustomInput
                    ? 'ring-4 ring-cyan-400 ring-offset-4 ring-offset-transparent'
                    : ''
                }`}
                style={{
                  background: selectedPreset === preset && !showCustomInput
                    ? 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: selectedPreset === preset && !showCustomInput
                    ? '0 8px 32px rgba(6, 182, 212, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)'
                    : '0 8px 32px rgba(0, 0, 0, 0.3)',
                  animation: `fade-slide-up 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="p-8 text-center">
                  <Zap
                    className={`w-12 h-12 mx-auto mb-4 ${
                      selectedPreset === preset && !showCustomInput ? 'text-white' : 'text-cyan-400'
                    }`}
                  />
                  <div
                    className={`text-6xl font-bold mb-2 ${
                      selectedPreset === preset && !showCustomInput ? 'text-white' : 'text-white/90'
                    }`}
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {preset}
                  </div>
                  <div className={`text-sm ${selectedPreset === preset && !showCustomInput ? 'text-white/80' : 'text-purple-300/70'}`}>
                    giây
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedPreset === preset && !showCustomInput && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-cyan-500" fill="currentColor" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom input card */}
          <button
            onClick={handleCustomClick}
            className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              showCustomInput ? 'ring-4 ring-pink-400 ring-offset-4 ring-offset-transparent' : ''
            }`}
            style={{
              background: showCustomInput
                ? 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: showCustomInput
                ? '0 8px 32px rgba(236, 72, 153, 0.4), 0 0 60px rgba(249, 115, 22, 0.2)'
                : '0 8px 32px rgba(0, 0, 0, 0.3)',
              animation: 'fade-slide-up 0.5s ease-out 0.3s both'
            }}
          >
            <div className="p-6 flex items-center gap-6">
              <Sparkles className={`w-10 h-10 ${showCustomInput ? 'text-white' : 'text-pink-400'}`} />
              <div className="flex-1 text-left">
                <div
                  className={`text-2xl font-bold mb-1 ${showCustomInput ? 'text-white' : 'text-white/90'}`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Tùy Chỉnh
                </div>
                <div className={`text-sm ${showCustomInput ? 'text-white/80' : 'text-purple-300/70'}`}>
                  Nhập từ {MIN_COUNTDOWN}-{MAX_COUNTDOWN} giây
                </div>
              </div>

              {showCustomInput && (
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min={MIN_COUNTDOWN}
                    max={MAX_COUNTDOWN}
                    value={customValue}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    className="w-24 px-4 py-3 rounded-xl text-center text-2xl font-bold bg-white/20 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white"
                    style={{ fontFamily: 'var(--font-heading)' }}
                    placeholder="5"
                    autoFocus
                  />
                  <span className="text-white/80 text-lg">giây</span>
                </div>
              )}

              {showCustomInput && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-pink-500" fill="currentColor" />
                </div>
              )}
            </div>
          </button>
        </div>

      </div>

      {/* Continue button */}
      <div className="relative z-10 flex justify-center mt-8">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="group relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Glow effect */}
          <div
            className={`absolute -inset-1 rounded-3xl blur-lg transition-all duration-300 ${
              isValid ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-70 group-hover:opacity-100 animate-pulse' : 'opacity-0'
            }`}
          />

          {/* Button content */}
          <div
            className={`relative flex items-center gap-4 px-12 py-6 rounded-2xl font-bold text-2xl shadow-2xl transition-all duration-300 ${
              isValid ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white group-hover:scale-105' : 'bg-gray-700 text-gray-400'
            }`}
            style={{
              fontFamily: 'var(--font-heading)',
              boxShadow: isValid ? '0 20px 60px rgba(124, 58, 237, 0.4)' : 'none'
            }}
          >
            <Sparkles className="w-8 h-8" />
            <span>Bắt Đầu Chụp</span>
            <Zap className="w-8 h-8" />
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

        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
