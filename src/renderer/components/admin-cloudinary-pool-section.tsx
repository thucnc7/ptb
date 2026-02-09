/**
 * Cloudinary Pool Management Section
 * Shows pool status and provides controls to initialize and refill the upload pool
 */

import { useState, useEffect } from 'react'

interface PoolStatus {
  total: number
  available: number
  claimed: number
  uploaded: number
}

export function AdminCloudinaryPoolSection(): JSX.Element {
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null)
  const [poolLoading, setPoolLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [refillLoading, setRefillLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPoolStatus()
  }, [])

  const loadPoolStatus = async () => {
    try {
      setPoolLoading(true)
      const status = await window.electronAPI.drive.getPoolStatus()
      setPoolStatus(status)
    } catch (e) {
      console.error('Failed to load pool status:', e)
      setPoolStatus(null)
    } finally {
      setPoolLoading(false)
    }
  }

  const handleInitPool = async () => {
    try {
      setInitLoading(true)
      setMessage(null)
      const result = await window.electronAPI.drive.initPool()
      setPoolStatus(result)
      setMessage({ type: 'success', text: 'Pool initialized successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      console.error('Failed to initialize pool:', e)
      setMessage({ type: 'error', text: 'Failed to initialize pool' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setInitLoading(false)
    }
  }

  const handleRefillPool = async () => {
    try {
      setRefillLoading(true)
      setMessage(null)
      const result = await window.electronAPI.drive.refillPool()
      setPoolStatus(result)
      setMessage({ type: 'success', text: 'Pool refilled successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      console.error('Failed to refill pool:', e)
      setMessage({ type: 'error', text: 'Failed to refill pool' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setRefillLoading(false)
    }
  }

  return (
    <div className="mt-6 p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
      <h3 className="text-lg font-bold text-white mb-1">Google Drive / QR Upload</h3>
      <p className="text-slate-400 text-sm mb-4">
        Manage the upload pool for instant QR code generation
      </p>

      {/* Pool Status */}
      {poolLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : poolStatus ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-white">{poolStatus.total}</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Available</div>
            <div className="text-2xl font-bold text-green-400">{poolStatus.available}</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Claimed</div>
            <div className="text-2xl font-bold text-yellow-400">{poolStatus.claimed}</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 mb-1">Uploaded</div>
            <div className="text-2xl font-bold text-blue-400">{poolStatus.uploaded}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-500 text-sm">
          Pool not initialized
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleInitPool}
          disabled={initLoading || refillLoading}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {initLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Initializing...
            </span>
          ) : (
            'Khởi tạo Pool'
          )}
        </button>

        <button
          onClick={handleRefillPool}
          disabled={refillLoading || initLoading}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {refillLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Refilling...
            </span>
          ) : (
            'Làm mới Pool'
          )}
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
