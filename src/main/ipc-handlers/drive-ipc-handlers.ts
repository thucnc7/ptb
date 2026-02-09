import { ipcMain } from 'electron'
import { getGoogleDriveSlotService } from '../services/google-drive-slot-service'

/**
 * Register all IPC handlers for Google Drive slot management
 */
export function registerDriveIpcHandlers(): void {
  /**
   * Initialize the slot pool with 150 pre-allocated placeholders
   * Called from admin settings
   */
  ipcMain.handle('drive:init-pool', async () => {
    try {
      const service = getGoogleDriveSlotService()
      await service.initializePool()
      return service.getPoolStatus()
    } catch (error) {
      console.error('[GDRIVE IPC] Failed to initialize pool:', error)
      throw error
    }
  })

  /**
   * Get current pool status (total, available, claimed, uploaded counts)
   */
  ipcMain.handle('drive:get-pool-status', async () => {
    try {
      return getGoogleDriveSlotService().getPoolStatus()
    } catch (error) {
      console.error('[GDRIVE IPC] Failed to get pool status:', error)
      throw error
    }
  })

  /**
   * Claim an available slot for a photo session
   * Returns { fileId, downloadLink } for immediate QR code generation
   */
  ipcMain.handle('drive:claim-slot', async (_event, sessionId: string) => {
    try {
      return await getGoogleDriveSlotService().claimSlot(sessionId)
    } catch (error) {
      console.error('[GDRIVE IPC] Failed to claim slot:', error)
      throw error
    }
  })

  /**
   * Upload actual composite image to replace placeholder
   * Called after image processing is complete
   */
  ipcMain.handle('drive:upload-real-image', async (_event, fileId: string, imagePath: string) => {
    try {
      await getGoogleDriveSlotService().uploadRealImage(fileId, imagePath)
      return { success: true }
    } catch (error) {
      console.error('[GDRIVE IPC] Failed to upload real image:', error)
      throw error
    }
  })

  /**
   * Release a claimed slot back to available pool
   * Called when a session is cancelled or expires
   */
  ipcMain.handle('drive:release-slot', async (_event, fileId: string) => {
    try {
      await getGoogleDriveSlotService().releaseSlot(fileId)
      return { success: true }
    } catch (error) {
      console.error('[GDRIVE IPC] Failed to release slot:', error)
      throw error
    }
  })

  /**
   * Refill pool if available slots drop below 20
   * Can be called manually or automatically
   */
  ipcMain.handle('drive:refill-pool', async () => {
    try {
      await getGoogleDriveSlotService().refillPool()
      return getGoogleDriveSlotService().getPoolStatus()
    } catch (error) {
      console.error('[GDRIVE IPC] Failed to refill pool:', error)
      throw error
    }
  })

  console.log('[GDRIVE IPC] Handlers registered')
}
