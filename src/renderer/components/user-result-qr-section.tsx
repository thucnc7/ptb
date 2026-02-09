/**
 * QR Section Component
 * Shows QR code if available, or fallback message for direct download
 */

import { Sparkles, Download } from 'lucide-react'
import { QRCodeDisplay } from './qr-code-display'

interface QRSectionProps {
  downloadUrl: string
  hasQrLink: boolean
  mounted: boolean
}

export function QRSection({ downloadUrl, hasQrLink, mounted }: QRSectionProps) {
  return (
    <div
      className={`transition-all duration-700 delay-300 ${
        mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
      }`}
    >
      {hasQrLink ? (
        <>
          <QRCodeDisplay
            url={downloadUrl}
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
        </>
      ) : (
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: 'rgba(236, 72, 153, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            width: '280px'
          }}
        >
          <Download className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <p className="text-lg text-pink-200 font-medium mb-2">
            Quét QR không khả dụng
          </p>
          <p className="text-sm text-pink-300/60">
            Hãy tải ảnh trực tiếp bên dưới
          </p>
        </div>
      )}
    </div>
  )
}
