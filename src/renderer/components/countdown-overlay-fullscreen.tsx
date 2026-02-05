import { useEffect, useState } from 'react'

interface CountdownProps {
  value: number
}

export function CountdownOverlayFullscreen({ value }: CountdownProps) {
  if (value <= 0) return null

  // Color progression: 3+ = purple, 2 = orange, 1 = pink/red
  const getColor = (val: number) => {
    if (val >= 3) return { primary: '#8B5CF6', secondary: '#A78BFA', glow: 'rgba(139, 92, 246, 0.6)' }
    if (val === 2) return { primary: '#F97316', secondary: '#FB923C', glow: 'rgba(249, 115, 22, 0.6)' }
    return { primary: '#EC4899', secondary: '#F472B6', glow: 'rgba(236, 72, 153, 0.6)' }
  }

  const colors = getColor(value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
      {/* Pulsing background glow */}
      <div
        key={`bg-${value}`}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          animation: 'countdown-glow-pulse 0.8s ease-out'
        }}
      >
        <div
          className="w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Main countdown number */}
      <div
        key={value} // Re-animate on value change
        className="relative text-[25rem] font-black drop-shadow-[0_0_50px_rgba(0,0,0,0.8)] font-mono leading-none"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 80px ${colors.glow}, 0 0 120px ${colors.glow}`,
          animation: 'countdown-pop-scale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {value}
      </div>

      {/* Ripple rings */}
      <div
        key={`ring-${value}`}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="absolute rounded-full"
          style={{
            width: '300px',
            height: '300px',
            border: `4px solid ${colors.primary}`,
            animation: 'countdown-ripple 0.8s ease-out'
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '300px',
            height: '300px',
            border: `4px solid ${colors.secondary}`,
            animation: 'countdown-ripple 0.8s ease-out 0.15s'
          }}
        />
      </div>
    </div>
  )
}

interface FlashProps {
  active: boolean
}

export function CaptureFlashEffect({ active }: FlashProps) {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'shutter'>('idle')

  useEffect(() => {
    if (active) {
      // Phase 1: Bright flash
      setPhase('flash')

      // Phase 2: Shutter effect
      const shutterTimer = setTimeout(() => {
        setPhase('shutter')
      }, 100)

      // Phase 3: Reset
      const resetTimer = setTimeout(() => {
        setPhase('idle')
      }, 500)

      return () => {
        clearTimeout(shutterTimer)
        clearTimeout(resetTimer)
      }
    }
  }, [active])

  if (phase === 'idle') return null

  return (
    <>
      {/* Bright flash overlay */}
      {phase === 'flash' && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, white 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.7) 100%)',
            animation: 'flash-burst 150ms ease-out forwards'
          }}
        />
      )}

      {/* Camera shutter effect - two black bars */}
      {phase === 'shutter' && (
        <>
          {/* Top shutter blade */}
          <div
            className="fixed top-0 left-0 right-0 z-[61] bg-black pointer-events-none"
            style={{
              height: '50vh',
              animation: 'shutter-close-top 200ms ease-in-out forwards'
            }}
          />
          {/* Bottom shutter blade */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[61] bg-black pointer-events-none"
            style={{
              height: '50vh',
              animation: 'shutter-close-bottom 200ms ease-in-out forwards'
            }}
          />
          {/* Center flash line */}
          <div
            className="fixed left-0 right-0 z-[62] pointer-events-none"
            style={{
              top: '50%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, white, transparent)',
              animation: 'shutter-line 200ms ease-in-out forwards',
              boxShadow: '0 0 20px white, 0 0 40px white'
            }}
          />
        </>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes flash-burst {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes shutter-close-top {
          0% { transform: translateY(-100%); }
          40% { transform: translateY(0); }
          60% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }

        @keyframes shutter-close-bottom {
          0% { transform: translateY(100%); }
          40% { transform: translateY(0); }
          60% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }

        @keyframes shutter-line {
          0% { opacity: 0; transform: scaleX(0); }
          40% { opacity: 1; transform: scaleX(1); }
          60% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0); }
        }

        @keyframes countdown-pop-scale {
          0% { transform: scale(0.5) rotate(-5deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes countdown-glow-pulse {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.6; transform: scale(1); }
        }

        @keyframes countdown-ripple {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </>
  )
}
