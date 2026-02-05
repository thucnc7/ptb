import { useEffect, useState } from 'react'

interface CountdownOverlayProps {
    seconds?: number
    onComplete?: () => void
}

export function CountdownOverlay({ seconds = 3, onComplete }: CountdownOverlayProps) {
    const [count, setCount] = useState(seconds)
    const [showFlash, setShowFlash] = useState(false)

    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => {
                setCount(c => c - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else {
            // Flash effect when hitting 0
            setShowFlash(true)
            const timer = setTimeout(() => {
                onComplete?.()
            }, 200) // Short delay for flash
            return () => clearTimeout(timer)
        }
    }, [count, onComplete])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            {/* Flash effect */}
            <div
                className={`fixed inset-0 bg-white transition-opacity duration-200 pointer-events-none ${showFlash ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {/* Number */}
            {!showFlash && count > 0 && (
                <div className="text-[20rem] font-bold text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] animate-bounce font-mono">
                    {count}
                </div>
            )}

            {!showFlash && count === 0 && (
                <div className="text-8xl font-bold text-white drop-shadow-lg">
                    CHEESE! 📸
                </div>
            )}
        </div>
    )
}
