import { useEffect, useState } from 'react'
import { Frame } from '../../shared/types/frame-types'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Camera } from 'lucide-react'

export function UserFrameSelectionScreen() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadFrames()
  }, [])

  const loadFrames = async () => {
    try {
      const allFrames = await window.electronAPI.frames.getAll()
      setFrames(allFrames)
    } catch (e) {
      console.error('Failed to load frames:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFrame = (frameId: string) => {
    navigate(`/user/countdown/${frameId}`)
  }

  return (
    <div
      className="min-h-screen text-white p-8 flex flex-col relative overflow-hidden"
      style={{
        fontFamily: 'var(--font-body)',
        background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 25%, #1a2535 50%, #1f2937 100%)'
      }}
    >
      {/* Animated gradient orbs background */}
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
            background: 'radial-gradient(circle, #F97316 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse-glow 4s ease-in-out infinite'
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center mb-8 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 mr-6 transition-all duration-200 cursor-pointer hover:scale-105 border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-pink-400" />
          <h1
            className="text-4xl font-bold"
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(236, 72, 153, 0.3)'
            }}
          >
            Chọn Khung Hình Siêu Cute
          </h1>
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center relative z-10">
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
              Đang tải khung hình...
            </p>
          </div>
        </div>
      ) : frames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 relative z-10">
          <Camera className="w-24 h-24 mb-4 text-purple-400/50" />
          <p className="text-xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Chưa có khung hình nào</p>
          <p className="text-gray-500">Hãy nhờ nhân viên thêm khung hình vào hệ thống nhé!</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 overflow-y-auto pb-8 relative z-10">
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              onClick={() => handleSelectFrame(frame.id)}
              className="group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03]"
              style={{
                width: '280px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                animation: `fade-slide-up 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Glow effect on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                  boxShadow: '0 0 40px rgba(168, 139, 250, 0.4), inset 0 0 40px rgba(236, 72, 153, 0.1)'
                }}
              />

              <div className="aspect-[2/3] w-full bg-gray-900/50 relative">
                <img
                  src={`file://${frame.backgroundPath}`}
                  alt={frame.name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=No+Preview'
                  }}
                />

                {/* Hover overlay with cute button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-8">
                  <span
                    className="px-8 py-3 rounded-full font-bold transform scale-90 group-hover:scale-100 transition-all duration-300 flex items-center gap-2"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                      boxShadow: '0 4px 20px rgba(236, 72, 153, 0.5)'
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Chọn Ngay!
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3
                  className="text-xl font-bold truncate text-white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {frame.name}
                </h3>
                <div className="flex justify-between mt-2 text-sm text-purple-300/70">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {frame.imageCaptures} lần chụp
                  </span>
                  <span>📐 {frame.width}x{frame.height}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
