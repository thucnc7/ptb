/**
 * Animated Background Orbs Component
 * Floating gradient orbs for Gen-Z aesthetic background
 */

export function AnimatedBackgroundOrbs() {
  return (
    <>
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
    </>
  )
}
