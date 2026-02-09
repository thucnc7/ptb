/**
 * Settings IPC Handlers
 * Manages global app settings via electron-store
 */

import { ipcMain } from 'electron'
import Store from 'electron-store'

const store = new Store({
  defaults: {
    extraPhotos: 3,
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: ''
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

  // Get Cloudinary config
  ipcMain.handle('settings:get-cloudinary-config', () => {
    return {
      cloudName: store.get('cloudinaryCloudName', '') as string,
      apiKey: store.get('cloudinaryApiKey', '') as string,
      apiSecret: store.get('cloudinaryApiSecret', '') as string
    }
  })

  // Set Cloudinary config
  ipcMain.handle('settings:set-cloudinary-config', (_event, config: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }) => {
    store.set('cloudinaryCloudName', config.cloudName.trim())
    store.set('cloudinaryApiKey', config.apiKey.trim())
    store.set('cloudinaryApiSecret', config.apiSecret.trim())
    return { success: true }
  })
}

/** Get Cloudinary config from store (used by main process services) */
export function getCloudinaryConfigFromStore() {
  return {
    cloudName: store.get('cloudinaryCloudName', '') as string,
    apiKey: store.get('cloudinaryApiKey', '') as string,
    apiSecret: store.get('cloudinaryApiSecret', '') as string
  }
}
