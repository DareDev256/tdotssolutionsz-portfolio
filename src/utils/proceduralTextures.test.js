import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Three.js CanvasTexture ──
vi.mock('three', () => ({
    CanvasTexture: vi.fn(function (canvas) {
        this.canvas = canvas
        this.needsUpdate = false
    })
}))

// ── Mock canvas 2D context ──
function createMockCtx() {
    return {
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        fillRect: vi.fn(),
        fillStyle: null,
        globalCompositeOperation: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
    }
}

let mockCtx
beforeEach(() => {
    mockCtx = createMockCtx()
    vi.stubGlobal('document', {
        createElement: vi.fn(() => ({
            width: 0,
            height: 0,
            getContext: vi.fn(() => mockCtx),
        }))
    })
})

// Dynamic import after mocks are in place
const {
    createSoftCircleTexture,
    createHexBokehTexture,
    createStreakTexture,
    createDustTexture,
} = await import('./proceduralTextures.js')

describe('createSoftCircleTexture', () => {
    it('creates a canvas of the requested size', () => {
        const tex = createSoftCircleTexture(128, '#ff0000')
        const canvas = document.createElement.mock.results.at(-1).value
        expect(canvas.width).toBe(128)
        expect(canvas.height).toBe(128)
    })

    it('uses a radial gradient with 4 color stops', () => {
        createSoftCircleTexture()
        expect(mockCtx.createRadialGradient).toHaveBeenCalledOnce()
        const gradient = mockCtx.createRadialGradient.mock.results[0].value
        expect(gradient.addColorStop).toHaveBeenCalledTimes(4)
    })

    it('returns an object with needsUpdate = true', () => {
        const tex = createSoftCircleTexture()
        expect(tex.needsUpdate).toBe(true)
    })

    it('defaults to size 64 and white color', () => {
        createSoftCircleTexture()
        const canvas = document.createElement.mock.results.at(-1).value
        expect(canvas.width).toBe(64)
        expect(canvas.height).toBe(64)
    })
})

describe('createHexBokehTexture', () => {
    it('draws a hexagon with 6 lineTo/moveTo calls', () => {
        createHexBokehTexture()
        expect(mockCtx.beginPath).toHaveBeenCalledOnce()
        expect(mockCtx.moveTo).toHaveBeenCalledOnce()
        expect(mockCtx.lineTo).toHaveBeenCalledTimes(5)
        expect(mockCtx.closePath).toHaveBeenCalledOnce()
        expect(mockCtx.fill).toHaveBeenCalledOnce()
    })

    it('uses radial gradient with 3 color stops', () => {
        createHexBokehTexture()
        expect(mockCtx.createRadialGradient).toHaveBeenCalledOnce()
        const gradient = mockCtx.createRadialGradient.mock.results[0].value
        expect(gradient.addColorStop).toHaveBeenCalledTimes(3)
    })

    it('returns a texture with needsUpdate = true', () => {
        const tex = createHexBokehTexture(32, '#ff00ff')
        expect(tex.needsUpdate).toBe(true)
    })
})

describe('createStreakTexture', () => {
    it('creates a non-square canvas (width > height)', () => {
        createStreakTexture(256, 64)
        const canvas = document.createElement.mock.results.at(-1).value
        expect(canvas.width).toBe(256)
        expect(canvas.height).toBe(64)
    })

    it('uses both horizontal and vertical linear gradients', () => {
        createStreakTexture()
        expect(mockCtx.createLinearGradient).toHaveBeenCalledTimes(2)
    })

    it('applies destination-in compositing for vertical fade mask', () => {
        createStreakTexture()
        expect(mockCtx.globalCompositeOperation).toBe('destination-in')
    })

    it('calls fillRect twice (main fill + mask)', () => {
        createStreakTexture()
        expect(mockCtx.fillRect).toHaveBeenCalledTimes(2)
    })
})

describe('createDustTexture', () => {
    it('defaults to 32x32 canvas', () => {
        createDustTexture()
        const canvas = document.createElement.mock.results.at(-1).value
        expect(canvas.width).toBe(32)
        expect(canvas.height).toBe(32)
    })

    it('uses radial gradient with 3 opacity stops', () => {
        createDustTexture()
        expect(mockCtx.createRadialGradient).toHaveBeenCalledOnce()
        const gradient = mockCtx.createRadialGradient.mock.results[0].value
        expect(gradient.addColorStop).toHaveBeenCalledTimes(3)
    })

    it('returns a texture with needsUpdate = true', () => {
        const tex = createDustTexture(16)
        expect(tex.needsUpdate).toBe(true)
    })
})
