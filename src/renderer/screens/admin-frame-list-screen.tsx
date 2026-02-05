/**
 * Admin frame list screen - Gen-Z Modern Design
 * Grid view of all frame templates with create/edit/delete actions
 * Features: Gradient background, glassmorphism cards, smooth animations
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Pink blob */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        {/* Cyan blob */}
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        {/* Purple blob */}
        <div
          className="absolute -bottom-20 right-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '2s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-2 text-slate-400 hover:text-white mb-3 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Frame Templates
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              {frames.length === 0 ? (
                'Create your first masterpiece'
              ) : (
                <span>
                  <span className="text-pink-400 font-semibold">{frames.length}</span>
                  {' '}template{frames.length !== 1 ? 's' : ''} ready to rock
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/frames/new')}
            className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-2xl text-lg font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <span className="relative flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create New
            </span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-pink-500/30 rounded-full" />
              <div className="absolute top-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 mt-4 animate-pulse">Loading your frames...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && frames.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            {/* Animated illustration */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <svg
                  className="w-16 h-16 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {/* Floating decorations */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="absolute -bottom-1 -left-3 w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              <div className="absolute top-1/2 -right-4 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">No frames yet</h3>
            <p className="text-slate-400 mb-8 max-w-md">
              Let's create your first photobooth frame template! It's super easy and fun.
            </p>

            <button
              onClick={() => navigate('/admin/frames/new')}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-2xl font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Let's Go!
            </button>
          </div>
        )}

        {/* Frame grid */}
        {!loading && frames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {frames.map((frame, index) => (
              <div
                key={frame.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <FrameCard
                  frame={frame}
                  onEdit={(f) => navigate(`/admin/frames/${f.id}`)}
                  onDelete={(f) => setDeleteConfirm(f)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          >
            {/* Warning icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white text-center mb-2">Delete Frame?</h3>
            <p className="text-slate-400 text-center mb-8">
              Are you sure you want to delete <span className="text-pink-400 font-semibold">"{deleteConfirm.name}"</span>? This can't be undone.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Nah, Keep It
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
