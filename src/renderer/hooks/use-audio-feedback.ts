/**
 * Audio feedback hook for photobooth interactions
 * Uses Web Audio API to generate sound effects
 */

import { useRef, useCallback, useEffect } from 'react'

export function useAudioFeedback() {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Initialize Audio Context on mount
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext()
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Countdown tick sound (higher pitch for lower numbers)
  const playCountdownTick = useCallback((value: number) => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Higher pitch as countdown decreases
    const baseFreq = value === 1 ? 880 : value === 2 ? 660 : 440
    oscillator.frequency.value = baseFreq
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }, [])

  // Camera shutter sound
  const playShutterSound = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx) return

    // Create a "click" sound with white noise
    const bufferSize = ctx.sampleRate * 0.05 // 50ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate white noise burst
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
    }

    const source = ctx.createBufferSource()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    source.buffer = buffer
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    filter.type = 'bandpass'
    filter.frequency.value = 1000

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    source.start(ctx.currentTime)
  }, [])

  // Success/completion sound
  const playSuccessSound = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Ascending arpeggio: C - E - G
    const notes = [523.25, 659.25, 783.99]
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, ctx.currentTime)

    notes.forEach((freq, i) => {
      const time = ctx.currentTime + i * 0.15
      oscillator.frequency.setValueAtTime(freq, time)
      gainNode.gain.setValueAtTime(0.2, time)
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
    })

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  }, [])

  // Error sound
  const playErrorSound = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
    oscillator.type = 'sawtooth'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }, [])

  // Start session sound
  const playStartSound = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(440, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2)
    oscillator.type = 'triangle'

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }, [])

  return {
    playCountdownTick,
    playShutterSound,
    playSuccessSound,
    playErrorSound,
    playStartSound
  }
}
