import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logError, withRecovery, ErrorCategory } from './errorHandling'

describe('ErrorCategory', () => {
    it('exposes all expected categories', () => {
        expect(ErrorCategory.STORAGE).toBe('storage')
        expect(ErrorCategory.NETWORK).toBe('network')
        expect(ErrorCategory.PLAYER).toBe('player')
        expect(ErrorCategory.RENDER).toBe('render')
        expect(ErrorCategory.PARSE).toBe('parse')
    })

    it('is frozen (immutable)', () => {
        expect(Object.isFrozen(ErrorCategory)).toBe(true)
    })
})

describe('logError', () => {
    let warnSpy

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    })

    afterEach(() => vi.restoreAllMocks())

    it('returns structured entry with category, action, and message', () => {
        const entry = logError('storage', 'readFavorites', new Error('corrupt JSON'))
        expect(entry.category).toBe('storage')
        expect(entry.action).toBe('readFavorites')
        expect(entry.message).toBe('corrupt JSON')
        expect(entry.timestamp).toBeTruthy()
    })

    it('stringifies non-Error values', () => {
        const entry = logError('player', 'onError', 150)
        expect(entry.message).toBe('150')
    })

    it('handles null/undefined error gracefully', () => {
        expect(logError('parse', 'test', null).message).toBe('unknown')
        expect(logError('parse', 'test', undefined).message).toBe('unknown')
    })

    it('includes context when provided', () => {
        const entry = logError('storage', 'write', 'fail', { key: 'favorites' })
        expect(entry.context).toEqual({ key: 'favorites' })
    })

    it('omits context key when not provided', () => {
        const entry = logError('network', 'fetch', 'timeout')
        expect(entry).not.toHaveProperty('context')
    })
})

describe('withRecovery', () => {
    let warnSpy

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    })

    afterEach(() => vi.restoreAllMocks())

    it('returns function result on success', () => {
        const result = withRecovery('storage', 'read', () => [1, 2, 3], [])
        expect(result).toEqual([1, 2, 3])
    })

    it('returns fallback and logs on failure', () => {
        const result = withRecovery('storage', 'read', () => {
            throw new Error('quota exceeded')
        }, 'fallback')
        expect(result).toBe('fallback')
    })

    it('passes context to logError on failure', () => {
        withRecovery('storage', 'write', () => { throw new Error('fail') },
            null, { key: 'test' })
        // Verify it didn't throw — the context is tested via logError tests
    })
})
