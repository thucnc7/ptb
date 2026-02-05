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

// Layer type for frame editor (image layer or photo placeholder layer)
export interface Layer {
  id: string
  type: 'image' | 'photo'
  x: number      // Position from left (percentage 0-100)
  y: number      // Position from top (percentage 0-100)
  width: number  // Width (percentage 0-100)
  height: number // Height (percentage 0-100)
  rotation: number // Rotation in degrees
  imagePath?: string // Only for image type layers
}

export interface Frame {
  id: string
  name: string
  backgroundPath: string      // Local path to background image
  imageCaptures: number       // Number of photos to capture (1-6)
  placeholders: Placeholder[] // Where photos will be placed
  layers?: Layer[]            // New layer-based format (optional for backward compat)
  width: number               // Frame width in pixels (e.g., 1200)
  height: number              // Frame height in pixels (e.g., 1800)
  createdAt: Date
  updatedAt: Date
}

/**
 * Popular photobooth frame presets (width x height in pixels at 300 DPI)
 *
 * Common photobooth print sizes:
 * - 2x6" Strip: Classic photobooth strip (2-4 photos stacked vertically)
 * - 4x6" Portrait: Standard photo print, most common
 * - 4x4" Square: Instagram style
 * - 5x7" Portrait: Larger print size
 */
export const FRAME_PRESETS = {
  // Photobooth strip formats (most popular)
  '2x6-strip': { width: 600, height: 1800, label: '2x6" Strip (Classic)' },
  '2x6-strip-hd': { width: 900, height: 2700, label: '2x6" Strip HD' },

  // Standard photo prints
  '4x6-portrait': { width: 1200, height: 1800, label: '4x6" Portrait' },
  '4x6-landscape': { width: 1800, height: 1200, label: '4x6" Landscape' },
  '4x6-portrait-hd': { width: 1800, height: 2700, label: '4x6" Portrait HD' },

  // Square formats (social media friendly)
  '4x4-square': { width: 1200, height: 1200, label: '4x4" Square' },
  '5x5-square': { width: 1500, height: 1500, label: '5x5" Square' },

  // Larger formats
  '5x7-portrait': { width: 1500, height: 2100, label: '5x7" Portrait' },
  '5x7-landscape': { width: 2100, height: 1500, label: '5x7" Landscape' },
  '6x8-portrait': { width: 1800, height: 2400, label: '6x8" Portrait' },

  // Wide/panoramic formats
  '4x8-panoramic': { width: 1200, height: 2400, label: '4x8" Panoramic' },
  '3x9-strip': { width: 900, height: 2700, label: '3x9" Long Strip' },

  // Custom
  'custom': { width: 1200, height: 1800, label: 'Custom Size' }
} as const

export type FramePreset = keyof typeof FRAME_PRESETS

export interface FrameConfig {
  frames: Frame[]
  selectedFrameId: string | null
}
