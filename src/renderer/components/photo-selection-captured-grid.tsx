/**
 * Left panel of photo selection: grid of all captured photos
 * Shows dimmed overlay + slot badge for assigned photos
 */

import type { CapturedPhoto } from '../../shared/types/session-types'

interface PhotoSelectionCapturedGridProps {
  capturedPhotos: CapturedPhoto[]
  slotAssignments: (number | null)[]
  onPhotoClick: (photoArrayIndex: number) => void
}

export function PhotoSelectionCapturedGrid({
  capturedPhotos,
  slotAssignments,
  onPhotoClick
}: PhotoSelectionCapturedGridProps) {
  const assignedPhotoIndices = new Set(slotAssignments.filter(v => v !== null))

  return (
    <div className="w-2/5 h-full overflow-y-auto p-4 flex flex-col">
      <h3
        className="text-xl font-bold text-white mb-4 shrink-0"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Chọn ảnh của bạn
      </h3>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {capturedPhotos.map((photo, arrayIndex) => {
          const isAssigned = assignedPhotoIndices.has(arrayIndex)
          const slotNumber = slotAssignments.indexOf(arrayIndex)

          return (
            <button
              key={photo.id}
              onClick={() => onPhotoClick(arrayIndex)}
              className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2"
              style={{
                borderColor: isAssigned ? 'rgba(236, 72, 153, 0.6)' : 'rgba(255, 255, 255, 0.1)',
                transform: isAssigned ? 'scale(0.95)' : 'scale(1)'
              }}
            >
              <img
                src={photo.previewUrl}
                alt={`Photo ${arrayIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Dimmed overlay for assigned photos */}
              {isAssigned && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
                    }}
                  >
                    {slotNumber + 1}
                  </div>
                </div>
              )}

              {/* Hover effect for available photos */}
              {!isAssigned && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
