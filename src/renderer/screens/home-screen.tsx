/**
 * Home Screen - "Polaroid Dream" Design
 * Warm neo-kawaii aesthetic with floating polaroid shapes
 * Signature: stacked title, gummy CTA, film-themed decorations
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1a1035 0%, #0f0a1e 40%, #1a0f2e 70%, #120d20 100%)' }}
    >
      {/* Mesh gradient atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(251, 146, 60, 0.12)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(196, 181, 253, 0.10)' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'rgba(252, 165, 165, 0.08)' }} />
      </div>

      {/* Floating polaroid shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Polaroid 1 - top left */}
        <div
          className="absolute w-28 h-36 rounded-md border border-white/[0.07] bg-white/[0.03]"
          style={{ top: '8%', left: '8%', transform: 'rotate(-12deg)', animation: 'home-float 8s ease-in-out infinite' }}
        >
          <div className="m-2 h-20 rounded-sm bg-white/[0.05]" />
        </div>
        {/* Polaroid 2 - top right */}
        <div
          className="absolute w-24 h-32 rounded-md border border-white/[0.06] bg-white/[0.02]"
          style={{ top: '12%', right: '12%', transform: 'rotate(8deg)', animation: 'home-float 10s ease-in-out infinite 1s' }}
        >
          <div className="m-2 h-16 rounded-sm bg-white/[0.04]" />
        </div>
        {/* Polaroid 3 - bottom left */}
        <div
          className="absolute w-20 h-28 rounded-md border border-white/[0.05] bg-white/[0.02]"
          style={{ bottom: '15%', left: '15%', transform: 'rotate(15deg)', animation: 'home-float 9s ease-in-out infinite 2s' }}
        >
          <div className="m-1.5 h-14 rounded-sm bg-white/[0.04]" />
        </div>
        {/* Polaroid 4 - bottom right */}
        <div
          className="absolute w-32 h-40 rounded-md border border-white/[0.06] bg-white/[0.02]"
          style={{ bottom: '8%', right: '6%', transform: 'rotate(-6deg)', animation: 'home-float 11s ease-in-out infinite 0.5s' }}
        >
          <div className="m-2 h-24 rounded-sm bg-white/[0.04]" />
        </div>

        {/* Star decorations */}
        <div className="absolute text-amber-300/40 text-2xl" style={{ top: '20%', left: '25%', animation: 'home-twinkle 3s ease-in-out infinite' }}>✦</div>
        <div className="absolute text-rose-300/30 text-lg" style={{ top: '35%', right: '20%', animation: 'home-twinkle 4s ease-in-out infinite 1s' }}>✦</div>
        <div className="absolute text-violet-300/35 text-xl" style={{ bottom: '30%', left: '30%', animation: 'home-twinkle 3.5s ease-in-out infinite 0.5s' }}>✦</div>
        <div className="absolute text-amber-200/25 text-sm" style={{ top: '60%', right: '30%', animation: 'home-twinkle 5s ease-in-out infinite 2s' }}>✦</div>
      </div>

      {/* Settings - subtle top right */}
      <button
        onClick={() => navigate('/admin/settings')}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-xl text-white/20 hover:text-white/60 hover:bg-white/5 transition-all duration-300 cursor-pointer"
        title="Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
        {/* Stacked title - signature element */}
        <div className={`text-center mb-14 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          {/* Film strip icon */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-8">
            <span className="text-amber-300 text-sm">✦</span>
            <span className="text-white/40 text-xs font-medium tracking-widest uppercase">say cheese</span>
            <span className="text-rose-300 text-sm">✦</span>
          </div>

          {/* Title: PHOTO on top, BOOTH below - different weights & colors */}
          <div className="leading-none">
            <h1
              className="text-[5.5rem] md:text-[7rem] font-black tracking-tight"
              style={{
                fontFamily: 'var(--font-heading), system-ui, sans-serif',
                background: 'linear-gradient(135deg, #fca5a5 0%, #fb923c 50%, #fcd34d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(251, 146, 60, 0.2))'
              }}
            >
              PHOTO
            </h1>
            <h1
              className="text-[5.5rem] md:text-[7rem] font-black tracking-tight -mt-4"
              style={{
                fontFamily: 'var(--font-heading), system-ui, sans-serif',
                background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(167, 139, 250, 0.2))'
              }}
            >
              BOOTH
            </h1>
          </div>

          <p className="text-white/30 text-lg mt-4 font-light tracking-wide">
            Capture moments, share memories
          </p>
        </div>

        {/* Gummy CTA button - 3D depth effect */}
        <div className={`transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={() => navigate('/user/select-frame')}
            className="group relative cursor-pointer"
          >
            {/* Soft glow */}
            <div
              className="absolute -inset-3 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-80 transition-all duration-500"
              style={{ background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.4), rgba(167, 139, 250, 0.4))' }}
            />

            {/* Button body - gummy/jelly feel with inner shadow */}
            <div
              className="relative flex items-center gap-5 px-14 py-7 rounded-[1.5rem] text-white font-bold text-2xl group-hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
              style={{
                fontFamily: 'var(--font-heading), system-ui, sans-serif',
                background: 'linear-gradient(145deg, #f97316 0%, #e879a0 40%, #a78bfa 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -4px 8px rgba(0,0,0,0.15), 0 8px 30px rgba(249, 115, 22, 0.25), 0 4px 15px rgba(167, 139, 250, 0.2)'
              }}
            >
              <span className="text-2xl">📸</span>
              <span className="tracking-wide">Bắt đầu chụp</span>
              <svg className="w-5 h-5 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Feature chips - cute badge style */}
        <div className={`mt-16 flex flex-wrap items-center justify-center gap-3 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {[
            { icon: '☁️', label: 'Auto Upload', color: 'text-amber-300/60' },
            { icon: '📱', label: 'QR Code', color: 'text-violet-300/60' },
            { icon: '🖼️', label: 'Custom Frames', color: 'text-rose-300/60' }
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]"
            >
              <span className="text-sm">{f.icon}</span>
              <span className={`text-xs font-medium ${f.color}`}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 left-0 right-0 text-center text-white/15 text-xs">
        Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-white/25 font-mono text-[10px]">F11</kbd> for fullscreen
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes home-float {
          0%, 100% { transform: translateY(0) rotate(var(--tw-rotate, 0deg)); }
          50% { transform: translateY(-12px) rotate(var(--tw-rotate, 0deg)); }
        }
        @keyframes home-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
