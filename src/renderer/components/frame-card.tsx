/**
 * Frame card component - Gen-Z Modern Design
 * Features: Glassmorphism, gradient borders, hover lift, smooth animations
 */

import type { Frame } from '../../shared/types/frame-types'

function pathToFileUrl(filePath: string): string {
  if (!filePath) return ''
  const normalizedPath = filePath.replace(/\\/g, '/')
  return normalizedPath.startsWith('/')
    ? `app://${normalizedPath}`
    : `app:///${normalizedPath}`
}

interface FrameCardProps {
  frame: Frame
  onEdit: (frame: Frame) => void
  onDelete: (frame: Frame) => void
}

export function FrameCard({ frame, onEdit, onDelete }: FrameCardProps): JSX.Element {
  // Count photo placeholders/layers
  const photoCount = frame.layers?.length > 0
    ? frame.layers.filter(l => l.type === 'photo').length
    : frame.placeholders.length

  return (
    <div className="group relative">
      {/* Gradient border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-300" />

      {/* Card content */}
      <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 group-hover:border-transparent transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20">
        {/* Thumbnail - use actual frame aspect ratio with max height */}
        <div
          className="relative bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden"
          style={{
            aspectRatio: `${frame.width || 1200}/${frame.height || 1800}`,
            maxHeight: '280px'
          }}
        >
          {frame.backgroundPath ? (
            <img
              src={pathToFileUrl(frame.backgroundPath)}
              alt={frame.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto text-slate-600 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-slate-500 text-sm">No preview</span>
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

          {/* Photo count badge - pill style */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white text-xs font-bold shadow-lg">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {frame.imageCaptures}
          </div>

          {/* Placeholder overlay indicators */}
          <div className="absolute inset-0 pointer-events-none">
            {frame.placeholders.map((ph, i) => (
              <div
                key={ph.id}
                className="absolute border-2 border-white/40 bg-white/10 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-bold rounded-sm"
                style={{
                  left: `${ph.x}%`,
                  top: `${ph.y}%`,
                  width: `${ph.width}%`,
                  height: `${ph.height}%`,
                  transform: `rotate(${ph.rotation}deg)`
                }}
              >
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info & Actions */}
        <div className="p-4">
          {/* Frame name */}
          <h3 className="text-lg font-bold text-white truncate mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all">
            {frame.name}
          </h3>

          {/* Meta info */}
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1 text-sm text-slate-400">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              {frame.placeholders.length} slots
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-500">
              {frame.width || 1200} × {frame.height || 1800}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(frame)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onDelete(frame)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer group/delete"
              title="Delete frame"
            >
              <svg className="w-4 h-4 transition-transform group-hover/delete:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
