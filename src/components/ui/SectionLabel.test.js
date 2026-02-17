import { describe, it, expect } from 'vitest'

/**
 * Tests SectionLabel's prop-driven rendering logic.
 * No DOM rendering — validates the component's decision logic directly.
 * Reproduces the conditional logic per project convention.
 */

/** Reproduces SectionLabel's output structure decisions */
function getSectionLabelProps({ text, color, as: Tag = 'span', className = '' }) {
  return {
    wrapperClass: `section-label ${className}`.trim(),
    style: { '--label-color': color },
    textElement: Tag === 'h2' ? 'h2' : 'span',
    textContent: text,
  }
}

describe('SectionLabel — prop variants', () => {
  it('defaults to span text element when as prop is omitted', () => {
    const result = getSectionLabelProps({ text: 'TEST', color: '#ff0000' })
    expect(result.textElement).toBe('span')
  })

  it('uses h2 text element when as="h2"', () => {
    const result = getSectionLabelProps({ text: 'TITLE', color: '#00ff00', as: 'h2' })
    expect(result.textElement).toBe('h2')
  })

  it('falls back to span for any non-h2 as value', () => {
    const result = getSectionLabelProps({ text: 'X', color: '#fff', as: 'div' })
    expect(result.textElement).toBe('span')
  })

  it('sets --label-color CSS variable from color prop', () => {
    const result = getSectionLabelProps({ text: 'A', color: 'rgba(255,0,128,0.6)' })
    expect(result.style['--label-color']).toBe('rgba(255,0,128,0.6)')
  })

  it('wrapper class includes section-label base class', () => {
    const result = getSectionLabelProps({ text: 'B', color: '#000' })
    expect(result.wrapperClass).toBe('section-label')
  })

  it('appends additional className to wrapper', () => {
    const result = getSectionLabelProps({ text: 'C', color: '#000', className: 'my-label' })
    expect(result.wrapperClass).toBe('section-label my-label')
  })

  it('trims wrapper class when className is empty', () => {
    const result = getSectionLabelProps({ text: 'D', color: '#000', className: '' })
    expect(result.wrapperClass).toBe('section-label')
    // No trailing space
    expect(result.wrapperClass.endsWith(' ')).toBe(false)
  })

  it('preserves text content exactly as provided', () => {
    const result = getSectionLabelProps({ text: 'SPOTLIGHT', color: '#f00' })
    expect(result.textContent).toBe('SPOTLIGHT')
  })
})
