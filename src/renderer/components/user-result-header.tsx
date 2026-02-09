/**
 * User Result Header Component
 * Displays success header with animated title
 */

import { Star, Heart } from 'lucide-react'

interface UserResultHeaderProps {
  hasQrLink: boolean
  mounted: boolean
}

export function UserResultHeader({ hasQrLink, mounted }: UserResultHeaderProps) {
  return (
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
        Ảnh siêu đẹp của bạn đây! {hasQrLink ? 'Quét mã QR hoặc tải về trực tiếp' : 'Tải về trực tiếp'} ✨
      </p>
    </div>
  )
}
