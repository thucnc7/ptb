/**
 * useVideoRecorder - Hook to record webcam MediaStream using MediaRecorder API
 * Records from countdown start to last capture completion
 * Saves as WebM file via Electron IPC
 */

import { useState, useRef, useCallback } from 'react'

interface UseVideoRecorderReturn {
  startRecording: (stream: MediaStream) => void
  stopRecording: () => Promise<void>
  isRecording: boolean
  videoSaved: boolean
  videoPath: string | null
}

/** Find best supported video MIME type */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return 'video/webm'
}

export function useVideoRecorder(sessionId: string | null): UseVideoRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [videoSaved, setVideoSaved] = useState(false)
  const [videoPath, setVideoPath] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current || !stream) return

    try {
      const mimeType = getSupportedMimeType()
      console.log('[VIDEO] Starting recording, mimeType:', mimeType)

      chunksRef.current = []
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000 // 2.5 Mbps for good quality
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onerror = (e) => {
        console.error('[VIDEO] Recording error:', e)
      }

      recorder.start(1000) // 1s timeslice
      recorderRef.current = recorder
      setIsRecording(true)
      console.log('[VIDEO] Recording started')
    } catch (err) {
      console.error('[VIDEO] Failed to start recording:', err)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    console.log('[VIDEO] Stopping recording...')

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
          console.log('[VIDEO] Recording stopped, blob size:', blob.size)

          if (blob.size > 0 && sessionId) {
            // Convert blob to array for IPC transfer
            const arrayBuffer = await blob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            const data = Array.from(uint8Array)

            console.log('[VIDEO] Saving video via IPC, data length:', data.length)
            const result = await window.electronAPI.video.save(sessionId, data)
            setVideoPath(result.path)
            setVideoSaved(true)
            console.log('[VIDEO] Video saved to:', result.path)
          }
        } catch (err) {
          console.error('[VIDEO] Failed to save video:', err)
        } finally {
          // Stop cloned stream tracks to release camera resource
          try {
            recorder.stream.getTracks().forEach(t => t.stop())
          } catch { /* ignore */ }
          recorderRef.current = null
          chunksRef.current = []
          setIsRecording(false)
          resolve()
        }
      }

      recorder.stop()
    })
  }, [sessionId])

  return { startRecording, stopRecording, isRecording, videoSaved, videoPath }
}
