/**
 * Video IPC Handlers
 * Handles saving recorded video blobs to session folders
 */

import { ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getSessionStorageService } from '../services/session-storage-service'

export function registerVideoIpcHandlers(): void {
  /**
   * Save recorded video data to session folder
   * Receives video as number[] (Uint8Array serialized for IPC)
   */
  ipcMain.handle('video:save', async (_event, sessionId: string, data: number[]) => {
    try {
      const service = getSessionStorageService()
      const session = service.getSession(sessionId)
      if (!session) throw new Error(`Session not found: ${sessionId}`)

      const videoPath = path.join(session.folderPath, 'recording.webm')
      const buffer = Buffer.from(data)

      console.log('[VIDEO IPC] Saving video:', videoPath, 'size:', buffer.length)
      await fs.writeFile(videoPath, buffer)
      console.log('[VIDEO IPC] Video saved successfully')

      return { success: true, path: videoPath }
    } catch (error) {
      console.error('[VIDEO IPC] Failed to save video:', error)
      throw error
    }
  })

  /**
   * Get video path for a session (if recording exists)
   */
  ipcMain.handle('video:get-path', async (_event, sessionId: string) => {
    try {
      const service = getSessionStorageService()
      const session = service.getSession(sessionId)
      if (!session) return null

      const videoPath = path.join(session.folderPath, 'recording.webm')
      try {
        await fs.access(videoPath)
        return videoPath
      } catch {
        return null
      }
    } catch (error) {
      console.error('[VIDEO IPC] Failed to get video path:', error)
      return null
    }
  })

  console.log('[VIDEO IPC] Handlers registered')
}
