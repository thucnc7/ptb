/**
 * Admin frame editor screen - Professional Print Layout style
 * Create/edit frame with layers (images + photo placeholders)
 * All elements are layers with configurable z-index order
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getFrameById,
  createFrame,
  updateFrame,
  selectBackgroundImage,
  importBackgroundImage
} from '../services/frame-service'
import type { Frame, FramePreset, Layer } from '../../shared/types/frame-types'
import { FRAME_PRESETS } from '../../shared/types/frame-types'

// Convert local path to app:// protocol URL
function pathToFileUrl(filePath: string): string {
  if (!filePath) return ''
  // Use custom app:// protocol instead of file:// to bypass Electron security restrictions
  const normalizedPath = filePath.replace(/\\/g, '/')
  const url = `app://${normalizedPath}`
  console.log('🔧 pathToFileUrl:', filePath, '→', url)
  return url
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
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({})
  const [frameWidth, setFrameWidth] = useState(1200)
  const [frameHeight, setFrameHeight] = useState(1800)
  const [selectedPreset, setSelectedPreset] = useState<FramePreset>('4x6-portrait')

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null)
  const [resizing, setResizing] = useState<{ layerId: string; direction: string } | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isCanvasPanning, setIsCanvasPanning] = useState(false)

  // Computed: number of photo placeholders
  const imageCaptures = layers.filter(l => l.type === 'photo').length

  // Load existing frame if editing
  useEffect(() => {
    if (isEditing) {
      loadFrame()
    }
  }, [id])

  // Initialize layer visibility
  useEffect(() => {
    const vis: Record<string, boolean> = {}
    layers.forEach(layer => { vis[layer.id] = true })
    setLayerVisibility(vis)
  }, [layers.length])

  async function loadFrame() {
    if (!id) return
    setLoading(true)
    try {
      const frame = await getFrameById(id)
      if (frame) {
        setName(frame.name)
        setFrameWidth(frame.width || 1200)
        setFrameHeight(frame.height || 1800)

        // Convert old format to new layers format
        if (frame.layers && frame.layers.length > 0) {
          setLayers(frame.layers)
        } else {
          // Backward compatibility: convert old backgroundPath + placeholders
          const convertedLayers: Layer[] = []
          if (frame.backgroundPath) {
            convertedLayers.push({
              id: `img-background-${Date.now()}`,
              type: 'image',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              rotation: 0,
              imagePath: frame.backgroundPath
            })
          }
          frame.placeholders?.forEach((ph, i) => {
            convertedLayers.push({
              id: ph.id || `photo-${i}`,
              type: 'photo',
              x: ph.x,
              y: ph.y,
              width: ph.width,
              height: ph.height,
              rotation: ph.rotation
            })
          })
          setLayers(convertedLayers)
        }

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

  async function handleAddImage() {
    try {
      console.log('🔵 Opening file dialog...')
      const path = await selectBackgroundImage()
      console.log('🔵 Selected path:', path)

      if (path) {
        const importedPath = await importBackgroundImage(path)
        console.log('🔵 Imported path:', importedPath)
        console.log('🔵 File URL:', pathToFileUrl(importedPath))

        const newLayer: Layer = {
          id: `img-${Date.now()}`,
          type: 'image',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          imagePath: importedPath
        }
        console.log('🔵 New layer:', newLayer)
        setLayers([...layers, newLayer])
        setSelectedLayer(newLayer.id)
      }
    } catch (error) {
      console.error('❌ Failed to add image:', error)
    }
  }

  function handleAddPhotoPlaceholder() {
    const photoLayers = layers.filter(l => l.type === 'photo')
    if (photoLayers.length >= 6) return

    const index = photoLayers.length
    const newLayer: Layer = {
      id: `photo-${Date.now()}-${index}`,
      type: 'photo',
      x: 10 + (index * 20) % 60,
      y: 10 + Math.floor(index / 3) * 25,
      width: 25,
      height: 30,
      rotation: 0
    }
    setLayers([...layers, newLayer])
    setSelectedLayer(newLayer.id)
  }

  function handleRemoveLayer(layerId: string) {
    setLayers(layers.filter(l => l.id !== layerId))
    if (selectedLayer === layerId) {
      setSelectedLayer(null)
    }
  }

  function handleLayerChange(layerId: string, updates: Partial<Layer>) {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, ...updates } : l
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
    const widthRatio = frameWidth / newWidth
    const heightRatio = frameHeight / newHeight

    const newLayers = layers.map(l => ({
      ...l,
      x: l.x * widthRatio,
      y: l.y * heightRatio,
      width: l.width * widthRatio,
      height: l.height * heightRatio
    }))

    setLayers(newLayers)
    setFrameWidth(newWidth)
    setFrameHeight(newHeight)
  }

  // Move layer up/down in z-index
  function moveLayerOrder(layerId: string, direction: 'up' | 'down') {
    const index = layers.findIndex(l => l.id === layerId)
    if (index === -1) return

    if (direction === 'up' && index < layers.length - 1) {
      const newLayers = [...layers]
      ;[newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]]
      setLayers(newLayers)
    } else if (direction === 'down' && index > 0) {
      const newLayers = [...layers]
      ;[newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]]
      setLayers(newLayers)
    }
  }

  // Alignment functions
  function alignLayer(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    if (!selectedLayer) return
    const layer = layers.find(l => l.id === selectedLayer)
    if (!layer) return

    let updates: Partial<Layer> = {}
    switch (alignment) {
      case 'left': updates = { x: 0 }; break
      case 'center': updates = { x: 50 - layer.width / 2 }; break
      case 'right': updates = { x: 100 - layer.width }; break
      case 'top': updates = { y: 0 }; break
      case 'middle': updates = { y: 50 - layer.height / 2 }; break
      case 'bottom': updates = { y: 100 - layer.height }; break
    }
    handleLayerChange(selectedLayer, updates)
  }

  // Zoom & Pan handlers
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + Wheel
      const delta = -e.deltaY * 0.001
      const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5)
      setZoom(newZoom)
    } else {
      // Pan with wheel
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }))
    }
  }

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse button or Shift + Left click = Pan
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      e.preventDefault()
    }
  }

  // Handle click on canvas background (empty space) to enable panning
  function handleCanvasBackgroundMouseDown(e: React.MouseEvent) {
    // Only pan if clicking directly on canvas background (not on a layer)
    if (e.target === e.currentTarget) {
      setIsCanvasPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedLayer(null)
      e.preventDefault()
    }
  }

  function handleCanvasPan(e: React.MouseEvent) {
    if (isPanning || isCanvasPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  function handleCanvasMouseUp() {
    setIsPanning(false)
    setIsCanvasPanning(false)
  }

  function resetZoomPan() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function zoomIn() {
    setZoom(prev => Math.min(prev + 0.25, 5))
  }

  function zoomOut() {
    setZoom(prev => Math.max(prev - 0.25, 0.1))
  }

  // Drag handlers
  function handleMouseDown(e: React.MouseEvent, layerId: string) {
    if (!canvasRef.current) return
    e.stopPropagation()
    
    // If layer is already selected, start dragging
    if (selectedLayer === layerId) {
      const rect = canvasRef.current.getBoundingClientRect()
      setDragging(layerId)
      setDragStart({
        x: (e.clientX - rect.left) / rect.width * 100,
        y: (e.clientY - rect.top) / rect.height * 100
      })
    } else {
      // If layer is not selected, just select it
      setSelectedLayer(layerId)
    }
  }

  // Resize handlers
  function handleResizeStart(e: React.MouseEvent, layerId: string, direction: string) {
    if (!canvasRef.current) return
    e.stopPropagation()
    e.preventDefault()
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return
    const rect = canvasRef.current.getBoundingClientRect()
    setResizing({ layerId, direction })
    setDragStart({
      x: (e.clientX - rect.left) / rect.width * 100,
      y: (e.clientY - rect.top) / rect.height * 100
    })
    setResizeStart({ x: layer.x, y: layer.y, width: layer.width, height: layer.height })
    setSelectedLayer(layerId)
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
      const layer = layers.find(l => l.id === resizing.layerId)
      if (!layer) return

      let updates: Partial<Layer> = {}
      const minSize = 5

      switch (resizing.direction) {
        case 'se':
          updates = {
            width: Math.max(minSize, Math.min(100 - resizeStart.x, resizeStart.width + deltaX)),
            height: Math.max(minSize, Math.min(100 - resizeStart.y, resizeStart.height + deltaY))
          }
          break
        case 'sw':
          const newWidthSw = Math.max(minSize, resizeStart.width - deltaX)
          const newXSw = Math.max(0, resizeStart.x + resizeStart.width - newWidthSw)
          updates = {
            x: newXSw,
            width: newWidthSw,
            height: Math.max(minSize, Math.min(100 - resizeStart.y, resizeStart.height + deltaY))
          }
          break
        case 'ne':
          const newHeightNe = Math.max(minSize, resizeStart.height - deltaY)
          const newYNe = Math.max(0, resizeStart.y + resizeStart.height - newHeightNe)
          updates = {
            y: newYNe,
            width: Math.max(minSize, Math.min(100 - resizeStart.x, resizeStart.width + deltaX)),
            height: newHeightNe
          }
          break
        case 'nw':
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
      handleLayerChange(resizing.layerId, {
        x: Math.round(updates.x ?? layer.x),
        y: Math.round(updates.y ?? layer.y),
        width: Math.round(updates.width ?? layer.width),
        height: Math.round(updates.height ?? layer.height)
      })
      return
    }

    // Handle drag
    if (dragging) {
      const layer = layers.find(l => l.id === dragging)
      if (!layer) return
      const deltaX = currentX - dragStart.x
      const deltaY = currentY - dragStart.y
      const newX = Math.max(0, Math.min(100 - layer.width, layer.x + deltaX))
      const newY = Math.max(0, Math.min(100 - layer.height, layer.y + deltaY))
      handleLayerChange(dragging, { x: Math.round(newX), y: Math.round(newY) })
      setDragStart({ x: currentX, y: currentY })
    }
  }

  function handleMouseUp() {
    setDragging(null)
    setResizing(null)
    setResizeStart(null)
  }

  async function handleSave() {
    // Validation
    if (!name.trim()) {
      setErrors(['Frame name is required'])
      return
    }
    const photoLayers = layers.filter(l => l.type === 'photo')
    if (photoLayers.length === 0) {
      setErrors(['At least one photo placeholder is required'])
      return
    }

    setSaving(true)
    setErrors([])
    try {
      // Convert to old format for backward compatibility
      const backgroundLayer = layers.find(l => l.type === 'image')
      const frameData = {
        name,
        backgroundPath: backgroundLayer?.imagePath || '',
        imageCaptures: photoLayers.length,
        placeholders: photoLayers.map(l => ({
          id: l.id,
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height,
          rotation: l.rotation
        })),
        layers, // Save new format
        width: frameWidth,
        height: frameHeight
      }

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

  const selectedLayerData = layers.find(l => l.id === selectedLayer)

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
              onClick={handleAddImage}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Image
            </button>

            <button
              onClick={handleAddPhotoPlaceholder}
              disabled={imageCaptures >= 6}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo Placeholder
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
              </div>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div
          className="flex-1 bg-gray-950 p-8 flex items-center justify-center overflow-hidden relative"
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasPan}
          onMouseUp={handleCanvasMouseUp}
          style={{ cursor: isPanning || isCanvasPanning ? 'grabbing' : 'default' }}
        >
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg p-2 flex flex-col gap-1 shadow-lg">
            <button
              onClick={zoomIn}
              className="px-3 py-1 hover:bg-gray-700 rounded text-white text-sm font-bold"
              title="Zoom In (Ctrl/Cmd + Wheel Up)"
            >
              +
            </button>
            <div className="text-center text-xs text-gray-400 py-1">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={zoomOut}
              className="px-3 py-1 hover:bg-gray-700 rounded text-white text-sm font-bold"
              title="Zoom Out (Ctrl/Cmd + Wheel Down)"
            >
              −
            </button>
            <div className="h-px bg-gray-700 my-1" />
            <button
              onClick={resetZoomPan}
              className="px-3 py-1 hover:bg-gray-700 rounded text-white text-xs"
              title="Reset Zoom & Pan"
            >
              Reset
            </button>
          </div>

          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: (isPanning || isCanvasPanning) ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div
              ref={canvasRef}
              className="relative bg-gray-800 shadow-2xl overflow-visible cursor-grab active:cursor-grabbing"
              style={{
                width: frameWidth > frameHeight ? '500px' : '400px',
                aspectRatio: `${frameWidth}/${frameHeight}`
              }}
              onMouseDown={handleCanvasBackgroundMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
            {layers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                Click "Add Image" or "Photo Placeholder" to start
              </div>
            )}

            {/* Render layers in order (bottom to top) */}
            {layers.map((layer, zIndex) => {
              if (layerVisibility[layer.id] === false) return null

              const isImage = layer.type === 'image'
              const photoIndex = layers.filter(l => l.type === 'photo' && layers.indexOf(l) <= zIndex).length - 1
              const isSelected = selectedLayer === layer.id

              return (
                <div
                  key={layer.id}
                  className={`absolute transition-all ${
                    isSelected
                      ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent cursor-move'
                      : 'hover:ring-2 hover:ring-blue-400 cursor-pointer'
                  }`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.width}%`,
                    height: `${layer.height}%`,
                    transform: `rotate(${layer.rotation}deg)`,
                    zIndex,
                    backgroundColor: isImage ? 'transparent' : ['#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#f97316', '#ec4899'][photoIndex % 6] + '80',
                    pointerEvents: isSelected ? 'auto' : 'none'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleMouseDown(e, layer.id)
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isImage && layer.imagePath ? (
                    <img
                      src={pathToFileUrl(layer.imagePath)}
                      alt="Layer"
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                      onError={(e) => {
                        console.error('Failed to load image:', layer.imagePath)
                        if (layer.imagePath) {
                          console.error('Converted URL:', pathToFileUrl(layer.imagePath))
                        }
                        console.error('Error event:', e)
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully:', layer.imagePath)
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold drop-shadow-lg">{photoIndex + 1}</span>
                    </div>
                  )}

                  {/* Resize handles when selected */}
                  {selectedLayer === layer.id && (
                    <>
                      <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full cursor-nw-resize"
                        onMouseDown={(e) => handleResizeStart(e, layer.id, 'nw')}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-ne-resize"
                        onMouseDown={(e) => handleResizeStart(e, layer.id, 'ne')}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full cursor-sw-resize"
                        onMouseDown={(e) => handleResizeStart(e, layer.id, 'sw')}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-se-resize"
                        onMouseDown={(e) => handleResizeStart(e, layer.id, 'se')}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
          </div>
        </div>

        {/* Right Sidebar - Properties & Layers */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Selected Properties */}
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Selected</h3>
            {selectedLayerData ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-400">
                  Type: {selectedLayerData.type === 'image' ? '🖼️ Image' : '📷 Photo'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedLayerData.x}
                      onChange={(e) => handleLayerChange(selectedLayerData.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedLayerData.y}
                      onChange={(e) => handleLayerChange(selectedLayerData.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">W</label>
                    <input
                      type="number"
                      value={selectedLayerData.width}
                      onChange={(e) => handleLayerChange(selectedLayerData.id, { width: parseInt(e.target.value) || 10 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">H</label>
                    <input
                      type="number"
                      value={selectedLayerData.height}
                      onChange={(e) => handleLayerChange(selectedLayerData.id, { height: parseInt(e.target.value) || 10 })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Rotate: {selectedLayerData.rotation}°</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedLayerData.rotation}
                    onChange={(e) => handleLayerChange(selectedLayerData.id, { rotation: parseInt(e.target.value) })}
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
                { icon: '⬅', action: () => alignLayer('left'), title: 'Align Left' },
                { icon: '↔', action: () => alignLayer('center'), title: 'Center H' },
                { icon: '➡', action: () => alignLayer('right'), title: 'Align Right' },
                { icon: '⬆', action: () => alignLayer('top'), title: 'Align Top' },
                { icon: '↕', action: () => alignLayer('middle'), title: 'Center V' },
                { icon: '⬇', action: () => alignLayer('bottom'), title: 'Align Bottom' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  disabled={!selectedLayer}
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
              {/* Render layers in reverse (top to bottom visually) */}
              {[...layers].reverse().map((layer) => {
                const layerIndex = layers.indexOf(layer)
                const isImage = layer.type === 'image'
                const photoIndex = layers.filter(l => l.type === 'photo' && layers.indexOf(l) <= layerIndex).length - 1

                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selectedLayer === layer.id ? 'bg-blue-600/30 border border-blue-500' : 'hover:bg-gray-800'
                    }`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id) }}
                      className="text-gray-400 hover:text-white"
                    >
                      {layerVisibility[layer.id] !== false ? '👁' : '👁‍🗨'}
                    </button>
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                      style={{ backgroundColor: isImage ? '#6b7280' : ['#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#f97316', '#ec4899'][photoIndex % 6] }}
                    >
                      {isImage ? (
                        layer.imagePath && <img src={pathToFileUrl(layer.imagePath)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        photoIndex + 1
                      )}
                    </div>
                    <span className="text-gray-300 text-sm flex-1">
                      {isImage ? '🖼️ Image' : `📷 Photo ${photoIndex + 1}`}
                    </span>

                    {/* Layer order controls */}
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveLayerOrder(layer.id, 'up') }}
                        disabled={layerIndex === layers.length - 1}
                        className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        title="Move forward (đè lên)"
                      >
                        ⬆
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveLayerOrder(layer.id, 'down') }}
                        disabled={layerIndex === 0}
                        className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        title="Move backward (ra sau)"
                      >
                        ⬇
                      </button>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveLayer(layer.id) }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      🗑
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
