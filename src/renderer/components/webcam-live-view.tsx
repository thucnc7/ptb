/**
 * WebcamLiveView - Live webcam stream via getUserMedia
 * Uses <video> tag for smooth real-time preview.
 * Exposes captureFrame() via forwardRef for parent to trigger capture.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react'
import type { WebcamDevice } from '../../shared/types/camera-types'

export interface WebcamLiveViewRef {
  captureFrame: () => Promise<string> // returns data URL
}

interface WebcamLiveViewProps {
  className?: string
  onError?: (error: string) => void
  mirror?: boolean // default true for selfie mode
  selectedDeviceId?: string
  onDevicesLoaded?: (devices: WebcamDevice[]) => void
}

export const WebcamLiveView = forwardRef<WebcamLiveViewRef, WebcamLiveViewProps>(
  function WebcamLiveView(
    { className = '', onError, mirror = true, selectedDeviceId, onDevicesLoaded },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [errorMsg, setErrorMsg] = useState('')

    const stopStream = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }, [])

    const startStream = useCallback(
      async (deviceId?: string) => {
        stopStream()
        setStatus('loading')
        setErrorMsg('')

        try {
          const constraints: MediaStreamConstraints = {
            video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              aspectRatio: { ideal: 16 / 9 }
            }
          }

          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          streamRef.current = stream

          // Log actual resolution for debugging
          const videoTrack = stream.getVideoTracks()[0]
          const settings = videoTrack?.getSettings()
          console.log('[WEBCAM] Stream resolution:', settings?.width, 'x', settings?.height)

          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }

          // Enumerate devices after getting permission
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices: WebcamDevice[] = devices
            .filter((d) => d.kind === 'videoinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
              groupId: d.groupId
            }))
          onDevicesLoaded?.(videoDevices)

          setStatus('ready')
        } catch (err) {
          const error = err as DOMException
          let msg = 'Lỗi không xác định'

          if (error.name === 'NotAllowedError') {
            msg = 'Vui lòng cho phép truy cập camera'
          } else if (error.name === 'NotFoundError') {
            msg = 'Không tìm thấy webcam'
          } else if (error.name === 'NotReadableError') {
            msg = 'Camera đang được sử dụng bởi ứng dụng khác'
          } else if (error.name === 'OverconstrainedError') {
            msg = 'Camera không hỗ trợ cấu hình yêu cầu'
          }

          setStatus('error')
          setErrorMsg(msg)
          onError?.(msg)
        }
      },
      [stopStream, onDevicesLoaded, onError]
    )

    // Expose captureFrame to parent
    useImperativeHandle(ref, () => ({
      captureFrame: async (): Promise<string> => {
        const video = videoRef.current
        if (!video || !video.videoWidth) {
          throw new Error('Video stream not ready')
        }

        const canvas = canvasRef.current || document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Cannot get canvas context')

        // If mirrored, flip horizontally for capture
        if (mirror) {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }

        ctx.drawImage(video, 0, 0)

        // Reset transform
        if (mirror) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
        }

        return canvas.toDataURL('image/png')
      }
    }))

    // Start stream on mount, restart when device changes
    useEffect(() => {
      startStream(selectedDeviceId)
      return () => stopStream()
    }, [selectedDeviceId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleRetry = () => {
      startStream(selectedDeviceId)
    }

    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            const v = videoRef.current
            if (v) console.log('[WEBCAM] Video element:', v.videoWidth, 'x', v.videoHeight)
          }}
          className="w-full h-full object-contain"
          style={{
            transform: mirror ? 'scaleX(-1)' : undefined,
            minHeight: '300px'
          }}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading state */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4 mx-auto" />
              <p className="text-gray-400">Đang kết nối webcam...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center p-4 max-w-md">
              <p className="text-red-400 mb-3 text-lg">Webcam không khả dụng</p>
              <p className="text-gray-400 text-sm mb-4">{errorMsg}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* LIVE indicator */}
        {status === 'ready' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
            LIVE
          </div>
        )}
      </div>
    )
  }
)
