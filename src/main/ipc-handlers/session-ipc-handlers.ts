/**
 * Session IPC Handlers
 * Exposes session storage and image compositing services to renderer process
 */

import { ipcMain, shell } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
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
      console.log(`[DEBUG-SESSION] save-photo called: sessionId=${sessionId}, photoIndex=${photoIndex}`)
      console.log(`[DEBUG-SESSION] imageData type: ${imageData.startsWith('data:') ? 'data-url' : imageData.includes(':\\') ? 'file-path' : 'base64'}`)
      console.log(`[DEBUG-SESSION] imageData preview: ${imageData.substring(0, 100)}...`)

      const service = getSessionStorageService()

      let buffer: Buffer

      // Parse image data (base64 or file path)
      if (imageData.startsWith('data:')) {
        // Data URL format
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
        buffer = Buffer.from(base64Data, 'base64')
        console.log(`[DEBUG-SESSION] Decoded data URL, buffer size: ${buffer.length}`)
      } else if (imageData.startsWith('/') || imageData.includes(':\\')) {
        // File path - read file
        console.log(`[DEBUG-SESSION] Reading file from path: ${imageData}`)
        buffer = await fs.readFile(imageData)
        console.log(`[DEBUG-SESSION] Read file, buffer size: ${buffer.length}`)
      } else {
        // Assume raw base64
        buffer = Buffer.from(imageData, 'base64')
        console.log(`[DEBUG-SESSION] Decoded raw base64, buffer size: ${buffer.length}`)
      }

      const savedPath = await service.savePhoto(sessionId, photoIndex, buffer)
      console.log(`[DEBUG-SESSION] Photo saved to: ${savedPath}`)

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
  ipcMain.handle('session:composite', async (_event, sessionId: string, frame: Frame, selectedPhotoIndices?: number[]) => {
    try {
      console.log(`[DEBUG-COMPOSITE] Starting composite for session: ${sessionId}`)
      console.log(`[DEBUG-COMPOSITE] Frame: ${frame.name}, ${frame.width}x${frame.height}`)
      console.log(`[DEBUG-COMPOSITE] Placeholders: ${frame.placeholders.length}`)
      console.log(`[DEBUG-COMPOSITE] Selected indices: ${selectedPhotoIndices || 'all'}`)

      const storageService = getSessionStorageService()
      const compositeService = getImageCompositingService()

      // Get session info
      const session = storageService.getSession(sessionId)
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }
      console.log(`[DEBUG-COMPOSITE] Session folder: ${session.folderPath}`)

      // Get all photo paths from session
      const allPhotoPaths = await storageService.listPhotos(sessionId)
      console.log(`[DEBUG-COMPOSITE] Found ${allPhotoPaths.length} total photos`)

      if (allPhotoPaths.length === 0) {
        throw new Error('No photos found in session')
      }

      // Filter by selectedPhotoIndices if provided
      let photosToUse: string[]
      if (selectedPhotoIndices && selectedPhotoIndices.length > 0) {
        // Validate indices are within range
        const maxIndex = allPhotoPaths.length - 1
        for (const idx of selectedPhotoIndices) {
          if (idx < 0 || idx > maxIndex) {
            throw new Error(`Invalid photo index: ${idx} (valid range: 0-${maxIndex})`)
          }
        }
        photosToUse = selectedPhotoIndices.map(idx => {
          const filename = `photo-${String(idx).padStart(2, '0')}.jpg`
          return path.join(session.folderPath, filename)
        })
        console.log(`[DEBUG-COMPOSITE] Using ${photosToUse.length} selected photos`)
      } else {
        photosToUse = allPhotoPaths
        console.log(`[DEBUG-COMPOSITE] Using all ${photosToUse.length} photos (no selection)`)
      }

      // Build photo inputs (index 1-based for compositing service)
      const photos = photosToUse.map((imagePath, idx) => ({
        index: idx + 1,
        imagePath
      }))

      // Run compositing
      console.log(`[DEBUG-COMPOSITE] Running compositing with ${photos.length} photos...`)
      const compositeResult = await compositeService.composite({
        frame,
        photos
      })
      console.log(`[DEBUG-COMPOSITE] Compositing complete, buffer size: ${compositeResult.buffer.length}`)

      // Save composite to session
      const compositePath = await storageService.saveComposite(sessionId, compositeResult.buffer)
      console.log(`[DEBUG-COMPOSITE] Saved composite to: ${compositePath}`)

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

  // Open folder containing the composite image
  ipcMain.handle('session:open-folder', async (_event, sessionId: string) => {
    try {
      const service = getSessionStorageService()
      const compositePath = service.getCompositePath(sessionId)
      
      // Check if file exists
      await fs.access(compositePath)
      
      // Open folder and select the file
      shell.showItemInFolder(compositePath)
      return true
    } catch (error) {
      console.error('IPC session:open-folder error:', error)
      throw new Error(`Failed to open folder: ${error}`)
    }
  })
}
