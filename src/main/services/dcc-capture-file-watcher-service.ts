/**
 * DCC Capture File Watcher Service
 * Watches digiCamControl capture folders for instant image detection using chokidar
 */

import { EventEmitter } from 'events'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'

// Dynamic import for ESM-only chokidar
type ChokidarModule = typeof import('chokidar')
type FSWatcher = import('chokidar').FSWatcher

// Image file extensions DCC produces
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|cr2|nef|arw)$/i

export interface CaptureFileEvent {
  filePath: string
  timestamp: number
  size: number
}

export class DccCaptureFileWatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null
  private watchPath: string | null = null
  private pendingCaptureResolvers: Array<{
    resolve: (filePath: string) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }> = []

  constructor() {
    super()
    // watchPath initialized in start() after app is ready
  }

  private getWatchPath(): string {
    if (!this.watchPath) {
      // DCC default capture folder - only call after app is ready
      this.watchPath = path.join(app.getPath('pictures'), 'digiCamControl')
    }
    return this.watchPath
  }

  /**
   * Start watching for captured files
   */
  async start(): Promise<void> {
    if (this.watcher) {
      console.log('File watcher already running')
      return
    }

    const watchPath = this.getWatchPath()

    // Ensure base directory exists
    if (!fs.existsSync(watchPath)) {
      console.log('Creating DCC watch directory:', watchPath)
      fs.mkdirSync(watchPath, { recursive: true })
    }

    console.log('Starting file watcher on:', watchPath)

    // Dynamic import for ESM-only chokidar
    const chokidar: ChokidarModule = await import('chokidar')

    this.watcher = chokidar.watch(watchPath, {
      persistent: true,
      depth: 3,  // Pictures/dCC/SessionN/images
      ignored: [/\.(tmp|lock)$/, /node_modules/, /\.git/],
      ignoreInitial: true,  // Don't emit for existing files
      awaitWriteFinish: {
        stabilityThreshold: 500,  // Wait 500ms for file to stabilize
        pollInterval: 100
      }
    })

    this.watcher.on('add', (filePath, stats) => {
      this.handleFileAdded(filePath, stats)
    })

    this.watcher.on('addDir', (dirPath) => {
      console.log('New session folder detected:', dirPath)
      this.emit('session-created', dirPath)
    })

    this.watcher.on('error', (error) => {
      console.error('File watcher error:', error)
      this.emit('error', error)
    })

    // Wait for watcher to be ready
    return new Promise((resolve) => {
      this.watcher!.on('ready', () => {
        console.log('File watcher ready')
        resolve()
      })
    })
  }

  private handleFileAdded(filePath: string, stats?: fs.Stats): void {
    // Only process image files
    if (!IMAGE_EXTENSIONS.test(filePath)) {
      return
    }

    console.log('Image captured:', filePath)

    const event: CaptureFileEvent = {
      filePath,
      timestamp: stats?.mtime?.getTime() || Date.now(),
      size: stats?.size || 0
    }

    // Emit event for any listeners
    this.emit('image-captured', event)

    // Resolve pending capture promises (FIFO order)
    if (this.pendingCaptureResolvers.length > 0) {
      const resolver = this.pendingCaptureResolvers.shift()
      if (resolver) {
        clearTimeout(resolver.timeout)
        resolver.resolve(filePath)
      }
    }
  }

  /**
   * Returns a promise that resolves with the next captured file path.
   * Use this in capture() to wait for the file instead of polling.
   *
   * @param timeoutMs Maximum time to wait (default: 20000ms)
   */
  waitForNextCapture(timeoutMs: number = 20000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove resolver from pending list
        const idx = this.pendingCaptureResolvers.findIndex(r => r.resolve === resolve)
        if (idx >= 0) {
          this.pendingCaptureResolvers.splice(idx, 1)
        }
        reject(new Error('Capture timeout: no file detected within ' + timeoutMs + 'ms'))
      }, timeoutMs)

      this.pendingCaptureResolvers.push({ resolve, reject, timeout })
    })
  }

  /**
   * Stop watching and cleanup
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
      console.log('File watcher stopped')
    }

    // Reject any pending capture promises
    for (const resolver of this.pendingCaptureResolvers) {
      clearTimeout(resolver.timeout)
      resolver.reject(new Error('File watcher stopped'))
    }
    this.pendingCaptureResolvers = []
  }

  /**
   * Get list of watched paths (for debugging)
   */
  getWatchedPaths(): string[] {
    if (!this.watcher) return []
    const watched = this.watcher.getWatched()
    return Object.keys(watched)
  }

  /**
   * Check if watcher is running
   */
  isRunning(): boolean {
    return this.watcher !== null
  }
}

// Singleton instance
// Lazy singleton instance
let instance: DccCaptureFileWatcherService | null = null;

export const getDccFileWatcher = (): DccCaptureFileWatcherService => {
  if (!instance) {
    instance = new DccCaptureFileWatcherService();
  }
  return instance;
};
