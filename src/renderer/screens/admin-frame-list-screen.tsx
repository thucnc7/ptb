/**
 * Admin frame list screen
 * Grid view of all frame templates with create/edit/delete actions
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrameCard } from '../components/frame-card'
import { getAllFrames, deleteFrame } from '../services/frame-service'
import type { Frame } from '../../shared/types/frame-types'

export function AdminFrameListScreen(): JSX.Element {
  const navigate = useNavigate()
  const [frames, setFrames] = useState<Frame[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<Frame | null>(null)

  // Load frames on mount
  useEffect(() => {
    loadFrames()
  }, [])

  async function loadFrames() {
    setLoading(true)
    try {
      const loadedFrames = await getAllFrames()
      setFrames(loadedFrames)
    } catch (error) {
      console.error('Failed to load frames:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(frame: Frame) {
    try {
      await deleteFrame(frame.id)
      setFrames(prev => prev.filter(f => f.id !== frame.id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete frame:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-2 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-white">Frame Templates</h1>
          <p className="text-gray-400 mt-1">
            {frames.length} frame{frames.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/frames/new')}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-semibold transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Frame
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading frames...</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && frames.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No frames yet</h3>
          <p className="text-gray-500 mb-4">Create your first frame template to get started</p>
          <button
            onClick={() => navigate('/admin/frames/new')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors"
          >
            Create First Frame
          </button>
        </div>
      )}

      {/* Frame grid */}
      {!loading && frames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {frames.map(frame => (
            <FrameCard
              key={frame.id}
              frame={frame}
              onEdit={(f) => navigate(`/admin/frames/${f.id}`)}
              onDelete={(f) => setDeleteConfirm(f)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Delete Frame?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
