/**
 * Cloudinary Pre-Allocated Slot Service
 * Manages pool of 150 pre-created Cloudinary images for instant QR code generation
 * Uses deterministic URLs and overwrite=true to replace placeholder with real composite
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { createPlaceholderBuffer } from './google-drive-placeholder-helper'
import {
  loadPoolState,
  savePoolState,
  type CloudinarySlot,
  type PoolState,
} from './google-drive-pool-persistence-helper'
import dotenv from 'dotenv'

const POOL_TARGET = 150
const BATCH_SIZE = 10
const REFILL_THRESHOLD = 20
const REFILL_COUNT = 30

class CloudinarySlotService {
  private poolState: PoolState = { slots: [] }
  private initialized = false
  private configured = false

  /** Initialize Cloudinary client with credentials from .env */
  private ensureCloudinaryConfig(): void {
    if (this.configured) return

    try {
      // Load .env from app root
      const envPath = app.isPackaged
        ? path.join(process.resourcesPath, '.env')
        : path.join(app.getAppPath(), '.env')

      dotenv.config({ path: envPath })

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dqkwjkcnq'
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET

      if (!apiKey || !apiSecret) {
        throw new Error('Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in environment')
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      })

      this.configured = true
      console.log('[CLOUDINARY] Config loaded for cloud:', cloudName)
    } catch (error) {
      console.error('[CLOUDINARY] Failed to load config:', error)
      throw error
    }
  }

  /** Upload buffer using promisified upload_stream */
  private uploadBuffer(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          folder: '',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!)
        }
      )
      stream.end(buffer)
    })
  }

  /** Generate deterministic Cloudinary URL for a slot */
  private getSlotUrl(index: number): string {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dqkwjkcnq'
    const publicId = `ptb/slot-${String(index).padStart(3, '0')}`
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.jpg`
  }

  /** Create a single slot with placeholder image on Cloudinary */
  private async createSlot(index: number): Promise<CloudinarySlot> {
    this.ensureCloudinaryConfig()
    const publicId = `ptb/slot-${String(index).padStart(3, '0')}`
    const placeholder = await createPlaceholderBuffer()

    await this.uploadBuffer(placeholder, publicId)

    console.log('[CLOUDINARY] Created slot', index, ':', publicId)
    return {
      publicId,
      downloadLink: this.getSlotUrl(index),
      status: 'available',
    }
  }

  /** Create slots in batches and persist after each batch */
  private async createSlotBatches(startIdx: number, count: number): Promise<void> {
    for (let i = startIdx; i < startIdx + count; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, startIdx + count)
      const batch = Array.from({ length: batchEnd - i }, (_, j) => this.createSlot(i + j))
      const slots = await Promise.all(batch)
      this.poolState.slots.push(...slots)
      await savePoolState(this.poolState)
      console.log('[CLOUDINARY] Progress:', this.poolState.slots.length, '/', startIdx + count)
    }
  }

  /** Initialize pool with 150 pre-allocated slots */
  async initializePool(): Promise<void> {
    if (this.initialized && this.poolState.slots.length >= POOL_TARGET) return
    this.ensureCloudinaryConfig()
    this.poolState = await loadPoolState()
    const remaining = POOL_TARGET - this.poolState.slots.length
    if (remaining > 0) {
      await this.createSlotBatches(this.poolState.slots.length, remaining)
    }
    this.initialized = true
    console.log('[CLOUDINARY] Pool ready:', this.poolState.slots.length, 'slots')
  }

  /** Claim an available slot for a capture session */
  async claimSlot(sessionId: string): Promise<{ publicId: string; downloadLink: string }> {
    const slot = this.poolState.slots.find((s) => s.status === 'available')
    if (!slot) throw new Error('No available slots in pool')
    slot.status = 'claimed'
    slot.sessionId = sessionId
    slot.claimedAt = Date.now()
    await savePoolState(this.poolState)
    console.log('[CLOUDINARY] Claimed slot for:', sessionId)
    // Auto-refill check in background
    this.refillPool().catch(() => {})
    return { publicId: slot.publicId, downloadLink: slot.downloadLink }
  }

  /** Replace placeholder with real composite image */
  async uploadRealImage(publicId: string, imagePath: string): Promise<void> {
    this.ensureCloudinaryConfig()
    await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
    })
    const slot = this.poolState.slots.find((s) => s.publicId === publicId)
    if (slot) {
      slot.status = 'uploaded'
      await savePoolState(this.poolState)
    }
    console.log('[CLOUDINARY] Uploaded real image:', publicId)
  }

  /** Release slot back to available (replace with placeholder) */
  async releaseSlot(publicId: string): Promise<void> {
    this.ensureCloudinaryConfig()
    const placeholder = await createPlaceholderBuffer()
    await this.uploadBuffer(placeholder, publicId)
    const slot = this.poolState.slots.find((s) => s.publicId === publicId)
    if (slot) {
      slot.status = 'available'
      slot.sessionId = undefined
      slot.claimedAt = undefined
      await savePoolState(this.poolState)
    }
    console.log('[CLOUDINARY] Released slot:', publicId)
  }

  /** Get current pool statistics */
  getPoolStatus() {
    const slots = this.poolState.slots
    return {
      total: slots.length,
      available: slots.filter((s) => s.status === 'available').length,
      claimed: slots.filter((s) => s.status === 'claimed').length,
      uploaded: slots.filter((s) => s.status === 'uploaded').length,
    }
  }

  /** Refill pool if available slots drop below threshold */
  async refillPool(): Promise<void> {
    const { available } = this.getPoolStatus()
    if (available >= REFILL_THRESHOLD) return
    console.log('[CLOUDINARY] Refilling pool, available:', available)
    await this.createSlotBatches(this.poolState.slots.length, REFILL_COUNT)
    console.log('[CLOUDINARY] Refill complete')
  }
}

let instance: CloudinarySlotService | null = null

export function getCloudinarySlotService(): CloudinarySlotService {
  if (!instance) instance = new CloudinarySlotService()
  return instance
}
