import { describe, it, expect } from 'vitest'
import { diverseShuffle } from './diverseShuffle.js'

const MOCK_POOL = Array.from({ length: 10 }, (_, i) => ({
    id: `item-${i}`,
    label: `Item ${i}`,
}))

describe('diverseShuffle — core algorithm', () => {
    it('returns a valid index into the pool', () => {
        const history = []
        const idx = diverseShuffle(MOCK_POOL, history, 5, v => v.id)
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(MOCK_POOL.length)
    })

    it('pushes the picked key onto history', () => {
        const history = []
        const idx = diverseShuffle(MOCK_POOL, history, 5, v => v.id)
        expect(history).toContain(MOCK_POOL[idx].id)
        expect(history).toHaveLength(1)
    })

    it('evicts oldest entry when history exceeds maxHistory', () => {
        const history = ['item-0', 'item-1', 'item-2']
        diverseShuffle(MOCK_POOL, history, 3, v => v.id)
        expect(history).toHaveLength(3)
        expect(history).not.toContain('item-0')
    })

    it('excludes history items from selection', () => {
        // Fill history with 9 of 10 items — only one candidate remains
        const history = MOCK_POOL.slice(0, 9).map(v => v.id)
        const idx = diverseShuffle(MOCK_POOL, history, 20, v => v.id)
        expect(MOCK_POOL[idx].id).toBe('item-9')
    })

    it('falls back to full pool when history covers everything', () => {
        const history = MOCK_POOL.map(v => v.id)
        // Should not throw — picks from full pool
        const idx = diverseShuffle(MOCK_POOL, history, 20, v => v.id)
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(MOCK_POOL.length)
    })

    it('guarantees full rotation with maxHistory = pool.length - 1', () => {
        const history = []
        const seen = new Set()
        for (let i = 0; i < MOCK_POOL.length; i++) {
            const idx = diverseShuffle(MOCK_POOL, history, MOCK_POOL.length - 1, v => v.id)
            seen.add(MOCK_POOL[idx].id)
        }
        expect(seen.size).toBe(MOCK_POOL.length)
    })

    it('works with custom key functions', () => {
        const pool = [{ code: 'A' }, { code: 'B' }, { code: 'C' }]
        const history = ['A', 'B']
        const idx = diverseShuffle(pool, history, 5, v => v.code)
        expect(pool[idx].code).toBe('C')
    })

    it('avoids back-to-back repeat when history covers entire pool', () => {
        const pool = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
        const results = new Set()
        // Run 50 times — should never return the most recent item ('C')
        for (let i = 0; i < 50; i++) {
            const history = ['A', 'B', 'C']
            const idx = diverseShuffle(pool, history, 10, v => v.id)
            results.add(pool[idx].id)
        }
        expect(results.has('C')).toBe(false)
    })

    it('trims oversized history before filtering candidates', () => {
        // Simulate maxHistory shrinking from 8 to 2
        const history = ['item-0', 'item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7']
        diverseShuffle(MOCK_POOL, history, 2, v => v.id)
        // History should be trimmed to maxHistory (2), not just 1 removed
        expect(history).toHaveLength(2)
    })

    it('handles single-item pool gracefully', () => {
        const pool = [{ id: 'only' }]
        const history = ['only']
        const idx = diverseShuffle(pool, history, 5, v => v.id)
        expect(idx).toBe(0)
    })
})
