import { useNavigate } from 'react-router-dom'

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-5xl font-bold mb-4">Photobooth</h1>
      <p className="text-xl text-gray-400 mb-12">
        Canon Camera + Google Drive + QR Code
      </p>

      <div className="flex gap-8">
        {/* Admin Mode Button */}
        <button
          onClick={() => navigate('/admin/frames')}
          className="flex flex-col items-center justify-center w-64 h-64 bg-blue-600 hover:bg-blue-700 rounded-2xl transition-colors"
        >
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-2xl font-semibold">Admin Setup</span>
          <span className="text-sm text-blue-200 mt-2">
            Frames, Camera, Drive
          </span>
        </button>

        {/* Camera Test Button (Dev Only) */}
        <button
          onClick={() => navigate('/admin/camera-test')}
          className="flex flex-col items-center justify-center w-64 h-64 bg-purple-600 hover:bg-purple-700 rounded-2xl transition-colors"
        >
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-2xl font-semibold">Camera Test</span>
          <span className="text-sm text-purple-200 mt-2">
            Phase 3 - Dev Testing
          </span>
        </button>

        {/* User Mode Button */}
        <button
          onClick={() => navigate('/user/select-frame')}
          className="flex flex-col items-center justify-center w-64 h-64 bg-green-600 hover:bg-green-700 rounded-2xl transition-colors"
        >
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-2xl font-semibold">Start Event</span>
          <span className="text-sm text-green-200 mt-2">
            Begin photo session
          </span>
        </button>
      </div>

      <p className="mt-12 text-gray-500 text-sm">
        Press F11 for fullscreen mode
      </p>
    </div>
  )
}
