/**
 * useCountUp — Animates a number from 0 to a target value with easing.
 *
 * Uses requestAnimationFrame for smooth 60fps counting. The easeOutExpo
 * curve front-loads the visual progress (hits ~85% in the first third of
 * duration), creating a satisfying "snappy start, gentle landing" feel
 * that draws the eye more than linear counting.
 *
 * @param {number} target - The number to count up to
 * @param {number} duration - Animation duration in ms (default 2000)
 * @param {boolean} trigger - Whether to start the animation
 * @returns {number} Current animated value (integer)
 */
import { useState, useEffect, useRef } from 'react'
import { easeOutExpo } from '../utils/easing'

export default function useCountUp(target, duration = 2000, trigger = false) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!trigger || hasAnimatedRef.current || target <= 0) return
    hasAnimatedRef.current = true

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      const eased = easeOutExpo(progress)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [trigger, target, duration])

  return value
}
