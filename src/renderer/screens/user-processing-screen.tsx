/**
 * User Processing Screen
 * Shows animated progress while compositing photos
 */

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ProcessingScreen } from '../components/processing-screen'

export function UserProcessingScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, frameId, frame, selectedPhotoIndices, videoPath } = location.state || {}

  useEffect(() => {
    if (!sessionId || !frameId || !frame) {
      navigate('/user/select-frame')
      return
    }

    // Start compositing + Drive upload in parallel
    const processPhotos = async () => {
      try {
        // 1. Claim a Drive slot immediately (instant QR link)
        let driveSlot: { fileId: string; downloadLink: string } | null = null
        try {
          driveSlot = await window.electronAPI.drive.claimSlot(sessionId)
          console.log('[PROCESSING] Claimed Drive slot:', driveSlot.downloadLink)
        } catch (err) {
          console.warn('[PROCESSING] Drive slot claim failed, continuing without:', err)
        }

        // 2. Composite photos into frame
        const result = await window.electronAPI.session.composite(sessionId, frame, selectedPhotoIndices)
        if (!result.success) throw new Error('Compositing failed')

        // 3. Upload real image to Drive in background (don't block navigation)
        if (driveSlot && result.path) {
          window.electronAPI.drive.uploadRealImage(driveSlot.fileId, result.path)
            .then(() => console.log('[PROCESSING] Drive upload complete'))
            .catch(err => console.error('[PROCESSING] Drive upload failed:', err))
        }

        // 4. Navigate to result with Drive download link
        navigate('/user/result', {
          state: {
            sessionId,
            compositePath: result.path,
            downloadUrl: driveSlot?.downloadLink || '',
            videoPath: videoPath || null
          }
        })
      } catch (err) {
        console.error('Processing failed:', err)
        navigate('/user/select-frame')
      }
    }

    processPhotos()
  }, [sessionId, frameId, frame, navigate])

  return <ProcessingScreen message="Đang tạo ảnh siêu đẹp..." />
}
