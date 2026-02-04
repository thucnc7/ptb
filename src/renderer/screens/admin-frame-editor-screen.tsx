/**
 * Admin frame editor screen - Professional Print Layout style
 * Create/edit frame with background image upload and placeholder positioning
 * Inspired by professional photobooth software UI
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getFrameById,
  createFrame,
  updateFrame,
  selectBackgroundImage,
  importBackgroundImage,
  createPlaceholder,
  validateFrame
} from '../services/frame-service'
import type { Frame, Placeholder, FramePreset } from '../../shared/types/frame-types'
import { FRAME_PRESETS } from '../../shared/types/frame-types'

// Convert Windows path to file:// URL
function pathToFileUrl(filePath: string): string {
  if (!filePath) return ''
  // Replace backslashes with forward slashes and encode for URL
  const normalizedPath = filePath.replace(/\\/g, '/')
  return `file:///${normalizedPath}`
}

export function AdminFrameEditorScreen(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = id && id !== 'new'

  const canvasRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Form state
  const [name, setName] = useState('')
  const [backgroundPath, setBackgroundPath] = useState('')
  const [imageCaptures, setImageCaptures] = useState(1)
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([])
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null)
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({})
  const [frameWidth, setFrameWidth] = useState(1200)
  const [frameHeight, setFrameHeight] = useState(1800)
  const [selectedPreset, setSelectedPreset] = useState<FramePreset>('4x6')

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null)
  const [resizing, setResizing] = useState<{ phId: string; direction: string } | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Load existing frame if editing
  useEffect(() => {
    if (isEditing) {
      loadFrame()
    }
  }, [id])

  // Initialize layer visibility
  useEffect(() => {
    const vis: Record<string, boolean> = { background: true }
    placeholders.forEach(ph => { vis[ph.id] = true })
    setLayerVisibility(vis)
  }, [placeholders.length])

  async function loadFrame() {
    if (!id) return
    setLoading(true)
    try {
      const frame = await getFrameById(id)
      if (frame) {
        setName(frame.name)
        setBackgroundPath(frame.backgroundPath)
        setImageCaptures(frame.imageCaptures)
        setPlaceholders(frame.placeholders)
        setFrameWidth(frame.width || 1200)
        setFrameHeight(frame.height || 1800)
        // Determine preset from dimensions
        const preset = Object.entries(FRAME_PRESETS).find(
          ([, p]) => p.width === frame.width && p.height === frame.height
        )
        setSelectedPreset((preset?.[0] as FramePreset) || 'custom')
      }
    } catch (error) {
      console.error('Failed to load frame:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectBackground() {
    try {
      const path = await selectBackgroundImage()
      if (path) {
        const importedPath = await importBackgroundImage(path)
        setBackgroundPath(importedPath)
      }
    } catch (error) {
      console.error('Failed to select background:', error)
    }
  }

  function handleAddPlaceholder() {
    if (placeholders.length >= 6) return
    const newPh = createPlaceholder(placeholders.length)
    setPlaceholders([...placeholders, newPh])
    setSelectedPlaceholder(newPh.id)
    if (placeholders.length + 1 > imageCaptures) {
      setImageCaptures(placeholders.length + 1)
    }
  }

  function handleRemovePlaceholder(phId: string) {
    setPlaceholders(placeholders.filter(p => p.id !== phId))
    if (selectedPlaceholder === phId) {
      setSelectedPlaceholder(null)
    }
  }

  function handlePlaceholderChange(phId: string, updates: Partial<Placeholder>) {
    setPlaceholders(placeholders.map(p =>
      p.id === phId ? { ...p, ...updates } : p
    ))
  }

  function toggleLayerVisibility(layerId: string) {
    setLayerVisibility(prev => ({ ...prev, [layerId]: !prev[layerId] }))
  }

  function handlePresetChange(preset: FramePreset) {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const { width, height } = FRAME_PRESETS[preset]
      updateFrameDimensions(width, height)
    }
  }

  function updateFrameDimensions(newWidth: number, newHeight: number) {
    // Recalculate component positions/sizes to maintain their absolute pixel values
    // percent = (pixel / total) * 100
    // newPercent = (currentPixel / newTotal) * 100
    // currentPixel = (currentPercent / 100) * currentTotal
    // So: newPercent = ((currentPercent / 100 * currentTotal) / newTotal) * 100
    // Simplified: newPercent = currentPercent * (currentTotal / newTotal)

    const widthRatio = frameWidth / newWidth
    const heightRatio = frameHeight / newHeight

    const newPlaceholders = placeholders.map(p => ({
      ...p,
      x: p.x * widthRatio,
      y: p.y * heightRatio,
      width: p.width * widthRatio,
      height: p.height * heightRatio
    }))

    setPlaceholders(newPlaceholders)
    setFrameWidth(newWidth)
    setFrameHeight(newHeight)
  }

  // Move layer up/down
  function moveLayer(phId: string, direction: 'up' | 'down') {
    const index = placeholders.findIndex(p => p.id === phId)
    if (direction === 'up' && index > 0) {
      const newArr = [...placeholders]
        ;[newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]]
      setPlaceholders(newArr)
    } else if (direction === 'down' && index < placeholders.length - 1) {
      const newArr = [...placeholders]
        ;[newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]]
      setPlaceholders(newArr)
    }
  }

  // Alignment functions
  function alignPlaceholder(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    if (!selectedPlaceholder) return
    const ph = placeholders.find(p => p.id === selectedPlaceholder)
    if (!ph) return

    let updates: Partial<Placeholder> = {}
    switch (alignment) {
      case 'left': updates = { x: 0 }; break
      case 'center': updates = { x: 50 - ph.width / 2 }; break
      case 'right': updates = { x: 100 - ph.width }; break
      case 'top': updates = { y: 0 }; break
      case 'middle': updates = { y: 50 - ph.height / 2 }; break
      case 'bottom': updates = { y: 100 - ph.height }; break
    }
    handlePlaceholderChange(selectedPlaceholder, updates)
  }

  // Drag handlers
  function handleMouseDown(e: React.MouseEvent, phId: string) {
    if (!canvasRef.current) return
    e.stopPropagation()
    const rect = canvasRef.current.getBoundingClientRect()
    setDragging(phId)
    setDragStart({
      x: (e.clientX - rect.left) / rect.width * 100,
      y: (e.clientY - rect.top) / rect.height * 100
    })
    setSelectedPlaceholder(phId)
  }

  // Resize handlers
  function handleResizeStart(e: React.MouseEvent, phId: string, direction: string) {
    if (!canvasRef.current) return
    e.stopPropagation()
    e.preventDefault()
    const ph = placeholders.find(p => p.id === phId)
    if (!ph) return
    const rect = canvasRef.current.getBoundingClientRect()
    setResizing({ phId, direction })
    setDragStart({
      x: (e.clientX - rect.left) / rect.width * 100,
      y: (e.clientY - rect.top) / rect.height * 100
    })
    setResizeStart({ x: ph.x, y: ph.y, width: ph.width, height: ph.height })
    setSelectedPlaceholder(phId)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) / rect.width * 100
    const currentY = (e.clientY - rect.top) / rect.height * 100

    // Handle resize
    if (resizing && resizeStart) {
      const deltaX = currentX - dragStart.x
      const deltaY = currentY - dragStart.y
      const ph = placeholders.find(p => p.id === resizing.phId)
      if (!ph) return

      let updates: Partial<Placeholder> = {}
      const minSize = 5 // Minimum 5% size

      switch (resizing.direction) {
        case 'se': // Bottom-right
          updates = {
            width: Math.max(minSize, Math.min(100 - resizeStart.x, resizeStart.width + deltaX)),
            height: Math.max(minSize, Math.min(100 - resizeStart.y, resizeStart.height + deltaY))
          }
          break
        case 'sw': // Bottom-left
          const newWidthSw = Math.max(minSize, resizeStart.width - deltaX)
          const newXSw = Math.max(0, resizeStart.x + resizeStart.width - newWidthSw)
          updates = {
            x: newXSw,
            width: newWidthSw,
            height: Math.max(minSize, Math.min(100 - resizeStart.y, resizeStart.height + deltaY))
          }
          break
        case 'ne': // Top-right
          const newHeightNe = Math.max(minSize, resizeStart.height - deltaY)
          const newYNe = Math.max(0, resizeStart.y + resizeStart.height - newHeightNe)
          updates = {
            y: newYNe,
            width: Math.max(minSize, Math.min(100 - resizeStart.x, resizeStart.width + deltaX)),
            height: newHeightNe
          }
          break
        case 'nw': // Top-left
          const newWidthNw = Math.max(minSize, resizeStart.width - deltaX)
          const newXNw = Math.max(0, resizeStart.x + resizeStart.width - newWidthNw)
          const newHeightNw = Math.max(minSize, resizeStart.height - deltaY)
          const newYNw = Math.max(0, resizeStart.y + resizeStart.height - newHeightNw)
          updates = {
            x: newXNw,
            y: newYNw,
            width: newWidthNw,
            height: newHeightNw
          }
          break
      }
      handlePlaceholderChange(resizing.phId, {
        x: Math.round(updates.x ?? ph.x),
        y: Math.round(updates.y ?? ph.y),
        width: Math.round(updates.width ?? ph.width),
        height: Math.round(updates.height ?? ph.height)
      })
      return
    }

    // Handle drag
    if (dragging) {
      const ph = placeholders.find(p => p.id === dragging)
      if (!ph) return
      const deltaX = currentX - dragStart.x
      const deltaY = currentY - dragStart.y
      const newX = Math.max(0, Math.min(100 - ph.width, ph.x + deltaX))
      const newY = Math.max(0, Math.min(100 - ph.height, ph.y + deltaY))
      handlePlaceholderChange(dragging, { x: Math.round(newX), y: Math.round(newY) })
      setDragStart({ x: currentX, y: currentY })
    }
  }

  function handleMouseUp() {
    setDragging(null)
    setResizing(null)
    setResizeStart(null)
  }

  async function handleSave() {
    const frameData = { name, backgroundPath, imageCaptures, placeholders, width: frameWidth, height: frameHeight }
    const validationErrors = validateFrame(frameData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setSaving(true)
    setErrors([])
    try {
      if (isEditing && id) {
        await updateFrame(id, frameData)
      } else {
        await createFrame(frameData)
      }
      navigate('/admin/frames')
    } catch (error) {
      console.error('Failed to save frame:', error)
      setErrors(['Failed to save frame. Please try again.'])
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading frame...</div>
      </div>
    )
  }

  const selectedPh = placeholders.find(p => p.id === selectedPlaceholder)

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-2">
        <button
          onClick={() => navigate('/admin/frames')}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="h-8 w-px bg-gray-700 mx-2" />

        <span className="text-white font-medium">Print Layout</span>
        <span className="text-gray-500 text-sm ml-4">
          {name || 'Untitled'} {isEditing ? '- Editing' : '- New'}
        </span>

        <div className="flex-1" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/50 border-b border-red-500 px-4 py-2">
          <ul className="text-red-300 text-sm">
            {errors.map((err, i) => <li key={i}>• {err}</li>)}
          </ul>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add</h3>
          </div>

          <div className="p-2 space-y-1">
            <button
              onClick={handleAddPlaceholder}
              disabled={placeholders.length >= 6}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo Placeholder
            </button>

            <button
              onClick={handleSelectBackground}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Background Image
            </button>
          </div>

          <div className="p-3 border-t border-gray-800 mt-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Frame Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Frame Size</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value as FramePreset)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {Object.entries(FRAME_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={frameWidth}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value) || 1200
                      updateFrameDimensions(newWidth, frameHeight)
                      setSelectedPreset('custom')
                    }}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={frameHeight}
                    onChange={(e) => {
                      const newHeight = parseInt(e.target.value) || 1800
                      updateFrameDimensions(frameWidth, newHeight)
                      setSelectedPreset('custom')
                    }}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Photos: {imageCaptures}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={imageCaptures}
                  onChange={(e) => setImageCaptures(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 bg-gray-950 p-8 flex items-center justify-center overflow-auto">
          <div
            ref={canvasRef}
            className="relative bg-gray-800 shadow-2xl"
            style={{
              width: frameWidth > frameHeight ? '500px' : '400px',
              aspectRatio: `${frameWidth}/${frameHeight}`
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedPlaceholder(null)}
          >
            {/* Background */}
            {backgroundPath && layerVisibility['background'] !== false ? (
              <img
                src={pathToFileUrl(backgroundPath)}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                Click "Background Image" to add
              </div>
            )}

            {/* Placeholders */}
            {placeholders.map((ph, i) => (
              layerVisibility[ph.id] !== false && (
                <div
                  key={ph.id}
                  className={`absolute cursor-move transition-all ${selectedPlaceholder === ph.id
                      ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent'
                      : 'hover:ring-2 hover:ring-blue-400'
                    }`}
                  style={{
                    left: `${ph.x}%`,
                    top: `${ph.y}%`,
                    width: `${ph.width}%`,
                    height: `${ph.height}%`,
                    transform: `rotate(${ph.rotation}deg)`,
                    backgroundColor: ['#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#f97316', '#ec4899'][i % 6] + '80'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, ph.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold drop-shadow-lg">{i + 1}</span>
                  </div>
                  {/* Resize handles when selected */}
                  {selectedPlaceholder === ph.id && (
                    <>
                      <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full cursor-nw-resize"
                        onMouseDown={(e) => handleResizeStart(e, ph.id, 'nw')}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-ne-resize"
                        onMouseDown={(e) => handleResizeStart(e, ph.id, 'ne')}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full cursor-sw-resize"
                        onMouseDown={(e) => handleResizeStart(e, ph.id, 'sw')}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-se-resize"
                        onMouseDown={(e) => handleResizeStart(e, ph.id, 'se')}
                      />
                    </>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Right Sidebar - Properties & Layers */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Selected Properties */}
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Selected</h3>
            {selectedPh ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedPh.x}
                      onChange={(e) => handlePlaceholderChange(selectedPh.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedPh.y}
                      onChange={(e) => handlePlaceholderChange(selectedPh.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">W</label>
                    <input
                      type="number"
                      value={selectedPh.width}
                      onChange={(e) => handlePlaceholderChange(selectedPh.id, { width: parseInt(e.target.value) || 10 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">H</label>
                    <input
                      type="number"
                      value={selectedPh.height}
                      onChange={(e) => handlePlaceholderChange(selectedPh.id, { height: parseInt(e.target.value) || 10 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Rotate: {selectedPh.rotation}°</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedPh.rotation}
                    onChange={(e) => handlePlaceholderChange(selectedPh.id, { rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No element selected</p>
            )}
          </div>

          {/* Alignment */}
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alignment</h3>
            <div className="grid grid-cols-4 gap-1">
              {[
                { icon: '⬅', action: () => alignPlaceholder('left'), title: 'Align Left' },
                { icon: '↔', action: () => alignPlaceholder('center'), title: 'Center H' },
                { icon: '➡', action: () => alignPlaceholder('right'), title: 'Align Right' },
                { icon: '⬆', action: () => alignPlaceholder('top'), title: 'Align Top' },
                { icon: '↕', action: () => alignPlaceholder('middle'), title: 'Center V' },
                { icon: '⬇', action: () => alignPlaceholder('bottom'), title: 'Align Bottom' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  disabled={!selectedPlaceholder}
                  title={btn.title}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-sm"
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Layers */}
          <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Layers</h3>
            <div className="space-y-1">
              {/* Photo layers (reversed for visual order) */}
              {[...placeholders].reverse().map((ph, ri) => {
                const i = placeholders.length - 1 - ri
                return (
                  <div
                    key={ph.id}
                    onClick={() => setSelectedPlaceholder(ph.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedPlaceholder === ph.id ? 'bg-blue-600/30 border border-blue-500' : 'hover:bg-gray-800'
                      }`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(ph.id) }}
                      className="text-gray-400 hover:text-white"
                    >
                      {layerVisibility[ph.id] !== false ? '👁' : '👁‍🗨'}
                    </button>
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: ['#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#f97316', '#ec4899'][i % 6] }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-gray-300 text-sm flex-1">Photo {i + 1}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemovePlaceholder(ph.id) }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      🗑
                    </button>
                  </div>
                )
              })}

              {/* Background layer */}
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 mt-2 border-t border-gray-800 pt-3">
                <button
                  onClick={() => toggleLayerVisibility('background')}
                  className="text-gray-400 hover:text-white"
                >
                  {layerVisibility['background'] !== false ? '👁' : '👁‍🗨'}
                </button>
                <div className="w-8 h-8 rounded bg-gray-700 overflow-hidden">
                  {backgroundPath && (
                    <img src={pathToFileUrl(backgroundPath)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-gray-300 text-sm">Background</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
