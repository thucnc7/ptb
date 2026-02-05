/**
 * Session IPC Handlers
 * Exposes session storage and image compositing services to renderer process
 */

import { ipcMain } from 'electron'
import * as fs from 'fs/promises'
import { getSessionStorageService } from '../services/session-storage-service'
import { getImageCompositingService } from '../services/image-compositing-service'
import type { SavePhotoResult, CompositeResult } from '../../shared/types/session-types'
import type { Frame } from '../../shared/types/frame-types'

export function registerSessionIpcHandlers(): void {
  // Create new session
  ipcMain.handle('session:create', async () => {
    try {
      const service = getSessionStorageService()
      return await service.createSession()
    } catch (error) {
      console.error('IPC session:create error:', error)
      throw new Error(`Failed to create session: ${error}`)
    }
  })

  // Save photo to session
  ipcMain.handle('session:save-photo', async (_event, sessionId: string, photoIndex: number, imageData: string) => {
    try {
      const service = getSessionStorageService()

      let buffer: Buffer

      // Parse image data (base64 or file path)
      if (imageData.startsWith('data:')) {
        // Data URL format
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
        buffer = Buffer.from(base64Data, 'base64')
      } else if (imageData.startsWith('/') || imageData.includes(':\\')) {
        // File path - read file
        buffer = await fs.readFile(imageData)
      } else {
        // Assume raw base64
        buffer = Buffer.from(imageData, 'base64')
      }

      const savedPath = await service.savePhoto(sessionId, photoIndex, buffer)

      const result: SavePhotoResult = {
        success: true,
        path: savedPath,
        index: photoIndex
      }

      return result
    } catch (error) {
      console.error('IPC session:save-photo error:', error)
      throw new Error(`Failed to save photo: ${error}`)
    }
  })

  // Composite photos into frame
  ipcMain.handle('session:composite', async (_event, sessionId: string, frame: Frame) => {
    try {
      const storageService = getSessionStorageService()
      const compositeService = getImageCompositingService()

      // Get session info
      const session = storageService.getSession(sessionId)
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      // Get photo paths from session
      const photoPaths = await storageService.listPhotos(sessionId)

      if (photoPaths.length === 0) {
        throw new Error('No photos found in session')
      }

      // Build photo inputs
      const photos = photoPaths.map((imagePath, idx) => ({
        index: idx + 1,
        imagePath
      }))

      // Run compositing
      const compositeResult = await compositeService.composite({
        frame,
        photos
      })

      // Save composite to session
      const compositePath = await storageService.saveComposite(sessionId, compositeResult.buffer)

      const result: CompositeResult = {
        success: true,
        path: compositePath
      }

      return result
    } catch (error) {
      console.error('IPC session:composite error:', error)
      throw new Error(`Failed to composite photos: ${error}`)
    }
  })

  // Get composite as data URL (for display)
  ipcMain.handle('session:get-composite', async (_event, sessionId: string) => {
    try {
      const service = getSessionStorageService()
      const compositePath = service.getCompositePath(sessionId)

      const buffer = await fs.readFile(compositePath)
      const base64 = buffer.toString('base64')
      return `data:image/jpeg;base64,${base64}`
    } catch (error) {
      console.error('IPC session:get-composite error:', error)
      throw new Error(`Failed to get composite: ${error}`)
    }
  })

  // Get session info
  ipcMain.handle('session:get-info', async (_event, sessionId: string) => {
    try {
      const service = getSessionStorageService()
      return service.getSession(sessionId)
    } catch (error) {
      console.error('IPC session:get-info error:', error)
      throw new Error(`Failed to get session info: ${error}`)
    }
  })

  // Delete session
  ipcMain.handle('session:delete', async (_event, sessionId: string) => {
    try {
      const service = getSessionStorageService()
      await service.deleteSession(sessionId)
    } catch (error) {
      console.error('IPC session:delete error:', error)
      throw new Error(`Failed to delete session: ${error}`)
    }
  })

  // Get session folder path
  ipcMain.handle('session:get-folder-path', async (_event, sessionId: string) => {
    try {
      const service = getSessionStorageService()
      const session = service.getSession(sessionId)
      return session?.folderPath || null
    } catch (error) {
      console.error('IPC session:get-folder-path error:', error)
      throw new Error(`Failed to get folder path: ${error}`)
    }
  })
}
