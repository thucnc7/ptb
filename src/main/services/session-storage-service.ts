/**
 * Session Storage Service
 * Manages session folders and photo file storage
 */

import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import { SessionInfo } from '../../shared/types/session-types'

export class SessionStorageService {
  private sessionsDir: string
  private sessions: Map<string, SessionInfo> = new Map()

  constructor() {
    this.sessionsDir = path.join(app.getPath('userData'), 'sessions')
    this.ensureSessionsDir()
  }

  private async ensureSessionsDir(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create sessions directory:', error)
      throw error
    }
  }

  /**
   * Create a new session with unique ID and folder
   */
  async createSession(): Promise<SessionInfo> {
    const id = `session-${Date.now()}`
    const folderPath = path.join(this.sessionsDir, id)

    try {
      await fs.mkdir(folderPath, { recursive: true })

      const session: SessionInfo = {
        id,
        folderPath,
        createdAt: new Date(),
        photoCount: 0
      }

      this.sessions.set(id, session)
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw new Error(`Failed to create session: ${error}`)
    }
  }

  /**
   * Save a photo to the session folder with sequential numbering
   */
  async savePhoto(sessionId: string, photoIndex: number, imageData: Buffer): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const filename = `photo-${String(photoIndex).padStart(2, '0')}.jpg`
    const filePath = path.join(session.folderPath, filename)

    try {
      await fs.writeFile(filePath, imageData)

      // Update photo count (max of existing count and current index)
      session.photoCount = Math.max(session.photoCount, photoIndex)

      return filePath
    } catch (error) {
      console.error('Failed to save photo:', error)
      throw new Error(`Failed to save photo: ${error}`)
    }
  }

  /**
   * Get the file path for a specific photo
   */
  getPhotoPath(sessionId: string, photoIndex: number): string {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const filename = `photo-${String(photoIndex).padStart(2, '0')}.jpg`
    return path.join(session.folderPath, filename)
  }

  /**
   * List all photo paths in a session
   */
  async listPhotos(sessionId: string): Promise<string[]> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    try {
      const files = await fs.readdir(session.folderPath)
      return files
        .filter(f => f.startsWith('photo-') && f.endsWith('.jpg'))
        .sort()
        .map(f => path.join(session.folderPath, f))
    } catch (error) {
      console.error('Failed to list photos:', error)
      return []
    }
  }

  /**
   * Save the final composite image to the session folder
   */
  async saveComposite(sessionId: string, imageData: Buffer): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const filePath = path.join(session.folderPath, 'composite.jpg')

    try {
      await fs.writeFile(filePath, imageData)
      return filePath
    } catch (error) {
      console.error('Failed to save composite:', error)
      throw new Error(`Failed to save composite: ${error}`)
    }
  }

  /**
   * Get the composite image path for a session
   */
  getCompositePath(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    return path.join(session.folderPath, 'composite.jpg')
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Delete a session and all its files
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    try {
      await fs.rm(session.folderPath, { recursive: true, force: true })
      this.sessions.delete(sessionId)
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw new Error(`Failed to delete session: ${error}`)
    }
  }

  /**
   * Get the sessions directory path
   */
  getSessionsDirectory(): string {
    return this.sessionsDir
  }
}

// Singleton instance
let instance: SessionStorageService | null = null

export function getSessionStorageService(): SessionStorageService {
  if (!instance) {
    instance = new SessionStorageService()
  }
  return instance
}
