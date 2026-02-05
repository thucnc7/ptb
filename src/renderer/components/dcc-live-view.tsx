import { useState, useEffect, useRef, useCallback } from 'react'

interface DccLiveViewProps {
    className?: string
    onError?: (error: string) => void
}

export function DccLiveView({ className = '', onError }: DccLiveViewProps) {
    const [streamUrl, setStreamUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const imgRef = useRef<HTMLImageElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const maxRetries = 5

    const initStream = useCallback(async () => {
        setIsLoading(true)
        setHasError(false)

        try {
            const url = await window.electronAPI.camera.getLiveViewUrl()
            console.log('Live view URL:', url)
            // MJPEG streams often don't support query parameters or it causes restart issues
            setStreamUrl(url)
        } catch (e) {
            console.error('Failed to get live view URL:', e)
            // Use default URL
            setStreamUrl('http://127.0.0.1:5514/live')
        }

        // For MJPEG streams, onload may not fire correctly
        // Set a timeout to check if the stream is loading
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Increase timeout to 5s to allow slower connections
        timeoutRef.current = setTimeout(() => {
            if (imgRef.current) {
                // If naturalWidth > 0, stream is working
                if (imgRef.current.naturalWidth > 0) {
                    setIsLoading(false)
                    setHasError(false)
                    setRetryCount(0)
                } else {
                    console.warn('Live view timeout: naturalWidth is 0')
                    setIsLoading(false)
                    // Auto-retry if under max retries
                    if (retryCount < maxRetries) {
                        console.log(`Live view not ready, auto-retry ${retryCount + 1}/${maxRetries}...`)
                        setRetryCount(prev => prev + 1)
                        retryTimeoutRef.current = setTimeout(() => {
                            initStream()
                        }, 2000)
                    } else {
                        setHasError(true)
                    }
                }
            }
        }, 3000)
    }, [retryCount])

    useEffect(() => {
        initStream()

        return () => {
            // Cleanup: Close connection by clearing URL
            setStreamUrl('')

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current)
            }
        }
    }, [])

    const handleLoad = () => {
        console.log('Live view img onLoad triggered')
        setIsLoading(false)
        setHasError(false)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.error('Live view error:', e)
        setIsLoading(false)
        setHasError(true)
        onError?.('Live view stream failed to load')
    }

    return (
        <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
            {streamUrl && (
                <img
                    ref={imgRef}
                    src={streamUrl}
                    alt="Camera Live View"
                    className="w-full h-full object-contain"
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{ minHeight: '300px' }}
                    crossOrigin="anonymous"
                />
            )}

            {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
                        <p className="text-gray-400">
                            {retryCount > 0 ? `Đang thử lại (${retryCount}/${maxRetries})...` : 'Đang kết nối live view...'}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                            Đợi digiCamControl khởi động Live View...
                        </p>
                    </div>
                </div>
            )}

            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center p-4">
                        <p className="text-red-400 mb-2">❌ Live view không khả dụng</p>
                        <p className="text-gray-500 text-sm mb-2">
                            Kiểm tra trong digiCamControl:<br />
                            1. Đã bật Live View window<br />
                            2. Web Server đang chạy (port 5514)
                        </p>
                        <button
                            onClick={() => {
                                setRetryCount(0)
                                initStream()
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                            🔄 Thử lại
                        </button>
                    </div>
                </div>
            )}

            {!isLoading && !hasError && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
                    🔴 LIVE
                </div>
            )}
        </div>
    )
}
