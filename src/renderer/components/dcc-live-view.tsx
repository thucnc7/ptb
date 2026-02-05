import { useState, useEffect, useRef, useCallback } from 'react'

interface DccLiveViewProps {
  className?: string
  onError?: (error: string) => void
  /** Polling interval in ms (default: 100ms = ~10fps) */
  pollInterval?: number
}

export function DccLiveView({ className = '', onError, pollInterval = 100 }: DccLiveViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const baseUrlRef = useRef<string>('')
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

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

  const handleLoad = () => {
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
          src={imageUrl}
          alt="Camera Live View"
          className="w-full h-full object-contain"
          onLoad={handleLoad}
          onError={handleImgError}
          style={{ minHeight: '300px' }}
        />
      )}

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
}
