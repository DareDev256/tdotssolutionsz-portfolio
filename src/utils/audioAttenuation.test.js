import { describe, it, expect } from 'vitest'
import {
  getVolumeFromDistance,
  AUDIO_SILENCE_DISTANCE,
  AUDIO_MAX_VOLUME,
} from './audioAttenuation.js'

describe('getVolumeFromDistance', () => {
  it('returns max volume at distance 0 (camera directly on billboard)', () => {
    expect(getVolumeFromDistance(0)).toBe(AUDIO_MAX_VOLUME)
  })

  it('returns 0 at the silence distance boundary', () => {
    expect(getVolumeFromDistance(AUDIO_SILENCE_DISTANCE)).toBe(0)
  })

  it('returns 0 beyond the silence distance', () => {
    expect(getVolumeFromDistance(AUDIO_SILENCE_DISTANCE + 1)).toBe(0)
    expect(getVolumeFromDistance(100)).toBe(0)
    expect(getVolumeFromDistance(999999)).toBe(0)
  })

  it('uses quadratic falloff — halfway distance gives ~25% volume, not 50%', () => {
    // At half distance: t = 0.5, eased = 0.25, volume = 0.25 * 80 = 20
    const halfDistance = AUDIO_SILENCE_DISTANCE / 2
    expect(getVolumeFromDistance(halfDistance)).toBe(Math.round(0.25 * AUDIO_MAX_VOLUME))
  })

  it('uses quadratic falloff — quarter distance gives ~56% volume', () => {
    // At quarter distance: t = 0.75, eased = 0.5625, volume = 0.5625 * 80 = 45
    const quarterDistance = AUDIO_SILENCE_DISTANCE / 4
    expect(getVolumeFromDistance(quarterDistance)).toBe(Math.round(0.5625 * AUDIO_MAX_VOLUME))
  })

  it('returns integers (YouTube API requires whole numbers)', () => {
    for (let d = 0; d <= AUDIO_SILENCE_DISTANCE; d += 0.7) {
      const vol = getVolumeFromDistance(d)
      expect(vol).toBe(Math.round(vol))
    }
  })

  it('never exceeds AUDIO_MAX_VOLUME', () => {
    // Negative distances shouldn't produce values above max
    expect(getVolumeFromDistance(-10)).toBeLessThanOrEqual(AUDIO_MAX_VOLUME)
    expect(getVolumeFromDistance(0)).toBeLessThanOrEqual(AUDIO_MAX_VOLUME)
  })

  it('produces monotonically decreasing volume as distance increases', () => {
    let prevVol = AUDIO_MAX_VOLUME + 1
    for (let d = 0; d <= AUDIO_SILENCE_DISTANCE; d += 1) {
      const vol = getVolumeFromDistance(d)
      expect(vol).toBeLessThanOrEqual(prevVol)
      prevVol = vol
    }
  })

  // --- Edge cases / error handling ---
  it('returns 0 for NaN', () => {
    expect(getVolumeFromDistance(NaN)).toBe(0)
  })

  it('returns 0 for Infinity', () => {
    expect(getVolumeFromDistance(Infinity)).toBe(0)
    expect(getVolumeFromDistance(-Infinity)).toBe(0)
  })

  it('returns 0 for undefined/null (coerced to NaN)', () => {
    expect(getVolumeFromDistance(undefined)).toBe(0)
    expect(getVolumeFromDistance(null)).toBe(0)
  })

  it('clamps negative distances to 0 (returns max volume)', () => {
    // Negative distances can occur from floating-point imprecision in 3D math.
    // They should clamp to 0, returning max volume (not exceeding it).
    expect(getVolumeFromDistance(-5)).toBe(AUDIO_MAX_VOLUME)
    expect(getVolumeFromDistance(-100)).toBe(AUDIO_MAX_VOLUME)
  })
})

describe('audio constants', () => {
  it('AUDIO_SILENCE_DISTANCE is a positive number', () => {
    expect(AUDIO_SILENCE_DISTANCE).toBeGreaterThan(0)
  })

  it('AUDIO_MAX_VOLUME is within YouTube API range 0-100', () => {
    expect(AUDIO_MAX_VOLUME).toBeGreaterThan(0)
    expect(AUDIO_MAX_VOLUME).toBeLessThanOrEqual(100)
  })
})
