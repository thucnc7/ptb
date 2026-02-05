import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCaptureSession } from '../hooks/use-capture-session'
import { DccLiveView } from '../components/dcc-live-view'
import { CountdownOverlay } from '../components/countdown-overlay'
import { ArrowLeft, RefreshCw, Check, Home } from 'lucide-react'

export function UserCaptureScreen() {
    const { frameId } = useParams<{ frameId: string }>()
    const navigate = useNavigate()
    const {
        session,
        currentFrame,
        status,
        timeLeft,
        currentShotIndex,
        error,
        initSession,
        startCaptureSequence,
        retakePhoto,
        finishSession,
        cancelSession
    } = useCaptureSession()

    useEffect(() => {
        if (frameId) {
            initSession(frameId)
        }
    }, [frameId, initSession])

    // Handle auto-start or manual start? 
    // Probably manual start button.

    const handleStart = () => {
        startCaptureSequence()
    }

    const handleRetake = (index: number) => {
        retakePhoto(index)
    }

    const handleFinish = async () => {
        await finishSession()
        // Navigate to composite/processing (Phase 5)
        // For now, back to home
        alert('Session Finished! (Proceed to Phase 5)')
        navigate('/user/selection')
    }

    if (error) {
        return (
            <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2">Đã có lỗi xảy ra</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/user/selection')}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full"
                >
                    Quay lại
                </button>
            </div>
        )
    }

    if (!session || !currentFrame) {
        return (
            <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        )
    }

    // REVIEW MODE
    if (status === 'review-all') {
        return (
            <div className="h-screen bg-gray-900 text-white p-8 flex flex-col">
                <h1 className="text-3xl font-bold mb-6 text-center">Xem lại ảnh đã chụp</h1>

                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-4">
                    {session.capturedPhotos.map((photo, index) => (
                        <div key={photo.id} className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                            <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                                #{index + 1}
                            </div>
                            <img
                                src={`file://${photo.path}`}
                                alt={`Shot ${index + 1}`}
                                className="w-full h-64 object-cover"
                            />
                            <div className="p-4 flex justify-center">
                                <button
                                    onClick={() => handleRetake(index)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    <span>Chụp lại</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center space-x-6">
                    <button
                        onClick={() => {
                            const confirmed = confirm('Bạn có chắc muốn hủy bộ ảnh này?')
                            if (confirmed) {
                                cancelSession()
                                navigate('/user/selection')
                            }
                        }}
                        className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full text-lg font-medium flex items-center space-x-2"
                    >
                        <Home size={24} />
                        <span>Hủy & Về trang chủ</span>
                    </button>

                    <button
                        onClick={handleFinish}
                        className="px-12 py-4 bg-gradient-to-r from-pink-500 to-violet-600 hover:shadow-lg hover:scale-105 transition-all rounded-full text-xl font-bold flex items-center space-x-3"
                    >
                        <span>Hoàn thành & In ảnh</span>
                        <Check size={28} />
                    </button>
                </div>
            </div>
        )
    }

    // CAPTURE MODE (Idle, Countdown, Capturing)
    return (
        <div className="h-screen bg-black overflow-hidden relative flex flex-col">

            {/* Header Info */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
                <div className="text-white">
                    <h2 className="text-2xl font-bold tracking-tight">{currentFrame.name}</h2>
                    <div className="flex items-center space-x-4 mt-2">
                        <span className="bg-pink-600 px-3 py-1 rounded-full text-sm font-bold">
                            Ảnh {session.capturedPhotos.length + 1} / {currentFrame.imageCaptures}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Live View Area */}
            <div className="flex-1 relative">
                <DccLiveView className="w-full h-full object-contain" />

                {/* Live View Overlays for "Get Ready" state when idle */}
                {status === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-sm p-8 rounded-3xl border border-white/20 text-center animate-pulse">
                            <p className="text-white text-4xl font-bold mb-2">Sẵn sàng?</p>
                            <p className="text-white/80 text-xl">Nhìn vào máy ảnh và cười thật tươi!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                {status === 'idle' && (
                    <button
                        onClick={handleStart}
                        className="px-16 py-6 bg-white text-black hover:bg-gray-100 rounded-full text-3xl font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all transform flex items-center space-x-4"
                    >
                        <div className="w-8 h-8 rounded-full bg-red-500 animate-pulse border-2 border-red-300"></div>
                        <span>CHỤP NGAY</span>
                    </button>
                )}

                {(status === 'countdown' || status === 'capturing') && (
                    <div className="text-white text-xl font-medium opacity-80">
                        Đừng di chuyển...
                    </div>
                )}
            </div>

            {/* Countdown Overlay */}
            {status === 'countdown' && timeLeft !== null && (
                <CountdownOverlay seconds={timeLeft} />
            )}

            {/* Flash Overlay handled by CountdownOverlay onComplete usually, 
          but hook handles status transition. 
          We can just let CountdownOverlay handle the flash visual.
      */}
        </div>
    )
}
