/**
 * Audio distance attenuation — pure math extracted from App.jsx for testability.
 *
 * Maps camera-to-billboard distance → YouTube volume using quadratic easing.
 * Quadratic (t²) gives natural audio falloff: rapid dropoff near silence threshold,
 * gentle near the source. This matches how we perceive loudness in physical space.
 */

/** World units — beyond this, volume is 0 */
export const AUDIO_SILENCE_DISTANCE = 35

/** YouTube volume (0-100). 80 avoids clipping on loud tracks */
export const AUDIO_MAX_VOLUME = 80

/** Seconds between volume updates (avoids hammering YT API) */
export const AUDIO_UPDATE_INTERVAL = 0.1

/** Minimum change to trigger a YT setVolume call */
export const AUDIO_VOLUME_EPSILON = 1

/**
 * Maps camera-to-billboard distance → YouTube volume (0–AUDIO_MAX_VOLUME).
 * Uses quadratic easing (t²) for a natural audio falloff curve.
 * @param {number} distance - World-space distance between camera and billboard
 * @returns {number} Integer volume 0–AUDIO_MAX_VOLUME
 */
export function getVolumeFromDistance(distance) {
  if (!Number.isFinite(distance)) return 0
  const clamped = Math.max(0, Math.min(distance, AUDIO_SILENCE_DISTANCE))
  const t = 1 - clamped / AUDIO_SILENCE_DISTANCE
  const eased = t * t
  return Math.round(eased * AUDIO_MAX_VOLUME)
}
