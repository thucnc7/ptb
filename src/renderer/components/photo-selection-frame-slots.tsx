/**
 * Right panel of photo selection: frame preview with slots at actual placeholder positions
 * Uses padding-bottom trick for reliable aspect ratio with absolute-positioned children
 */

import { Sparkles } from 'lucide-react'
import type { CapturedPhoto } from '../../shared/types/session-types'
import type { Frame } from '../../shared/types/frame-types'

interface PhotoSelectionFrameSlotsProps {
  frame: Frame
  capturedPhotos: CapturedPhoto[]
  slotAssignments: (number | null)[]
  onSlotClick: (slotIndex: number) => void
  onConfirm: () => void
}

export function PhotoSelectionFrameSlots({
  frame,
  capturedPhotos,
  slotAssignments,
  onSlotClick,
  onConfirm
}: PhotoSelectionFrameSlotsProps) {
  const filledCount = slotAssignments.filter(v => v !== null).length
  const totalSlots = frame.imageCaptures
  const allSlotsFilled = filledCount === totalSlots
  // paddingBottom % is relative to width, so height/width * 100 gives correct ratio
  const paddingPercent = (frame.height / frame.width) * 100

  return (
    <div className="w-3/5 h-full flex flex-col p-4">
      {/* Header: frame name + counter */}
      <div className="shrink-0 mb-3">
        <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          {frame.name}
        </h3>
        <p className="text-lg mt-1">
          <span
            className="font-bold"
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {filledCount}/{totalSlots}
          </span>
          <span className="text-slate-400 ml-2">đã chọn</span>
        </p>
      </div>

      {/* Frame preview - padding-bottom trick maintains aspect ratio */}
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <div className="w-full max-h-full" style={{ maxWidth: `${(frame.width / frame.height) * 100}%` }}>
          <div
            className="relative w-full rounded-xl overflow-hidden border border-white/10"
            style={{
              paddingBottom: `${paddingPercent}%`,
              background: '#ffffff'
            }}
          >
            {/* Render photo slots at placeholder positions */}
            {frame.placeholders.map((placeholder, slotIndex) => {
              const photoIdx = slotAssignments[slotIndex] ?? null
              const photo = photoIdx !== null ? capturedPhotos[photoIdx] : null

              return (
                <button
                  key={placeholder.id}
                  onClick={() => onSlotClick(slotIndex)}
                  className="absolute cursor-pointer transition-all duration-200 overflow-hidden"
                  style={{
                    left: `${placeholder.x}%`,
                    top: `${placeholder.y}%`,
                    width: `${placeholder.width}%`,
                    height: `${placeholder.height}%`,
                    transform: placeholder.rotation ? `rotate(${placeholder.rotation}deg)` : undefined,
                    border: photo
                      ? '2px solid rgba(236, 72, 153, 0.7)'
                      : '2px dashed rgba(255, 255, 255, 0.3)',
                    background: photo ? 'transparent' : 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: photo ? undefined : 'blur(4px)'
                  }}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo.previewUrl}
                        alt={`Slot ${slotIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-red-500/0 hover:bg-red-500/30 transition-colors flex items-center justify-center">
                        <span className="text-white/0 hover:text-white text-xs font-bold transition-colors drop-shadow-lg">
                          Bỏ chọn
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white/30" style={{ fontFamily: 'var(--font-heading)' }}>
                        {slotIndex + 1}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}

            {/* Render frame overlay image layers on top */}
            {frame.layers?.filter(l => l.type === 'image' && l.imagePath).map(layer => (
              <img
                key={layer.id}
                src={`file://${layer.imagePath}`}
                alt=""
                className="absolute pointer-events-none"
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  width: `${layer.width}%`,
                  height: `${layer.height}%`,
                  transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                  objectFit: 'fill'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="mt-3 shrink-0">
        <button
          onClick={onConfirm}
          disabled={!allSlotsFilled}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 flex items-center justify-center gap-2"
          style={{
            fontFamily: 'var(--font-heading)',
            background: allSlotsFilled
              ? 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            boxShadow: allSlotsFilled ? '0 4px 20px rgba(236, 72, 153, 0.4)' : 'none',
            opacity: allSlotsFilled ? 1 : 0.5,
            cursor: allSlotsFilled ? 'pointer' : 'not-allowed'
          }}
        >
          <Sparkles className="w-5 h-5" />
          {allSlotsFilled ? 'Xác nhận' : `Chọn thêm ${totalSlots - filledCount} ảnh`}
        </button>
      </div>
    </div>
  )
}
