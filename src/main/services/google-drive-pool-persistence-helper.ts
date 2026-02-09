/**
 * Cloudinary Pool Persistence Helper
 * Handles saving/loading pool state to/from disk for Cloudinary slot management
 */

import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'

export interface CloudinarySlot {
  publicId: string
  downloadLink: string
  status: 'available' | 'claimed' | 'uploaded'
  sessionId?: string
  claimedAt?: number
}

export interface PoolState {
  slots: CloudinarySlot[]
}

const POOL_FILE = 'cloudinary-pool.json'

function getPoolFilePath(): string {
  return path.join(app.getPath('userData'), POOL_FILE)
}

/** Load existing pool state from disk */
export async function loadPoolState(): Promise<PoolState> {
  try {
    const data = await fs.readFile(getPoolFilePath(), 'utf-8')
    const state = JSON.parse(data) as PoolState
    console.log('[CLOUDINARY] Loaded pool state:', state.slots.length, 'slots')
    return state
  } catch {
    console.log('[CLOUDINARY] No existing pool state, creating new')
    return { slots: [] }
  }
}

/** Save pool state to disk */
export async function savePoolState(state: PoolState): Promise<void> {
  await fs.writeFile(getPoolFilePath(), JSON.stringify(state, null, 2))
}
