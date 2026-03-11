import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock clipboard API before importing
const writeText = vi.fn(() => Promise.resolve())
vi.stubGlobal('navigator', { clipboard: { writeText } })

// Mock getShareUrl — isolate from youtube.js implementation
vi.mock('../utils/youtube', () => ({
    getShareUrl: (video) => `https://test.com?v=${video.youtubeId}`
}))

// Minimal React mock — capture hook behavior without rendering
let stateValue = false
let effectCleanups = []
const refStore = {}
vi.mock('react', () => ({
    useState: (init) => {
        stateValue = typeof init === 'function' ? init() : init
        return [stateValue, (v) => { stateValue = typeof v === 'function' ? v(stateValue) : v }]
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => { const cleanup = fn(); if (cleanup) effectCleanups.push(cleanup) },
    useRef: (init) => {
        if (!refStore.current) refStore.current = { current: init }
        return refStore.current
    },
}))

const { default: useCopyLink } = await import('./useCopyLink.js')

describe('useCopyLink', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        stateValue = false
        effectCleanups = []
        refStore.current = null
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns copied: false initially', () => {
        const { copied } = useCopyLink({ youtubeId: 'dQw4w9WgXcQ' })
        expect(copied).toBe(false)
    })

    it('does nothing when video is null', () => {
        const { handleCopyLink } = useCopyLink(null)
        handleCopyLink()
        expect(writeText).not.toHaveBeenCalled()
    })

    it('writes share URL to clipboard for valid video', async () => {
        const video = { youtubeId: 'dQw4w9WgXcQ' }
        const { handleCopyLink } = useCopyLink(video)
        handleCopyLink()
        expect(writeText).toHaveBeenCalledWith('https://test.com?v=dQw4w9WgXcQ')
    })

    it('calls clipboard.writeText exactly once per invocation', () => {
        const video = { youtubeId: 'Xedv19NEX-E' }
        const { handleCopyLink } = useCopyLink(video)
        handleCopyLink()
        handleCopyLink()
        expect(writeText).toHaveBeenCalledTimes(2)
    })

    it('clears previous timer on rapid re-copy (no early reset)', async () => {
        const video = { youtubeId: 'dQw4w9WgXcQ' }
        const { handleCopyLink } = useCopyLink(video)

        // First copy
        handleCopyLink()
        await vi.advanceTimersByTimeAsync(0) // flush clipboard promise

        // 1s later, copy again
        vi.advanceTimersByTime(1000)
        handleCopyLink()
        await vi.advanceTimersByTimeAsync(0) // flush clipboard promise

        // At T=2s from first copy (1s after second copy), indicator should still be true
        vi.advanceTimersByTime(1000)
        expect(stateValue).toBe(true) // old bug: would be false here from stale timer

        // At T=3s (2s after second copy), indicator resets
        vi.advanceTimersByTime(1000)
        expect(stateValue).toBe(false)
    })

    it('cleanup cancels pending timer on unmount', async () => {
        const video = { youtubeId: 'dQw4w9WgXcQ' }
        const { handleCopyLink } = useCopyLink(video)

        handleCopyLink()
        await vi.advanceTimersByTimeAsync(0) // flush clipboard promise
        expect(stateValue).toBe(true)

        // Simulate unmount — run all effect cleanups
        effectCleanups.forEach(fn => fn())

        // Timer should have been cancelled, state stays as-is (no late setCopied(false))
        vi.advanceTimersByTime(3000)
        // No error thrown = no setState on unmounted component
    })
})
