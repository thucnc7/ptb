import { useEffect, useRef, useState } from 'react'

interface LiveViewCanvasProps {
  width?: number
  height?: number
  className?: string
}

export function LiveViewCanvas({
  width = 1920,
  height = 1080,
  className = ''
}: LiveViewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(Date.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Subscribe to live view frames
    const unsubscribe = window.electronAPI.camera.onLiveViewFrame(
      (imageData) => {
        setIsStreaming(true)

        // Create image from base64 data
        const img = new Image()
        img.onload = () => {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Draw image to fill canvas while maintaining aspect ratio
          const canvasAspect = canvas.width / canvas.height
          const imageAspect = img.width / img.height

          let drawWidth = canvas.width
          let drawHeight = canvas.height
          let offsetX = 0
          let offsetY = 0

          if (canvasAspect > imageAspect) {
            drawWidth = canvas.height * imageAspect
            offsetX = (canvas.width - drawWidth) / 2
          } else {
            drawHeight = canvas.width / imageAspect
            offsetY = (canvas.height - drawHeight) / 2
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

          // Update FPS counter
          frameCountRef.current++
          const now = Date.now()
          const elapsed = now - lastFpsUpdateRef.current
          if (elapsed >= 1000) {
            setFps(Math.round((frameCountRef.current / elapsed) * 1000))
            frameCountRef.current = 0
            lastFpsUpdateRef.current = now
          }
        }
        img.src = imageData
      }
    )

    return () => {
      unsubscribe()
      setIsStreaming(false)
      setFps(0)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full bg-gray-900 rounded-lg"
      />
      {isStreaming && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
          Live {fps} FPS
        </div>
      )}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <p className="text-gray-400">No live view</p>
        </div>
      )}
    </div>
  )
}
