import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { updateFresnelMaterial, createRimGlowMaterial } from './useFresnelMaterial.js'

describe('updateFresnelMaterial', () => {
    it('updates uTime uniform on a valid material', () => {
        const material = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } }
        })
        updateFresnelMaterial(material, 5.5)
        expect(material.uniforms.uTime.value).toBe(5.5)
    })

    it('handles null/undefined material without throwing', () => {
        expect(() => updateFresnelMaterial(null, 1)).not.toThrow()
        expect(() => updateFresnelMaterial(undefined, 1)).not.toThrow()
    })

    it('handles material without uniforms without throwing', () => {
        expect(() => updateFresnelMaterial({}, 1)).not.toThrow()
        expect(() => updateFresnelMaterial({ uniforms: {} }, 1)).not.toThrow()
    })
})

describe('createRimGlowMaterial', () => {
    it('creates a ShaderMaterial with correct defaults', () => {
        const mat = createRimGlowMaterial()
        expect(mat).toBeInstanceOf(THREE.ShaderMaterial)
        expect(mat.transparent).toBe(true)
        expect(mat.depthWrite).toBe(false)
        expect(mat.blending).toBe(THREE.AdditiveBlending)
        expect(mat.side).toBe(THREE.BackSide)
    })

    it('sets uniforms from parameters', () => {
        const mat = createRimGlowMaterial('#ff0000', 5, 2.5)
        expect(mat.uniforms.uRimColor.value).toBeInstanceOf(THREE.Color)
        expect(mat.uniforms.uRimPower.value).toBe(5)
        expect(mat.uniforms.uRimIntensity.value).toBe(2.5)
        expect(mat.uniforms.uTime.value).toBe(0)
    })

    it('initializes uTime at 0 and responds to updateFresnelMaterial', () => {
        const mat = createRimGlowMaterial()
        expect(mat.uniforms.uTime.value).toBe(0)
        updateFresnelMaterial(mat, 3.14)
        expect(mat.uniforms.uTime.value).toBe(3.14)
    })

    it('contains vertex and fragment shaders', () => {
        const mat = createRimGlowMaterial()
        expect(mat.vertexShader).toContain('vNormal')
        expect(mat.fragmentShader).toContain('fresnel')
    })
})
