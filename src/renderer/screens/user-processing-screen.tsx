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
  const { sessionId, frameId, frame, selectedPhotoIndices } = location.state || {}

  useEffect(() => {
    if (!sessionId || !frameId || !frame) {
      navigate('/user/select-frame')
      return
    }

    // Start compositing process
    const processPhotos = async () => {
      try {
        // Call actual compositing API
        const result = await window.electronAPI.session.composite(sessionId, frame, selectedPhotoIndices)

        if (result.success) {
          // Navigate to result screen
          navigate('/user/result', {
            state: {
              sessionId,
              compositePath: result.path,
              downloadUrl: `https://photobooth.app/download/${sessionId}`
            }
          })
        } else {
          throw new Error('Compositing failed')
        }
      } catch (err) {
        console.error('Processing failed:', err)
        // Show error or navigate back
        navigate('/user/select-frame')
      }
    }

    processPhotos()
  }, [sessionId, frameId, frame, navigate])

  return <ProcessingScreen message="Đang tạo ảnh siêu đẹp..." />
}
