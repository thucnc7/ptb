/**
 * Draggable Layer Component - Professional drag/resize with smooth UX
 * Features:
 * - Single-click to select AND start drag
 * - Smooth movement (no rounding during drag)
 * - Visual feedback (shadow, scale on hover, opacity when dragging)
 * - 8-point resize (corners + edges)
 * - Proper cursor feedback
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import type { Layer } from '../../shared/types/frame-types'

interface DraggableLayerProps {
  layer: Layer
  zIndex: number
  photoIndex: number
  isSelected: boolean
  onSelect: () => void
  onChange: (updates: Partial<Layer>) => void
  canvasRef: React.RefObject<HTMLDivElement>
  pathToFileUrl: (path: string) => string
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null

const PHOTO_COLORS = ['#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#f97316', '#ec4899']

// Cursor map for resize directions
const CURSOR_MAP: Record<string, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize'
}

export function DraggableLayer({
  layer,
  zIndex,
  photoIndex,
  isSelected,
  onSelect,
  onChange,
  canvasRef,
  pathToFileUrl
}: DraggableLayerProps): JSX.Element {
  const layerRef = useRef<HTMLDivElement>(null)

  // Interaction state
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Position during drag (for smooth movement)
  const [tempPosition, setTempPosition] = useState({ x: layer.x, y: layer.y, width: layer.width, height: layer.height })

  // Drag start reference
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, layerX: 0, layerY: 0, layerW: 0, layerH: 0 })

  // Sync temp position with layer when not interacting
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setTempPosition({ x: layer.x, y: layer.y, width: layer.width, height: layer.height })
    }
  }, [layer.x, layer.y, layer.width, layer.height, isDragging, isResizing])

  // Convert mouse position to percentage of canvas
  const getPercentPosition = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    }
  }, [canvasRef])

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // Select first if not selected
    if (!isSelected) {
      onSelect()
    }

    const pos = getPercentPosition(e.clientX, e.clientY)
    dragStartRef.current = {
      mouseX: pos.x,
      mouseY: pos.y,
      layerX: layer.x,
      layerY: layer.y,
      layerW: layer.width,
      layerH: layer.height
    }

    setIsDragging(true)
  }, [isSelected, onSelect, getPercentPosition, layer])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation()
    e.preventDefault()

    const pos = getPercentPosition(e.clientX, e.clientY)
    dragStartRef.current = {
      mouseX: pos.x,
      mouseY: pos.y,
      layerX: layer.x,
      layerY: layer.y,
      layerW: layer.width,
      layerH: layer.height
    }

    setIsResizing(true)
    setResizeDir(direction)
  }, [getPercentPosition, layer])

  // Global mouse handlers for drag/resize
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const pos = getPercentPosition(e.clientX, e.clientY)
      const deltaX = pos.x - dragStartRef.current.mouseX
      const deltaY = pos.y - dragStartRef.current.mouseY
      const minSize = 5

      if (isDragging) {
        // Calculate new position with bounds
        const newX = Math.max(0, Math.min(100 - layer.width, dragStartRef.current.layerX + deltaX))
        const newY = Math.max(0, Math.min(100 - layer.height, dragStartRef.current.layerY + deltaY))

        setTempPosition(prev => ({ ...prev, x: newX, y: newY }))
      }

      if (isResizing && resizeDir) {
        let newX = dragStartRef.current.layerX
        let newY = dragStartRef.current.layerY
        let newW = dragStartRef.current.layerW
        let newH = dragStartRef.current.layerH

        // Handle horizontal resize
        if (resizeDir.includes('e')) {
          newW = Math.max(minSize, Math.min(100 - newX, dragStartRef.current.layerW + deltaX))
        }
        if (resizeDir.includes('w')) {
          const widthChange = -deltaX
          const maxWidthChange = dragStartRef.current.layerX
          const actualChange = Math.min(widthChange, maxWidthChange)
          newW = Math.max(minSize, dragStartRef.current.layerW + actualChange)
          newX = dragStartRef.current.layerX + dragStartRef.current.layerW - newW
        }

        // Handle vertical resize
        if (resizeDir.includes('s')) {
          newH = Math.max(minSize, Math.min(100 - newY, dragStartRef.current.layerH + deltaY))
        }
        if (resizeDir.includes('n')) {
          const heightChange = -deltaY
          const maxHeightChange = dragStartRef.current.layerY
          const actualChange = Math.min(heightChange, maxHeightChange)
          newH = Math.max(minSize, dragStartRef.current.layerH + actualChange)
          newY = dragStartRef.current.layerY + dragStartRef.current.layerH - newH
        }

        setTempPosition({ x: newX, y: newY, width: newW, height: newH })
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        // Commit the final position (round to 1 decimal for clean values)
        onChange({
          x: Math.round(tempPosition.x * 10) / 10,
          y: Math.round(tempPosition.y * 10) / 10,
          width: Math.round(tempPosition.width * 10) / 10,
          height: Math.round(tempPosition.height * 10) / 10
        })
      }
      setIsDragging(false)
      setIsResizing(false)
      setResizeDir(null)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, isResizing, resizeDir, layer, tempPosition, onChange, getPercentPosition])

  const isImage = layer.type === 'image'
  const bgColor = isImage ? 'transparent' : PHOTO_COLORS[photoIndex % PHOTO_COLORS.length] + '80'

  // Use temp position during drag/resize, otherwise use layer position
  const displayX = (isDragging || isResizing) ? tempPosition.x : layer.x
  const displayY = (isDragging || isResizing) ? tempPosition.y : layer.y
  const displayW = (isDragging || isResizing) ? tempPosition.width : layer.width
  const displayH = (isDragging || isResizing) ? tempPosition.height : layer.height

  return (
    <div
      ref={layerRef}
      className={`absolute select-none ${
        isDragging ? 'cursor-grabbing' : isSelected ? 'cursor-grab' : 'cursor-pointer'
      }`}
      style={{
        left: `${displayX}%`,
        top: `${displayY}%`,
        width: `${displayW}%`,
        height: `${displayH}%`,
        transform: `rotate(${layer.rotation}deg)`,
        zIndex: zIndex + (isDragging ? 1000 : 0),
        backgroundColor: bgColor,
        // Visual feedback
        opacity: isDragging ? 0.9 : 1,
        boxShadow: isDragging
          ? '0 20px 40px rgba(0,0,0,0.4)'
          : isSelected
            ? '0 0 0 2px #fbbf24, 0 4px 12px rgba(0,0,0,0.3)'
            : isHovered
              ? '0 0 0 2px #60a5fa, 0 4px 8px rgba(0,0,0,0.2)'
              : 'none',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.15s ease-out, opacity 0.15s ease-out',
        pointerEvents: isSelected ? 'auto' : 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Layer content */}
      {isImage && layer.imagePath ? (
        <img
          src={pathToFileUrl(layer.imagePath)}
          alt="Layer"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
          onError={(e) => console.error('Failed to load:', layer.imagePath, e)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-4xl font-bold drop-shadow-lg">{photoIndex + 1}</span>
        </div>
      )}

      {/* Resize handles - only when selected */}
      {isSelected && (
        <ResizeHandles
          onResizeStart={handleResizeStart}
          activeDirection={resizeDir}
        />
      )}
    </div>
  )
}

