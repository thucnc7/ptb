/**
 * Countdown configuration types for photobooth
 */

export type CountdownPreset = 3 | 5 | 10

export interface CountdownConfig {
  duration: number // seconds (1-60)
  preset?: CountdownPreset
  isCustom: boolean
}

export const COUNTDOWN_PRESETS: CountdownPreset[] = [3, 5, 10]

export const MIN_COUNTDOWN = 1
export const MAX_COUNTDOWN = 60
export const DEFAULT_COUNTDOWN = 5
