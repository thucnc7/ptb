/**
 * Settings IPC Handlers
 * Manages global app settings via electron-store
 */

import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store({
  defaults: {
    extraPhotos: 3
  }
})

export function registerSettingsIpcHandlers(): void {
  // Get extra photos count (1-5, default 3)
  ipcMain.handle('settings:get-extra-photos', () => {
    return store.get('extraPhotos', 3) as number
  })

  // Set extra photos count (validated 1-5)
  ipcMain.handle('settings:set-extra-photos', (_event, count: number) => {
    const validated = Math.min(5, Math.max(1, Math.round(count)))
    store.set('extraPhotos', validated)
    return { success: true }
  })
}
