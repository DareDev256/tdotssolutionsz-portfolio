import { describe, it, expect } from 'vitest'
import { easeOutExpo } from './easing.js'

/**
 * Mathematical verification of easeOutExpo — the exponential ease-out
 * curve used by useCountUp for animated counters.
 *
 * These tests guard animation correctness: a broken easing function
 * causes counters to overshoot, undershoot, stall, or jump — all
 * visually jarring on the portfolio stats display.
 */

describe('easeOutExpo — boundary conditions', () => {
    it('returns exactly 0 at t=0 (animation start)', () => {
        expect(easeOutExpo(0)).toBe(0)
    })

    it('returns exactly 1 at t=1 (animation end)', () => {
        // The function has a special case for t===1 because
        // 1 - Math.pow(2, -10) ≈ 0.999 not exactly 1.0
        expect(easeOutExpo(1)).toBe(1)
    })

    it('handles t=0.5 (midpoint) — should be well past halfway due to ease-out', () => {
        const mid = easeOutExpo(0.5)
        // Exponential ease-out reaches ~96.9% at midpoint
        expect(mid).toBeGreaterThan(0.95)
        expect(mid).toBeLessThan(1)
    })
})

describe('easeOutExpo — monotonicity (never goes backwards)', () => {
    it('output always increases as t increases from 0 to 1', () => {
        const steps = 100
        let prev = easeOutExpo(0)
        for (let i = 1; i <= steps; i++) {
            const t = i / steps
            const current = easeOutExpo(t)
            expect(current).toBeGreaterThanOrEqual(prev)
            prev = current
        }
    })
})

describe('easeOutExpo — output range [0, 1]', () => {
    it('never returns negative values for valid input range', () => {
        for (let i = 0; i <= 100; i++) {
            expect(easeOutExpo(i / 100)).toBeGreaterThanOrEqual(0)
        }
    })

    it('never exceeds 1.0 for valid input range', () => {
        for (let i = 0; i <= 100; i++) {
            expect(easeOutExpo(i / 100)).toBeLessThanOrEqual(1)
        }
    })
})

describe('easeOutExpo — ease-out curve shape', () => {
    it('reaches ~85% of target in first third (fast start)', () => {
        // This is the defining characteristic documented in the JSDoc:
        // "Hits ~85% of the target in the first third of duration"
        const oneThird = easeOutExpo(1 / 3)
        expect(oneThird).toBeGreaterThan(0.85)
    })

    it('first half of animation covers more ground than second half', () => {
        const firstHalf = easeOutExpo(0.5) - easeOutExpo(0)
        const secondHalf = easeOutExpo(1) - easeOutExpo(0.5)
        expect(firstHalf).toBeGreaterThan(secondHalf)
    })

    it('rate of change decreases over time (deceleration)', () => {
        // Compare velocity at t=0.1 vs t=0.9
        const dt = 0.001
        const earlyVelocity = (easeOutExpo(0.1 + dt) - easeOutExpo(0.1)) / dt
        const lateVelocity = (easeOutExpo(0.9 + dt) - easeOutExpo(0.9)) / dt
        expect(earlyVelocity).toBeGreaterThan(lateVelocity)
    })

    it('is concave (second derivative negative) — no sudden acceleration', () => {
        // Sample acceleration at multiple points — should always be negative
        const dt = 0.001
        for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
            const v1 = (easeOutExpo(t) - easeOutExpo(t - dt)) / dt
            const v2 = (easeOutExpo(t + dt) - easeOutExpo(t)) / dt
            const acceleration = (v2 - v1) / dt
            expect(acceleration).toBeLessThanOrEqual(0)
        }
    })
})

describe('easeOutExpo — specific known values', () => {
    it('matches the formula 1 - 2^(-10t) for non-boundary inputs', () => {
        const testPoints = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        for (const t of testPoints) {
            const expected = 1 - Math.pow(2, -10 * t)
            expect(easeOutExpo(t)).toBeCloseTo(expected, 10)
        }
    })

    it('t=0.1 already reaches ~50% (fast initial response)', () => {
        expect(easeOutExpo(0.1)).toBeGreaterThan(0.49)
        expect(easeOutExpo(0.1)).toBeLessThan(0.52)
    })

    it('t=0.9 is within 0.2% of final value (gentle landing)', () => {
        expect(easeOutExpo(0.9)).toBeGreaterThan(0.998)
    })
})

describe('easeOutExpo — numerical stability', () => {
    it('handles very small t values without returning negative', () => {
        expect(easeOutExpo(0.0001)).toBeGreaterThan(0)
        expect(easeOutExpo(Number.EPSILON)).toBeGreaterThan(0)
    })

    it('handles t values very close to 1 without exceeding 1', () => {
        expect(easeOutExpo(0.9999)).toBeLessThanOrEqual(1)
        expect(easeOutExpo(1 - Number.EPSILON)).toBeLessThanOrEqual(1)
    })
})
