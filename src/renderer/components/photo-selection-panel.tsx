/**
 * Photo selection panel - main orchestrator
 * 40/60 split: left captured photos grid, right frame slots preview
 * User picks best N photos from N+extra captures to fill frame slots
 */

import { useState, useCallback } from 'react'
import type { CapturedPhoto } from '../../shared/types/session-types'
import type { Frame } from '../../shared/types/frame-types'
import { PhotoSelectionCapturedGrid } from './photo-selection-captured-grid'
import { PhotoSelectionFrameSlots } from './photo-selection-frame-slots'

interface PhotoSelectionPanelProps {
  capturedPhotos: CapturedPhoto[]
  frame: Frame
  onConfirm: (selectedPhotoIndices: number[]) => void
}

export function PhotoSelectionPanel({
  capturedPhotos,
  frame,
  onConfirm
}: PhotoSelectionPanelProps) {
  // slotAssignments[slotIndex] = capturedPhotos array index | null
  const [slotAssignments, setSlotAssignments] = useState<(number | null)[]>(
    Array(frame.imageCaptures).fill(null)
  )

  // Click photo in left grid: toggle assign/unassign
  const handlePhotoClick = useCallback((photoArrayIndex: number) => {
    setSlotAssignments(prev => {
      const next = [...prev]
      const existingSlot = next.indexOf(photoArrayIndex)

      if (existingSlot !== -1) {
        // Already assigned -> unassign
        next[existingSlot] = null
      } else {
        // Find first empty slot
        const emptySlot = next.indexOf(null)
        if (emptySlot !== -1) {
          next[emptySlot] = photoArrayIndex
        }
      }
      return next
    })
  }, [])

  // Click slot in right panel: unassign if filled
  const handleSlotClick = useCallback((slotIndex: number) => {
    setSlotAssignments(prev => {
      if (prev[slotIndex] === null) return prev
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }, [])

  // Confirm: map slot assignments to actual photo.index values
  const handleConfirm = useCallback(() => {
    // Guard: all slots must be filled
    if (slotAssignments.some(v => v === null)) return

    const selectedIndices = slotAssignments.map(arrayIdx => {
      return capturedPhotos[arrayIdx!].index
    })
    onConfirm(selectedIndices)
  }, [slotAssignments, capturedPhotos, onConfirm])

  return (
    <div className="w-full h-full flex">
      <PhotoSelectionCapturedGrid
        capturedPhotos={capturedPhotos}
        slotAssignments={slotAssignments}
        onPhotoClick={handlePhotoClick}
      />

      <div className="w-px bg-white/10 shrink-0" />

      <PhotoSelectionFrameSlots
        frame={frame}
        capturedPhotos={capturedPhotos}
        slotAssignments={slotAssignments}
        onSlotClick={handleSlotClick}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
