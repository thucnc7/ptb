#!/usr/bin/env node
/**
 * Wrapper script to run electron-vite with ELECTRON_RUN_AS_NODE cleared.
 * This is needed because Claude Code (which is itself an Electron app) sets this variable,
 * causing Electron to run as Node.js instead of proper Electron runtime.
 */
const { spawn } = require('child_process')
const path = require('path')

// Delete ELECTRON_RUN_AS_NODE from environment
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

// Get the command to run (passed as arguments)
const args = process.argv.slice(2)
const cmd = args[0] || 'dev'

console.log(`[electron-vite-wrapper] Starting electron-vite ${cmd} with ELECTRON_RUN_AS_NODE cleared...`)

// Use electron-vite directly from node_modules/.bin
// On Windows, .bin files are .cmd scripts
const isWindows = process.platform === 'win32'
const binExt = isWindows ? '.cmd' : ''
const electronVitePath = path.resolve(__dirname, '..', 'node_modules', '.bin', `electron-vite${binExt}`)

const child = spawn(electronVitePath, [cmd], {
  env,
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  shell: isWindows // Required for .cmd files on Windows
})

child.on('close', (code) => {
  process.exit(code || 0)
})
