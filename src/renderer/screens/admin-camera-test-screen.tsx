import { useState, useEffect, useRef } from 'react'
import { useCameraConnection } from '../hooks/use-camera-connection'
import { DccLiveView } from '../components/dcc-live-view'
import { WebcamLiveView, type WebcamLiveViewRef } from '../components/webcam-live-view'
import { useNavigate } from 'react-router-dom'
import { pathToFileUrl } from '../../shared/utils/file-url-helper'

export function AdminCameraTestScreen() {
  const navigate = useNavigate()
  const {
    status,
    connectionState,
    cameras,
    cameraMode,
    refreshCameras,
    connect,
    disconnect,
    startLiveView,
    stopLiveView,
    capture,
    webcamCapture
  } = useCameraConnection()
  const webcamRef = useRef<WebcamLiveViewRef>(null)
  const isWebcam = cameraMode === 'webcam'

  const [lastCapture, setLastCapture] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dccStatus, setDccStatus] = useState<{ installed: boolean | null; available: boolean | null }>({ installed: null, available: null })
  const [setupProgress, setSetupProgress] = useState<{ percent: number; message: string } | null>(null)

  useEffect(() => {
    checkDccStatus()
    const interval = setInterval(checkDccStatus, 5000)

    // Listen for setup progress
    const cleanup = window.electronAPI.camera.onSetupProgress((data) => {
      setSetupProgress(data)
    })

    return () => {
      clearInterval(interval)
      cleanup()
    }
  }, [])

  const checkDccStatus = async () => {
    try {
      const [installed, available] = await Promise.all([
        window.electronAPI.camera.checkDccInstalled(),
        window.electronAPI.camera.checkDccAvailable()
      ])
      setDccStatus({ installed, available })
    } catch (e) {
      console.error('Failed to check DCC status', e)
    }
  }

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
      let result
      if (isWebcam && webcamRef.current) {
        const frameData = await webcamRef.current.captureFrame()
        result = await webcamCapture(frameData)
      } else {
        result = await capture()
      }
      setLastCapture(result.filePath || null)
      if (result.success) {
        alert(`Photo captured: ${result.filePath}`)
      } else {
        alert(`Capture failed: ${result.error}`)
      }
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

  const handleAutoInstall = async () => {
    setLoading(true)
    try {
      await window.electronAPI.camera.autoSetupDcc()
      await checkDccStatus()
    } catch (e) {
      alert(`Auto setup failed: ${e}`)
    } finally {
      setLoading(false)
      setSetupProgress(null)
    }
  }

  const handleLaunchDcc = async () => {
    setLoading(true)
    try {
      await window.electronAPI.camera.launchDcc()
      // Wait a bit for it to start
      setTimeout(checkDccStatus, 5000)
    } catch (e) {
      alert(`Launch failed: ${e}`)
      setLoading(false)
    }
  }

  const isDccReady = dccStatus.available

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Camera Test</h1>
            <p className="text-gray-400">
              {isWebcam ? 'Webcam Mode' : 'Phase 3 - Canon Camera Integration Test'}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/frames')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            ← Back to Frames
          </button>
        </div>

        {/* DCC Setup Guide - hidden in webcam mode */}
        {!isWebcam && <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📸 digiCamControl Setup
              {isDccReady ? (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">Ready</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30">Setup Required</span>
              )}
            </h2>
            <button onClick={checkDccStatus} className="text-sm text-gray-400 hover:text-white">Refresh Status</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Install */}
            <div className={`p-4 rounded-lg border ${dccStatus.installed ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${dccStatus.installed ? 'bg-green-500 text-black' : 'bg-gray-700'}`}>1</div>
                <h3 className="font-medium">Installation</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">digiCamControl must be installed on this computer.</p>
              {dccStatus.installed ? (
                <p className="text-green-400 text-sm">✅ Installed</p>
              ) : (
                <div>
                  {setupProgress ? (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${setupProgress.percent}%` }}></div>
                      </div>
                      <p className="text-xs text-blue-400">{setupProgress.message}</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleAutoInstall}
                      disabled={loading}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50"
                    >
                      🚀 Auto Install
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Launch */}
            <div className={`p-4 rounded-lg border ${dccStatus.available ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${dccStatus.available ? 'bg-green-500 text-black' : 'bg-gray-700'}`}>2</div>
                <h3 className="font-medium">Web Server</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Web server (port 5513) must be running.</p>
              {dccStatus.available ? (
                <p className="text-green-400 text-sm">✅ Running</p>
              ) : (
                <div>
                  {dccStatus.installed ? (
                    <button
                      onClick={handleLaunchDcc}
                      disabled={loading}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50"
                    >
                      ▶️ Launch App
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Waiting for installation...</p>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Connect */}
            <div className={`p-4 rounded-lg border ${status.connected ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${status.connected ? 'bg-green-500 text-black' : 'bg-gray-700'}`}>3</div>
                <h3 className="font-medium">Connection</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Connect camera via USB and power on.</p>
              {status.connected ? (
                <div className="text-green-400 text-sm">
                  <p>✅ Connected</p>
                  <p className="text-xs opacity-75">{status.cameraInfo?.model}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic"> waiting for connection...</p>
              )}
            </div>
          </div>
        </div>}

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
                    className={`px-3 py-1 rounded text-sm font-medium ${connectionState === 'connected'
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
                    className={`px-3 py-1 rounded text-sm font-medium ${status.liveViewActive
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
                    disabled={loading || (!isWebcam && !isDccReady)}
                    className="col-span-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : isWebcam ? 'Connect Webcam' : 'Connect Camera'}
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
                <div className="rounded-lg overflow-hidden border border-gray-700 mb-2">
                  <img src={pathToFileUrl(lastCapture)} alt="Last capture" className="w-full h-auto" />
                </div>
                <p className="text-sm text-gray-400 break-all">{lastCapture}</p>
              </div>
            )}
          </div>

          {/* Right: Live View */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isWebcam ? '🎥 Live View (Webcam)' : '📹 Live View (từ digiCamControl)'}
            </h2>
            {isWebcam ? (
              status.connected ? (
                <WebcamLiveView ref={webcamRef} className="w-full aspect-video" mirror={true} />
              ) : (
                <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">🎥 Webcam mode</p>
                    <p className="text-sm">Nhấn Connect Webcam để bắt đầu</p>
                  </div>
                </div>
              )
            ) : status.liveViewActive ? (
              <DccLiveView className="w-full aspect-video" />
            ) : (
              <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  {!dccStatus.available ? (
                    <>
                      <p className="mb-2">⚠️ digiCamControl chưa sẵn sàng</p>
                      <p className="text-sm">Bật digiCamControl với Web Server để xem live view</p>
                    </>
                  ) : !status.connected ? (
                    <>
                      <p className="mb-2">📷 Chưa kết nối camera</p>
                      <p className="text-sm">Kết nối camera trước khi bật live view</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">🎬 Live view chưa bật</p>
                      <p className="text-sm mb-4">Nhấn nút bên dưới để bật live view</p>
                      <button
                        onClick={handleStartLiveView}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
                      >
                        ▶️ Bật Live View
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
