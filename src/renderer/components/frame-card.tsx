/**
 * Frame card component for displaying frame preview in grid
 * Shows thumbnail, name, and photo count
 */

import type { Frame } from '../../shared/types/frame-types'

function pathToFileUrl(filePath: string): string {
  if (!filePath) return ''
  // Replace backslashes with forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/')
  // Handle absolute paths (Unix/Mac starts with /, Windows starts with Drive letter)
  return normalizedPath.startsWith('/')
    ? `file://${normalizedPath}`
    : `file:///${normalizedPath}`
}

interface FrameCardProps {
  frame: Frame
  onEdit: (frame: Frame) => void
  onDelete: (frame: Frame) => void
}

export function FrameCard({ frame, onEdit, onDelete }: FrameCardProps): JSX.Element {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-700">
        {frame.backgroundPath ? (
          <img
            src={pathToFileUrl(frame.backgroundPath)}
            alt={frame.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        {/* Photo count badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded-lg">
          {frame.imageCaptures} photos
        </div>

        {/* Placeholder overlay indicators */}
        <div className="absolute inset-0 pointer-events-none">
          {frame.placeholders.map((ph, i) => (
            <div
              key={ph.id}
              className="absolute border-2 border-white/50 bg-white/20 flex items-center justify-center text-white text-xs font-bold"
              style={{
                left: `${ph.x}%`,
                top: `${ph.y}%`,
                width: `${ph.width}%`,
                height: `${ph.height}%`,
                transform: `rotate(${ph.rotation}deg)`
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Info & Actions */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate mb-1">
          {frame.name}
        </h3>
        <p className="text-sm text-gray-400 mb-1">
          {frame.placeholders.length} placeholder{frame.placeholders.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {frame.width || 1200} x {frame.height || 1800} px
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(frame)}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(frame)}
            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
