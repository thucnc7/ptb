import { CapturedPhoto } from '../../shared/types/session-types'
import { RefreshCw, Check } from 'lucide-react'

interface CapturedPhotosPreviewGridProps {
  photos: CapturedPhoto[]
  totalSlots: number
  onRetake: (index: number) => void
  onConfirm: () => void
  canRetake: boolean
}

export function CapturedPhotosPreviewGrid({
  photos,
  totalSlots,
  onRetake,
  onConfirm,
  canRetake
}: CapturedPhotosPreviewGridProps) {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col h-full max-h-[90vh]">
      <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-lg">
        Review Your Photos
      </h2>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {Array.from({ length: totalSlots }).map((_, i) => {
            const photo = photos.find(p => p.index === i)

            return (
              <div
                key={i}
                className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-[2/3] border border-gray-700 shadow-xl group"
              >
                {photo ? (
                  <>
                    {/* Photo Image */}
                    <img
                      src={photo.previewUrl}
                      alt={`Shot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Index Badge */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20">
                      #{i + 1}
                    </div>

                    {/* Retake Overlay */}
                    {canRetake && (
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                        <button
                          onClick={() => onRetake(i)}
                          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={18} />
                          Chụp lại ảnh này
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800/50">
                    <span className="text-4xl mb-2">📷</span>
                    <span>Waiting for shot {i + 1}...</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center pb-4">
        <button
          onClick={onConfirm}
          className="px-12 py-4 bg-gradient-to-r from-pink-500 to-violet-600 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-105 transition-all rounded-full text-xl font-bold flex items-center gap-3 text-white cursor-pointer"
        >
          <span>Tiếp tục & In ảnh</span>
          <Check size={24} />
        </button>
      </div>
    </div>
  )
}
