import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface DccLiveViewRef {
  getStream: () => MediaStream | null
}

interface DccLiveViewProps {
  className?: string
  onError?: (error: string) => void
  /** Polling interval in ms (default: 100ms = ~10fps) */
  pollInterval?: number
}

export const DccLiveView = forwardRef<DccLiveViewRef, DccLiveViewProps>(function DccLiveView(
  { className = '', onError, pollInterval = 100 },
  ref
) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const baseUrlRef = useRef<string>('')
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Expose getStream for video recording via canvas.captureStream()
  useImperativeHandle(ref, () => ({
    getStream: (): MediaStream | null => {
      if (streamRef.current) return streamRef.current
      const canvas = canvasRef.current
      if (!canvas || !canvas.width) return null
      streamRef.current = canvas.captureStream(10) // 10fps
      return streamRef.current
    }
  }))

  const updateFrame = useCallback(() => {
    if (baseUrlRef.current) {
      // Add timestamp to bypass cache
      setImageUrl(`${baseUrlRef.current}?t=${Date.now()}`)
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    pollTimerRef.current = setInterval(updateFrame, pollInterval)
  }, [updateFrame, pollInterval])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const initStream = async () => {
    setStatus('loading')
    stopPolling()

    try {
      const url = await window.electronAPI.camera.getLiveViewUrl()
      console.log('Live view URL:', url)
      baseUrlRef.current = url

      // Load first frame
      setImageUrl(`${url}?t=${Date.now()}`)

    } catch (e) {
      console.error('Failed to get live view URL:', e)
      handleError(e instanceof Error ? e.message : 'Không thể kết nối')
    }
  }

  /** Draw current img frame onto hidden canvas for captureStream recording */
  const drawToCanvas = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas || !img.naturalWidth) return
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
    }
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(img, 0, 0)
  }, [])

  const handleLoad = () => {
    // Draw every loaded frame to canvas for video recording
    drawToCanvas()
    if (status === 'loading') {
      console.log('First frame loaded, starting polling')
      setStatus('ready')
      retryCountRef.current = 0
      startPolling()
    }
  }

  const handleError = (message: string) => {
    console.error('Live view error:', message)
    stopPolling()

    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++
      console.log(`Retry ${retryCountRef.current}/${maxRetries}...`)
      setTimeout(initStream, 1500)
    } else {
      setStatus('error')
      onError?.(message)
    }
  }

  const handleImgError = () => {
    if (status === 'loading') {
      handleError('Không thể tải live view')
    }
    // During polling, just skip failed frame
  }

  const handleRetry = () => {
    retryCountRef.current = 0
    initStream()
  }

  useEffect(() => {
    initStream()
    return () => {
      stopPolling()
      setImageUrl(null)
    }
  }, [])

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {imageUrl && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Camera Live View"
          className="w-full h-full object-contain"
          onLoad={handleLoad}
          onError={handleImgError}
          style={{ minHeight: '300px' }}
        />
      )}
      {/* Hidden canvas for captureStream() video recording */}
      <canvas ref={canvasRef} className="hidden" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
            <p className="text-gray-400">
              {retryCountRef.current > 0
                ? `Đang thử lại (${retryCountRef.current}/${maxRetries})...`
                : 'Đang kết nối live view...'}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-4 max-w-md">
            <p className="text-red-400 mb-3 text-lg">❌ Live view không khả dụng</p>
            <div className="text-gray-400 text-sm mb-4 text-left bg-gray-800 p-3 rounded">
              <p className="font-semibold mb-2">Kiểm tra:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>DCC đang chạy và Webserver enabled</li>
                <li>Camera đã kết nối với DCC</li>
                <li>Bật Live View trong DCC</li>
              </ol>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
          🔴 LIVE
        </div>
      )}
    </div>
  )
})
