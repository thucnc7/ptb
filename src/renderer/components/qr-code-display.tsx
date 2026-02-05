/**
 * QR Code Display Component
 * Displays scannable QR code with Gen-Z aesthetic styling
 */

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Smartphone, Sparkles } from 'lucide-react'

interface QRCodeDisplayProps {
  url: string
  size?: number
  className?: string
  showUrl?: boolean
  errorMessage?: string
}

export function QRCodeDisplay({
  url,
  size = 256,
  className = '',
  showUrl = true,
  errorMessage = 'Link không hợp lệ'
}: QRCodeDisplayProps) {
  const [mounted, setMounted] = useState(false)
  const [isValidUrl, setIsValidUrl] = useState(true)

  useEffect(() => {
    setMounted(true)

    // Validate URL
    try {
      new URL(url)
      setIsValidUrl(true)
    } catch {
      setIsValidUrl(false)
    }
  }, [url])

  if (!isValidUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 rounded-3xl ${className}`}
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}
      >
        <p className="text-red-400 text-lg font-semibold">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={`transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
    >
      {/* QR Code Card */}
      <div
        className="relative rounded-3xl overflow-hidden p-8 flex flex-col items-center"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2), 0 0 60px rgba(236, 72, 153, 0.1)'
        }}
      >
        {/* Icon Header */}
        <div className="flex items-center gap-3 mb-6">
          <Smartphone className="w-8 h-8 text-purple-500" />
          <h3
            className="text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Quét để tải ảnh
          </h3>
          <Sparkles className="w-8 h-8 text-pink-500" />
        </div>

        {/* QR Code with animation */}
        <div
          className="bg-white p-4 rounded-2xl shadow-lg mb-6 transition-transform duration-300 hover:scale-105"
          style={{
            animation: 'fade-in-scale 0.5s ease-out 0.2s both'
          }}
        >
          <QRCodeSVG
            value={url}
            size={size}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* URL Display */}
        {showUrl && (
          <div className="w-full text-center">
            <p className="text-sm text-gray-500 mb-2 font-medium">Link tải:</p>
            <div
              className="px-4 py-2 rounded-xl text-xs break-all"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                fontFamily: 'monospace'
              }}
            >
              {url}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 flex items-center gap-2 text-purple-600">
          <Download className="w-5 h-5" />
          <p className="text-sm font-medium">
            Dùng điện thoại quét QR code để tải ảnh về máy
          </p>
        </div>

        {/* Decorative gradient corners */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 opacity-20 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
