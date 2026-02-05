import { app, shell } from 'electron'
import path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'
import type { BrowserWindow } from 'electron'

// Lazy load http/https to avoid module resolution issues during startup
const getHttp = () => require('http')
const getHttps = () => require('https')

export class DccInstallerService {
    // Use SourceForge URL which is the official download host
    private static readonly DCC_DOWNLOAD_URL = 'https://sourceforge.net/projects/digicamcontrol/files/digiCamControlsetup_2.1.7.0.exe/download'
    private static readonly DCC_INSTALL_DIR = 'C:\\Program Files (x86)\\digiCamControl'
    private static readonly DCC_EXECUTABLE = 'CameraControl.exe'

    private _installerPath: string | null = null
    private mainWindow: BrowserWindow | null = null

    constructor() { }

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window
    }

    private get installerPath(): string {
        if (!this._installerPath) {
            // Use userData which is guaranteed to be writable and persistent enough
            this._installerPath = path.join(app.getPath('userData'), 'digicamcontrol-install.exe')
        }
        return this._installerPath
    }

    async isDccInstalled(): Promise<boolean> {
        const defaultPath = path.join(DccInstallerService.DCC_INSTALL_DIR, DccInstallerService.DCC_EXECUTABLE)
        return fs.existsSync(defaultPath)
    }

    async downloadAndInstall(): Promise<void> {
        try {
            if (await this.isDccInstalled()) {
                console.log('digiCamControl is already installed')
                return
            }

            console.log('Starting auto-setup...')
            console.log('Target path:', this.installerPath)

            // Delete existing installer if any
            if (fs.existsSync(this.installerPath)) {
                try {
                    fs.unlinkSync(this.installerPath)
                } catch (e) {
                    console.warn('Could not delete existing installer', e)
                }
            }

            console.log('Downloading digiCamControl...')
            await this.downloadInstaller()

            console.log('Installing digiCamControl...')
            await this.runInstaller()

            console.log('Installation complete.')
        } catch (error) {
            console.error('Auto-setup failed:', error)
            throw error
        }
    }

    private async downloadInstaller(): Promise<void> {
        return new Promise((resolve, reject) => {
            const https = getHttps()
            // Ensure directory exists
            const dir = path.dirname(this.installerPath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }

            const file = fs.createWriteStream(this.installerPath)

            this.sendProgress(0, 'Starting download...')

            const request = https.get(DccInstallerService.DCC_DOWNLOAD_URL, (response: any) => {
                // Handle redirect
                if (response.statusCode === 302 || response.statusCode === 301) {
                    const redirectUrl = response.headers.location
                    console.log('Redirecting to:', redirectUrl)
                    this.downloadFromUrl(redirectUrl, file).then(resolve).catch(reject)
                    return
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed with status code: ${response.statusCode}`))
                    return
                }

                this.handleDownloadResponse(response, file).then(resolve).catch(reject)
            })

            request.on('error', (err: any) => {
                if (fs.existsSync(this.installerPath)) {
                    try { fs.unlinkSync(this.installerPath) } catch { }
                }
                reject(err)
            })
        })
    }

    private async downloadFromUrl(url: string, file: fs.WriteStream): Promise<void> {
        return new Promise((resolve, reject) => {
            const https = getHttps()
            https.get(url, (response: any) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    const redirectUrl = response.headers.location
                    this.downloadFromUrl(redirectUrl, file).then(resolve).catch(reject)
                    return
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed with status code: ${response.statusCode}`))
                    return
                }

                this.handleDownloadResponse(response, file).then(resolve).catch(reject)
            }).on('error', (err: any) => {
                if (fs.existsSync(this.installerPath)) {
                    try { fs.unlinkSync(this.installerPath) } catch { }
                }
                reject(err)
            })
        })
    }

    private async handleDownloadResponse(response: any, file: fs.WriteStream): Promise<void> {
        return new Promise((resolve, reject) => {
            const len = parseInt(response.headers['content-length'] || '0', 10)
            let downloaded = 0

            response.pipe(file)

            response.on('data', (chunk: any) => {
                downloaded += chunk.length
                if (len > 0) {
                    const percent = Math.round((downloaded / len) * 100)
                    this.sendProgress(percent, `Downloading... ${(downloaded / 1024 / 1024).toFixed(1)}MB`)
                }
            })

            file.on('finish', () => {
                file.close()
                console.log('Download completed. File size:', downloaded)
                resolve()
            })

            file.on('error', (err: any) => {
                if (fs.existsSync(this.installerPath)) {
                    try { fs.unlinkSync(this.installerPath) } catch { }
                }
                reject(err)
            })
        })
    }

    private async runInstaller(): Promise<void> {
        if (!fs.existsSync(this.installerPath)) {
            throw new Error(`Installer file not found at: ${this.installerPath}`)
        }

        const stats = fs.statSync(this.installerPath)
        if (stats.size < 100000) {
            throw new Error(`Installer file is too small (${stats.size} bytes). Download may have failed.`)
        }

        this.sendProgress(100, 'Opening installer...')

        // shell.openPath is the most robust way to launch a file on Windows
        // It behaves like double-clicking the file in Explorer
        console.log('Opening installer with shell.openPath:', this.installerPath)

        const errorMessage = await shell.openPath(this.installerPath)

        if (errorMessage) {
            throw new Error(`Failed to open installer: ${errorMessage}`)
        }

        // Since openPath is fire-and-forget, we just resolve.
        // The user will have to complete the installation.
        console.log('Installer opened successfully')
    }

    async launchDcc(): Promise<void> {
        const dccPath = path.join(DccInstallerService.DCC_INSTALL_DIR, DccInstallerService.DCC_EXECUTABLE)

        if (!fs.existsSync(dccPath)) {
            // Try to find it in common locations if standard path fails
            const userPath = path.join(app.getPath('home'), 'AppData', 'Local', 'Programs', 'digiCamControl', 'CameraControl.exe')
            if (fs.existsSync(userPath)) {
                await this.launchPath(userPath)
                return
            }
            throw new Error(`digiCamControl executable not found at ${dccPath}. Please install it manually if auto-install failed.`)
        }

        await this.launchPath(dccPath)
    }

    private async launchPath(targetPath: string): Promise<void> {
        this.sendProgress(100, 'Launching digiCamControl...')
        console.log('Launching DCC from:', targetPath)

        const error = await shell.openPath(targetPath)
        if (error) {
            throw new Error(`Failed to launch digiCamControl: ${error}`)
        }
    }

    private sendProgress(percent: number, message: string) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            try {
                this.mainWindow.webContents.send('camera:setup-progress', { percent, message })
            } catch (e) {
                console.warn('Failed to send progress', e)
            }
        }
    }
}
