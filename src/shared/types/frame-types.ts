/**
 * Frame template types for photobooth
 * A frame defines the background image and placeholder positions for captured photos
 */

export interface Placeholder {
  id: string
  x: number      // Position from left (percentage 0-100)
  y: number      // Position from top (percentage 0-100)
  width: number  // Width (percentage 0-100)
  height: number // Height (percentage 0-100)
  rotation: number // Rotation in degrees
}

export interface Frame {
  id: string
  name: string
  backgroundPath: string      // Local path to background image
  imageCaptures: number       // Number of photos to capture (1-6)
  placeholders: Placeholder[] // Where photos will be placed
  width: number               // Frame width in pixels (e.g., 1200)
  height: number              // Frame height in pixels (e.g., 1800)
  createdAt: Date
  updatedAt: Date
}

// Common frame presets (width x height in pixels)
export const FRAME_PRESETS = {
  '4x6': { width: 1200, height: 1800, label: '4x6 Portrait' },
  '6x4': { width: 1800, height: 1200, label: '6x4 Landscape' },
  '5x7': { width: 1500, height: 2100, label: '5x7 Portrait' },
  '2x6': { width: 600, height: 1800, label: '2x6 Strip' },
  'custom': { width: 1200, height: 1800, label: 'Custom' }
} as const

export type FramePreset = keyof typeof FRAME_PRESETS

export interface FrameConfig {
  frames: Frame[]
  selectedFrameId: string | null
}
