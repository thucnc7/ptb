import { useState } from 'react'
import { useCameraConnection } from '../hooks/use-camera-connection'
import { LiveViewCanvas } from '../components/live-view-canvas'
import { useNavigate } from 'react-router-dom'

export function AdminCameraTestScreen() {
  const navigate = useNavigate()
  const {
    status,
    connectionState,
    cameras,
    refreshCameras,
    connect,
    disconnect,
    startLiveView,
    stopLiveView,
    capture
  } = useCameraConnection()

  const [lastCapture, setLastCapture] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
      alert(`Failed to connect: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await disconnect()
      setLastCapture(null)
    } catch (error) {
      console.error('Disconnect failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartLiveView = async () => {
    setLoading(true)
    try {
      await startLiveView()
    } catch (error) {
      console.error('Start live view failed:', error)
      alert(`Failed to start live view: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStopLiveView = async () => {
    setLoading(true)
    try {
      await stopLiveView()
    } catch (error) {
      console.error('Stop live view failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCapture = async () => {
    setLoading(true)
    try {
      const result = await capture()
      setLastCapture(result.filePath)
      alert(`Photo captured: ${result.filePath}`)
    } catch (error) {
      console.error('Capture failed:', error)
      alert(`Capture failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshCameras = async () => {
    setLoading(true)
    try {
      await refreshCameras()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Camera Test</h1>
            <p className="text-gray-400">Phase 3 - Canon Camera Integration Test</p>
          </div>
          <button
            onClick={() => navigate('/admin/frames')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            ← Back to Frames
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Camera Controls */}
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">State:</span>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      connectionState === 'connected'
                        ? 'bg-green-500/20 text-green-400'
                        : connectionState === 'connecting'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : connectionState === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {connectionState}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Live View:</span>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      status.liveViewActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {status.liveViewActive ? 'Active' : 'Stopped'}
                  </span>
                </div>
                {status.cameraInfo && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Model:</span>
                      <span className="text-white">{status.cameraInfo.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Serial:</span>
                      <span className="text-white">{status.cameraInfo.serialNumber}</span>
                    </div>
                  </>
                )}
                {status.error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                    <p className="text-red-400 text-sm">{status.error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Camera List */}
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Available Cameras</h2>
                <button
                  onClick={handleRefreshCameras}
                  disabled={loading}
                  className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {cameras.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No cameras found. Click Refresh to scan.
                  </p>
                ) : (
                  cameras.map((camera) => (
                    <div key={camera.id} className="bg-gray-800 rounded p-3">
                      <div className="font-medium">{camera.model}</div>
                      <div className="text-sm text-gray-400">{camera.serialNumber}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              <div className="grid grid-cols-2 gap-3">
                {!status.connected ? (
                  <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="col-span-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : 'Connect Camera'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDisconnect}
                      disabled={loading}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                    {!status.liveViewActive ? (
                      <button
                        onClick={handleStartLiveView}
                        disabled={loading}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
                      >
                        Start Live View
                      </button>
                    ) : (
                      <button
                        onClick={handleStopLiveView}
                        disabled={loading}
                        className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium disabled:opacity-50"
                      >
                        Stop Live View
                      </button>
                    )}
                    <button
                      onClick={handleCapture}
                      disabled={loading}
                      className="col-span-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Capturing...' : '📸 Capture Photo'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Last Capture */}
            {lastCapture && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Last Capture</h2>
                <p className="text-sm text-gray-400 break-all">{lastCapture}</p>
              </div>
            )}
          </div>

          {/* Right: Live View */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Live View</h2>
            <LiveViewCanvas className="w-full aspect-video" />
          </div>
        </div>
      </div>
    </div>
  )
}
