/**
 * Easing functions for animation hooks.
 *
 * Single source of truth — consumed by useCountUp and its test suite.
 * Add new curves here as needed (easeOutCubic, easeOutQuad, etc).
 */

/**
 * Exponential ease-out — fast start, gentle deceleration.
 * Hits ~85% of the target in the first third of duration, creating a
 * satisfying "snappy start, gentle landing" feel that draws the eye.
 *
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased value from 0 to 1
 */
export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}
