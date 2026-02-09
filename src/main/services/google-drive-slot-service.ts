/**
 * Google Drive Pre-Allocated Slot Service
 * Manages pool of 150 pre-created Drive files for instant QR code generation
 * Uses files.update() to replace placeholder with real composite image
 */

import { google } from 'googleapis'
import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { createPlaceholderBuffer, bufferToStream } from './google-drive-placeholder-helper'
import {
  loadPoolState, savePoolState,
  type DriveSlot, type PoolState
} from './google-drive-pool-persistence-helper'

const POOL_TARGET = 150
const BATCH_SIZE = 10
const REFILL_THRESHOLD = 20
const REFILL_COUNT = 30

class GoogleDriveSlotService {
  private drive: ReturnType<typeof google.drive> | null = null
  private poolState: PoolState = { slots: [], folderId: '' }
  private initialized = false

  /** Initialize Google Drive client with service account JWT */
  private ensureDriveClient(): ReturnType<typeof google.drive> {
    if (this.drive) return this.drive
    const keyPath = app.isPackaged
      ? path.join(process.resourcesPath, 'service_account.json')
      : path.join(app.getAppPath(), 'src', 'main', 'assets', 'service_account.json')

    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
    this.drive = google.drive({ version: 'v3', auth })
    console.log('[GDRIVE] Drive client initialized')
    return this.drive
  }

  /** Create or reuse "Photobooth" folder on Drive */
  private async ensureFolder(): Promise<string> {
    if (this.poolState.folderId) return this.poolState.folderId
    const drive = this.ensureDriveClient()
    const res = await drive.files.create({
      requestBody: { name: 'Photobooth', mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    this.poolState.folderId = res.data.id!
    await savePoolState(this.poolState)
    console.log('[GDRIVE] Created folder:', this.poolState.folderId)
    return this.poolState.folderId
  }

  /** Create a single slot with placeholder image on Drive */
  private async createSlot(folderId: string, index: number): Promise<DriveSlot> {
    const drive = this.ensureDriveClient()
    const placeholder = await createPlaceholderBuffer()
    const res = await drive.files.create({
      requestBody: { name: `ptb-${index}-${Date.now()}.jpg`, parents: [folderId] },
      media: { mimeType: 'image/jpeg', body: bufferToStream(placeholder) },
      fields: 'id',
    })
    await drive.permissions.create({
      fileId: res.data.id!,
      requestBody: { role: 'reader', type: 'anyone' },
    })
    console.log('[GDRIVE] Created slot', index, ':', res.data.id)
    return {
      fileId: res.data.id!,
      downloadLink: `https://drive.google.com/uc?export=download&id=${res.data.id}`,
      status: 'available',
    }
  }

  /** Create slots in batches and persist after each batch */
  private async createSlotBatches(folderId: string, startIdx: number, count: number): Promise<void> {
    for (let i = startIdx; i < startIdx + count; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, startIdx + count)
      const batch = Array.from({ length: batchEnd - i }, (_, j) => this.createSlot(folderId, i + j))
      const slots = await Promise.all(batch)
      this.poolState.slots.push(...slots)
      await savePoolState(this.poolState)
      console.log('[GDRIVE] Progress:', this.poolState.slots.length, '/', startIdx + count)
    }
  }

  /** Initialize pool with 150 pre-allocated slots */
  async initializePool(): Promise<void> {
    if (this.initialized && this.poolState.slots.length >= POOL_TARGET) return
    this.poolState = await loadPoolState()
    this.ensureDriveClient()
    const folderId = await this.ensureFolder()
    const remaining = POOL_TARGET - this.poolState.slots.length
    if (remaining > 0) {
      await this.createSlotBatches(folderId, this.poolState.slots.length, remaining)
    }
    this.initialized = true
    console.log('[GDRIVE] Pool ready:', this.poolState.slots.length, 'slots')
  }

  /** Claim an available slot for a capture session */
  async claimSlot(sessionId: string): Promise<{ fileId: string; downloadLink: string }> {
    const slot = this.poolState.slots.find(s => s.status === 'available')
    if (!slot) throw new Error('No available slots in pool')
    slot.status = 'claimed'
    slot.sessionId = sessionId
    slot.claimedAt = Date.now()
    await savePoolState(this.poolState)
    console.log('[GDRIVE] Claimed slot for:', sessionId)
    // Auto-refill check in background
    this.refillPool().catch(() => {})
    return { fileId: slot.fileId, downloadLink: slot.downloadLink }
  }

  /** Replace placeholder with real composite image */
  async uploadRealImage(fileId: string, imagePath: string): Promise<void> {
    const drive = this.ensureDriveClient()
    const buffer = await fs.readFile(imagePath)
    await drive.files.update({
      fileId,
      media: { mimeType: 'image/jpeg', body: bufferToStream(buffer) },
    })
    const slot = this.poolState.slots.find(s => s.fileId === fileId)
    if (slot) { slot.status = 'uploaded'; await savePoolState(this.poolState) }
    console.log('[GDRIVE] Uploaded real image:', fileId)
  }

  /** Release slot back to available (replace with placeholder) */
  async releaseSlot(fileId: string): Promise<void> {
    const drive = this.ensureDriveClient()
    const placeholder = await createPlaceholderBuffer()
    await drive.files.update({
      fileId,
      media: { mimeType: 'image/jpeg', body: bufferToStream(placeholder) },
    })
    const slot = this.poolState.slots.find(s => s.fileId === fileId)
    if (slot) {
      slot.status = 'available'
      slot.sessionId = undefined
      slot.claimedAt = undefined
      await savePoolState(this.poolState)
    }
    console.log('[GDRIVE] Released slot:', fileId)
  }

  /** Get current pool statistics */
  getPoolStatus() {
    const slots = this.poolState.slots
    return {
      total: slots.length,
      available: slots.filter(s => s.status === 'available').length,
      claimed: slots.filter(s => s.status === 'claimed').length,
      uploaded: slots.filter(s => s.status === 'uploaded').length,
    }
  }

  /** Refill pool if available slots drop below threshold */
  async refillPool(): Promise<void> {
    const { available } = this.getPoolStatus()
    if (available >= REFILL_THRESHOLD) return
    console.log('[GDRIVE] Refilling pool, available:', available)
    const folderId = await this.ensureFolder()
    await this.createSlotBatches(folderId, this.poolState.slots.length, REFILL_COUNT)
    console.log('[GDRIVE] Refill complete')
  }
}

let instance: GoogleDriveSlotService | null = null

export function getGoogleDriveSlotService(): GoogleDriveSlotService {
  if (!instance) instance = new GoogleDriveSlotService()
  return instance
}
