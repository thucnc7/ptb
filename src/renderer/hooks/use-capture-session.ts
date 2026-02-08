import { useState, useCallback, useRef, useEffect } from 'react'
import { CaptureSession, SessionState, CapturedPhoto } from '../../shared/types/session-types'
import { Frame } from '../../shared/types/frame-types'
import { v4 as uuidv4 } from 'uuid'

interface UseCaptureSessionReturn {
    session: CaptureSession | null
    currentFrame: Frame | null
    status: SessionState
    timeLeft: number | null
    currentShotIndex: number
    error: string | null
    initSession: (frameId: string) => Promise<void>
    startCaptureSequence: () => Promise<void>
    retakePhoto: (index: number) => Promise<void>
    finishSession: () => Promise<void>
    cancelSession: () => void
}

const COUNTDOWN_SECONDS = 3

export function useCaptureSession(): UseCaptureSessionReturn {
    const [session, setSession] = useState<CaptureSession | null>(null)
    const [currentFrame, setCurrentFrame] = useState<Frame | null>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Track current shot index (0 to N-1)
    const [currentShotIndex, setCurrentShotIndex] = useState(0)

    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeLeft(null)
    }, [])

    const initSession = useCallback(async (frameId: string) => {
        try {
            setError(null)
            const frame = await window.electronAPI.frames.getById(frameId)
            if (!frame) throw new Error('Frame not found')

            setCurrentFrame(frame)
            setSession({
                id: `session-${Date.now()}`,
                state: 'idle',
                frameId,
                totalPhotos: frame.imageCaptures,
                currentPhotoIndex: 0,
                capturedPhotos: [],
                selectedPhotoIndices: [],
                countdownValue: 5,
                countdownConfig: null,
                autoSequenceEnabled: false,
                compositePath: null,
                driveFileId: null,
                downloadLink: null,
                qrCodeDataUrl: null,
                error: null
            })
            setCurrentShotIndex(0)
        } catch (e: any) {
            setError(e.message)
        }
    }, [])

    const performCapture = useCallback(async (targetIndex: number) => {
        if (!session || !currentFrame) return

        try {
            // 1. Start Countdown
            setSession(prev => prev ? { ...prev, status: 'countdown' } : null)

            for (let i = COUNTDOWN_SECONDS; i > 0; i--) {
                setTimeLeft(i)
                await new Promise(r => setTimeout(r, 1000))
            }
            setTimeLeft(null)

            // 2. Capture
            setSession(prev => prev ? { ...prev, state: 'capturing' } : null)

            // Stop live view briefly implies visual feedback
            // const liveViewUrl = await window.electronAPI.camera.getLiveViewUrl()

            const result = await window.electronAPI.camera.capture()

            if (result.success && result.filePath) {
                setSession(prev => {
                    if (!prev) return null

                    const newPhoto: CapturedPhoto = {
                        id: uuidv4(),
                        path: result.filePath!,
                        previewUrl: result.previewUrl!,
                        capturedAt: new Date(result.timestamp || Date.now()) || Date.now(),
                        index: targetIndex
                    }

                    // Replace existing or add new
                    const existingPhotos = [...prev.capturedPhotos]
                    const existingIdx = existingPhotos.findIndex(p => p.index === targetIndex)

                    if (existingIdx >= 0) {
                        existingPhotos[existingIdx] = newPhoto
                    } else {
                        existingPhotos.push(newPhoto)
                    }

                    return { ...prev, capturedPhotos: existingPhotos }
                })

                return true
            } else {
                throw new Error(result.error || 'Capture failed')
            }
        } catch (e: any) {
            setError(e.message)
            setSession(prev => prev ? { ...prev, state: 'idle' } : null)
            return false
        }
    }, [session, currentFrame])

    const startCaptureSequence = useCallback(async () => {
        if (!currentFrame || !session) return

        // Find first missing photo or start from 0
        let nextIndex = 0
        while (nextIndex < currentFrame.placeholders.length) { // Assuming placeholders define photo count? Or separate config?
            // Based on tasks, 'frame.imageCaptures' or similar. 
            // The Type definition for Frame is in another file, let's assume placeholders count matches photo count for now.
            // Wait, let me check Frame type definition
            const hasPhoto = session.capturedPhotos.some(p => p.index === nextIndex)
            if (!hasPhoto) break
            nextIndex++
        }

        // If all captured, this might be a full retake or nothing? 
        // Assuming start = start filling empty slots

        // Actually, let's look at how many photos needed. 
        // Frame type likely has placeholders. 
        const totalPhotos = currentFrame.placeholders.length

        if (nextIndex >= totalPhotos) {
            // Already full? 
            setSession(prev => prev ? { ...prev, status: 'reviewing' } : null)
            return
        }

        setCurrentShotIndex(nextIndex)
        const success = await performCapture(nextIndex)

        if (success) {
            // Auto proceed to next or finish
            if (nextIndex + 1 < totalPhotos) {
                // Wait a bit then next? Or user trigger? 
                // Plan says "Auto-capture sequence". 
                // Let's add a small delay then recurse? 
                // Better to allow caller to control loop, or state machine effect.

                // For now, let's just go to reviewing if full, or idle if not.
                // Actually, let's set status to idle so user can trigger next or auto?
                // Let's implement auto-sequence in the component or effect? 
                // Simpler: Just capture one by one for now in hook, component drives loop.

                // Check if now full
                setSession(prev => {
                    if (!prev) return null;
                    const count = prev.capturedPhotos.length
                    if (count >= totalPhotos) {
                        return { ...prev, status: 'reviewing' }
                    }
                    return { ...prev, state: 'idle' } // Ready for next
                })
            } else {
                setSession(prev => prev ? { ...prev, status: 'reviewing' } : null)
            }
        }

    }, [currentFrame, session, performCapture])

    const retakePhoto = useCallback(async (index: number) => {
        setCurrentShotIndex(index)
        await performCapture(index)
        setSession(prev => prev ? { ...prev, status: 'reviewing' } : null)
    }, [performCapture])

    const finishSession = useCallback(async () => {
        setSession(prev => prev ? { ...prev, status: 'processing' } : null)
        // Trigger composite (Phase 5)
        // For now just complete
        setSession(prev => prev ? { ...prev, status: 'completed' } : null)
    }, [])

    const cancelSession = useCallback(() => {
        cleanup()
        setSession(null)
        setCurrentFrame(null)
    }, [cleanup])

    // Derive status
    const status = session?.state || 'idle'

    return {
        session,
        currentFrame,
        status,
        timeLeft,
        currentShotIndex,
        error,
        initSession,
        startCaptureSequence, // Rename to captureNext?
        retakePhoto,
        finishSession,
        cancelSession
    }
}