// Separate component for resize handles
interface ResizeHandlesProps {
  onResizeStart: (e: React.MouseEvent, dir: ResizeDirection) => void
  activeDirection: ResizeDirection
}

function ResizeHandles({ onResizeStart, activeDirection }: ResizeHandlesProps): JSX.Element {
  const handleStyle = (dir: string): React.CSSProperties => ({
    cursor: CURSOR_MAP[dir] || 'default',
    transform: activeDirection === dir ? 'scale(1.3)' : 'scale(1)',
    transition: 'transform 0.1s ease-out, background-color 0.1s ease-out'
  })

  return (
    <>
      {/* Corner handles */}
      <div
        className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('nw')}
        onMouseDown={(e) => onResizeStart(e, 'nw')}
      />
      <div
        className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('ne')}
        onMouseDown={(e) => onResizeStart(e, 'ne')}
      />
      <div
        className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('sw')}
        onMouseDown={(e) => onResizeStart(e, 'sw')}
      />
      <div
        className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('se')}
        onMouseDown={(e) => onResizeStart(e, 'se')}
      />

      {/* Edge handles */}
      <div
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('n')}
        onMouseDown={(e) => onResizeStart(e, 'n')}
      />
      <div
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('s')}
        onMouseDown={(e) => onResizeStart(e, 's')}
      />
      <div
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('w')}
        onMouseDown={(e) => onResizeStart(e, 'w')}
      />
      <div
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-md z-10"
        style={handleStyle('e')}
        onMouseDown={(e) => onResizeStart(e, 'e')}
      />

      {/* Selection border - dashed line */}
      <div className="absolute inset-0 border-2 border-dashed border-yellow-400/50 pointer-events-none" />
    </>
  )
}
