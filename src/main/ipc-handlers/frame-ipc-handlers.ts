/**
 * IPC handlers for frame management operations
 * Handles file I/O for frames configuration and background images
 */

import { ipcMain, app, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir, copyFile, unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import type { Frame, FrameConfig } from '../../shared/types/frame-types'

// Storage paths
const getAppDataPath = () => join(app.getPath('userData'), 'photobooth')
const getFramesConfigPath = () => join(getAppDataPath(), 'frames.json')
const getFrameAssetsPath = () => join(getAppDataPath(), 'frame-assets')

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  const appDataPath = getAppDataPath()
  const assetsPath = getFrameAssetsPath()

  if (!existsSync(appDataPath)) {
    await mkdir(appDataPath, { recursive: true })
  }
  if (!existsSync(assetsPath)) {
    await mkdir(assetsPath, { recursive: true })
  }
}

// Load frames from JSON file
async function loadFrames(): Promise<FrameConfig> {
  await ensureDirectories()
  const configPath = getFramesConfigPath()

  if (!existsSync(configPath)) {
    return { frames: [], selectedFrameId: null }
  }

  const data = await readFile(configPath, 'utf-8')
  const config = JSON.parse(data) as FrameConfig

  // Convert date strings back to Date objects
  config.frames = config.frames.map(frame => ({
    ...frame,
    createdAt: new Date(frame.createdAt),
    updatedAt: new Date(frame.updatedAt)
  }))

  return config
}

// Save frames to JSON file
async function saveFrames(config: FrameConfig): Promise<void> {
  await ensureDirectories()
  const configPath = getFramesConfigPath()
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

// Generate unique ID
function generateId(): string {
  return `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Register all IPC handlers
export function registerFrameIpcHandlers(): void {
  // Get all frames
  ipcMain.handle('frames:get-all', async () => {
    const config = await loadFrames()
    return config.frames
  })

  // Get single frame by ID
  ipcMain.handle('frames:get-by-id', async (_, id: string) => {
    const config = await loadFrames()
    return config.frames.find(f => f.id === id) || null
  })

  // Create new frame
  ipcMain.handle('frames:create', async (_, frameData: Omit<Frame, 'id' | 'createdAt' | 'updatedAt'>) => {
    const config = await loadFrames()
    const now = new Date()

    const newFrame: Frame = {
      ...frameData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    }

    config.frames.push(newFrame)
    await saveFrames(config)
    return newFrame
  })

  // Update existing frame
  ipcMain.handle('frames:update', async (_, id: string, updates: Partial<Frame>) => {
    const config = await loadFrames()
    const index = config.frames.findIndex(f => f.id === id)

    if (index === -1) {
      throw new Error(`Frame not found: ${id}`)
    }

    config.frames[index] = {
      ...config.frames[index],
      ...updates,
      id, // Prevent ID override
      updatedAt: new Date()
    }

    await saveFrames(config)
    return config.frames[index]
  })

  // Delete frame
  ipcMain.handle('frames:delete', async (_, id: string) => {
    const config = await loadFrames()
    const frame = config.frames.find(f => f.id === id)

    if (!frame) {
      throw new Error(`Frame not found: ${id}`)
    }

    // Delete background image if it's in our assets folder
    if (frame.backgroundPath.startsWith(getFrameAssetsPath())) {
      try {
        await unlink(frame.backgroundPath)
      } catch {
        // Ignore if file doesn't exist
      }
    }

    config.frames = config.frames.filter(f => f.id !== id)
    await saveFrames(config)
    return true
  })

  // Select background image (opens file dialog)
  ipcMain.handle('frames:select-background-image', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Frame Background Image',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  // Copy image to app data folder and return new path
  ipcMain.handle('frames:import-background-image', async (_, sourcePath: string) => {
    await ensureDirectories()
    const assetsPath = getFrameAssetsPath()
    const fileName = `bg-${Date.now()}-${sourcePath.split(/[\\/]/).pop()}`
    const destPath = join(assetsPath, fileName)

    await copyFile(sourcePath, destPath)
    return destPath
  })

  // Get app data path (for debugging)
  ipcMain.handle('frames:get-storage-path', async () => {
    return getAppDataPath()
  })

  // List all background images in assets folder
  ipcMain.handle('frames:list-assets', async () => {
    await ensureDirectories()
    const assetsPath = getFrameAssetsPath()
    const files = await readdir(assetsPath)
    return files.map(f => join(assetsPath, f))
  })
}
