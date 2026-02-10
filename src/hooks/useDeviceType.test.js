import { describe, it, expect } from 'vitest'
import { getDeviceType } from './useDeviceType.js'

describe('getDeviceType', () => {
    it('returns phone for widths below 768', () => {
        expect(getDeviceType(320)).toBe('phone')
        expect(getDeviceType(375)).toBe('phone')
        expect(getDeviceType(767)).toBe('phone')
    })

    it('returns tablet for widths 768-1024', () => {
        expect(getDeviceType(768)).toBe('tablet')
        expect(getDeviceType(900)).toBe('tablet')
        expect(getDeviceType(1024)).toBe('tablet')
    })

    it('returns desktop for widths above 1024', () => {
        expect(getDeviceType(1025)).toBe('desktop')
        expect(getDeviceType(1440)).toBe('desktop')
        expect(getDeviceType(1920)).toBe('desktop')
        expect(getDeviceType(3840)).toBe('desktop') // 4K
    })

    it('handles boundary values exactly', () => {
        expect(getDeviceType(767)).toBe('phone')
        expect(getDeviceType(768)).toBe('tablet')
        expect(getDeviceType(1024)).toBe('tablet')
        expect(getDeviceType(1025)).toBe('desktop')
    })
})
