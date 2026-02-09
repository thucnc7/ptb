/**
 * Composite Image Display Component
 * Shows the final composite image with loading state and folder open on click
 */

import { Sparkles, FolderOpen } from 'lucide-react'

interface CompositeImageDisplayProps {
  compositeDataUrl: string | null
  isLoading: boolean
  onOpenFolder: () => void
}

export function CompositeImageDisplay({
  compositeDataUrl,
  isLoading,
  onOpenFolder
}: CompositeImageDisplayProps) {
  return (
    <div
      className="rounded-3xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
        maxHeight: 'calc(100vh - 280px)'
      }}
    >
      {isLoading ? (
        <div className="w-80 h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Sparkles className="w-16 h-16 text-purple-400 animate-spin" />
            <p className="text-xl text-purple-300">Đang tải ảnh...</p>
          </div>
        </div>
      ) : compositeDataUrl ? (
        <div
          className="relative group cursor-pointer"
          onClick={onOpenFolder}
          title="Nhấn để mở thư mục chứa ảnh"
        >
          <img
            src={compositeDataUrl}
            alt="Composite photo"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            style={{
              animation: 'fade-in 0.5s ease-out',
              maxHeight: 'calc(100vh - 300px)',
              maxWidth: '100%'
            }}
            onLoad={() => console.log('[RENDERER] Composite image loaded successfully')}
            onError={(e) => {
              console.error('[RENDERER] Failed to load composite image:', e)
              console.error('[RENDERER] Image src length:', compositeDataUrl?.length)
              console.error('[RENDERER] Image src prefix:', compositeDataUrl?.substring(0, 100))
            }}
          />
          {/* Hover overlay with folder icon */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
            <div className="flex flex-col items-center gap-2 text-white">
              <FolderOpen className="w-12 h-12" />
              <span className="text-lg font-medium">Mở thư mục</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-80 h-96 flex items-center justify-center">
          <p className="text-xl text-red-400">Không tải được ảnh</p>
        </div>
      )}
    </div>
  )
}
