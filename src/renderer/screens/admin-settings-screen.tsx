/**
 * Admin Settings Screen - Gen-Z Style
 * Hub for admin features: Frame Templates, Camera Test, Google Drive
 * Camera mode selector: DCC / Webcam / Mock
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CameraMode } from '../../shared/types/camera-types'
import { AdminCloudinaryPoolSection } from '../components/admin-cloudinary-pool-section'

interface SettingCard {
  title: string
  description: string
  icon: JSX.Element
  path: string
  gradient: string
  shadowColor: string
}

const modeOptions: { mode: CameraMode; label: string; desc: string; icon: string }[] = [
  { mode: 'dcc', label: 'DCC Camera', desc: 'DSLR via digiCamControl (Windows)', icon: '📷' },
  { mode: 'webcam', label: 'Webcam', desc: 'Built-in or USB webcam', icon: '🎥' },
  { mode: 'mock', label: 'Mock', desc: 'UI testing without hardware', icon: '🎭' }
]

export function AdminSettingsScreen(): JSX.Element {
  const navigate = useNavigate()
  const [cameraMode, setCameraMode] = useState<CameraMode>('dcc')
  const [extraPhotos, setExtraPhotos] = useState(3)
  const [loading, setLoading] = useState(true)
  // Cloudinary config state
  const [cloudName, setCloudName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [cloudSaving, setCloudSaving] = useState(false)
  const [cloudSaved, setCloudSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const mode = await window.electronAPI.camera.getMode()
      setCameraMode(mode)
      try {
        const extra = await window.electronAPI.settings.getExtraPhotos()
        setExtraPhotos(extra)
      } catch {
        console.warn('Settings API not available, using default extraPhotos=3')
      }
      // Load Cloudinary config
      try {
        const config = await window.electronAPI.settings.getCloudinaryConfig()
        setCloudName(config.cloudName)
        setApiKey(config.apiKey)
        setApiSecret(config.apiSecret)
      } catch {
        console.warn('Cloudinary config not available')
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCloudinary = async () => {
    setCloudSaving(true)
    try {
      await window.electronAPI.settings.setCloudinaryConfig({ cloudName, apiKey, apiSecret })
      setCloudSaved(true)
      setTimeout(() => setCloudSaved(false), 2000)
    } catch (e) {
      console.error('Failed to save Cloudinary config:', e)
    } finally {
      setCloudSaving(false)
    }
  }

  const handleSetMode = async (mode: CameraMode) => {
    try {
      const result = await window.electronAPI.camera.setMode(mode)
      if (result.success) {
        setCameraMode(mode)
      }
    } catch (e) {
      console.error('Failed to set camera mode:', e)
    }
  }

  const handleSetExtraPhotos = async (count: number) => {
    try {
      const result = await window.electronAPI.settings.setExtraPhotos(count)
      if (result.success) {
        setExtraPhotos(count)
      }
    } catch (e) {
      console.error('Failed to set extra photos:', e)
    }
  }

  const settingCards: SettingCard[] = [
    {
      title: 'Frame Templates',
      description: 'Create and manage photobooth frame designs',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/admin/frames',
      gradient: 'from-pink-500 to-rose-500',
      shadowColor: 'shadow-pink-500/25'
    },
    {
      title: 'Camera Test',
      description: 'Test camera connection and live view',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/admin/camera-test',
      gradient: 'from-purple-500 to-indigo-500',
      shadowColor: 'shadow-purple-500/25'
    },
    {
      title: 'Google Drive',
      description: 'Configure cloud upload settings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      path: '/admin/drive',
      gradient: 'from-cyan-500 to-blue-500',
      shadowColor: 'shadow-cyan-500/25'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl"
          style={{ animation: 'pulse 5s ease-in-out infinite', animationDelay: '1s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/')}
            className="group p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 transition-all duration-300 cursor-pointer"
          >
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-white transform group-hover:-translate-x-1 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-500 mt-1">Configure your photobooth</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingCards.map((card, index) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="group relative text-left cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient border on hover */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-300`} />

              {/* Card content */}
              <div className={`relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 group-hover:border-transparent transition-all duration-300 h-full group-hover:shadow-xl ${card.shadowColor}`}>
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg ${card.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>

                {/* Text */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 group-hover:bg-clip-text transition-all">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {card.description}
                </p>

                {/* Arrow indicator */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Camera Mode Selector */}
        <div className="mt-8 p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-1">Camera Mode</h3>
          <p className="text-slate-400 text-sm mb-4">
            Select camera input source for the photobooth
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {modeOptions.map((opt) => {
              const isActive = cameraMode === opt.mode
              return (
                <button
                  key={opt.mode}
                  onClick={() => handleSetMode(opt.mode)}
                  disabled={loading}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-slate-800/50 hover:border-white/30'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="font-bold text-white text-sm">{opt.label}</div>
                  <div className="text-slate-400 text-xs mt-1">{opt.desc}</div>
                  {isActive && (
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Extra Photos Setting */}
        <div className="mt-6 p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-1">Extra Photos</h3>
          <p className="text-slate-400 text-sm mb-4">
            Extra photos per session for user to choose from
          </p>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const isActive = extraPhotos === n
              return (
                <button
                  key={n}
                  onClick={() => handleSetExtraPhotos(n)}
                  disabled={loading}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-purple-500/20 border-2 border-purple-500 text-white'
                      : 'bg-slate-800/50 border-2 border-white/10 text-slate-400 hover:border-white/30'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cloudinary API Config */}
        <div className="mt-6 p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-1">Cloudinary API</h3>
          <p className="text-slate-400 text-sm mb-4">
            Enter Cloudinary credentials for image hosting
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Cloud Name</label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g. dqkwjkcnq"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API Key"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API Secret"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveCloudinary}
              disabled={cloudSaving || (!apiKey && !apiSecret)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer ${
                cloudSaved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
              } ${cloudSaving || (!apiKey && !apiSecret) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cloudSaved ? 'Saved!' : cloudSaving ? 'Saving...' : 'Save Cloudinary Config'}
            </button>
          </div>
        </div>

        {/* Cloudinary Pool Management */}
        <AdminCloudinaryPoolSection />

        {/* Version info */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 text-sm">
            Photobooth v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
