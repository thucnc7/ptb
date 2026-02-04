/**
 * Frame service for renderer process
 * Communicates with main process via IPC for frame CRUD operations
 */

import type { Frame, Placeholder } from '../../shared/types/frame-types'

// Re-export types for convenience
export type { Frame, Placeholder }

/**
 * Get all frames from storage
 */
export async function getAllFrames(): Promise<Frame[]> {
  return window.electronAPI.frames.getAll()
}

/**
 * Get a single frame by ID
 */
export async function getFrameById(id: string): Promise<Frame | null> {
  return window.electronAPI.frames.getById(id)
}

/**
 * Create a new frame
 */
export async function createFrame(
  data: Omit<Frame, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Frame> {
  return window.electronAPI.frames.create(data)
}

/**
 * Update an existing frame
 */
export async function updateFrame(
  id: string,
  updates: Partial<Omit<Frame, 'id' | 'createdAt'>>
): Promise<Frame> {
  return window.electronAPI.frames.update(id, updates)
}

/**
 * Delete a frame by ID
 */
export async function deleteFrame(id: string): Promise<boolean> {
  return window.electronAPI.frames.delete(id)
}

/**
 * Open file dialog to select background image
 * Returns file path or null if cancelled
 */
export async function selectBackgroundImage(): Promise<string | null> {
  return window.electronAPI.frames.selectBackgroundImage()
}

/**
 * Import background image to app data folder
 * Returns new path in app data
 */
export async function importBackgroundImage(sourcePath: string): Promise<string> {
  return window.electronAPI.frames.importBackgroundImage(sourcePath)
}

/**
 * Create a new placeholder with default values
 */
export function createPlaceholder(index: number): Placeholder {
  return {
    id: `ph-${Date.now()}-${index}`,
    x: 10 + (index * 20) % 60,
    y: 10 + Math.floor(index / 3) * 25,
    width: 25,
    height: 30,
    rotation: 0
  }
}

/**
 * Validate frame data before save
 */
export function validateFrame(frame: Partial<Frame>): string[] {
  const errors: string[] = []

  if (!frame.name?.trim()) {
    errors.push('Frame name is required')
  }

  if (!frame.backgroundPath) {
    errors.push('Background image is required')
  }

  if (!frame.imageCaptures || frame.imageCaptures < 1 || frame.imageCaptures > 6) {
    errors.push('Image captures must be between 1 and 6')
  }

  if (!frame.width || frame.width < 100 || frame.width > 10000) {
    errors.push('Frame width must be between 100 and 10000 pixels')
  }

  if (!frame.height || frame.height < 100 || frame.height > 10000) {
    errors.push('Frame height must be between 100 and 10000 pixels')
  }

  if (!frame.placeholders || frame.placeholders.length === 0) {
    errors.push('At least one placeholder is required')
  }

  if (frame.placeholders && frame.imageCaptures &&
      frame.placeholders.length !== frame.imageCaptures) {
    errors.push(`Number of placeholders (${frame.placeholders.length}) must match image captures (${frame.imageCaptures})`)
  }

  return errors
}
