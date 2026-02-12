import { describe, it, expect, vi, beforeEach } from 'vitest'

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
vi.mock('react', () => ({
    useState: (init) => {
        stateValue = typeof init === 'function' ? init() : init
        return [stateValue, (v) => { stateValue = typeof v === 'function' ? v(stateValue) : v }]
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => { const cleanup = fn(); if (cleanup) effectCleanups.push(cleanup) },
}))

const { default: useCopyLink } = await import('./useCopyLink.js')

describe('useCopyLink', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        stateValue = false
        effectCleanups = []
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
})
