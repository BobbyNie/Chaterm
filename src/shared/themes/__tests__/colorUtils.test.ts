import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, rgba, mix, lighten, darken } from '../colorUtils'

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('converts 3-digit shorthand hex to RGB', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 })
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('handles hex without hash prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('f00')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('handles mixed case hex', () => {
      expect(hexToRgb('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239 })
    })

    it('handles black and white', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    })
  })

  describe('rgbToHex', () => {
    it('converts RGB to hex string', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
      expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00')
      expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff')
    })

    it('clamps values to 0-255 range', () => {
      expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000')
      expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000')
    })

    it('rounds fractional values', () => {
      expect(rgbToHex({ r: 127.5, g: 128.4, b: 128.6 })).toBe('#808081')
    })

    it('pads single digit hex values', () => {
      expect(rgbToHex({ r: 0, g: 15, b: 1 })).toBe('#000f01')
    })
  })

  describe('rgba', () => {
    it('returns rgba string with specified alpha', () => {
      expect(rgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
      expect(rgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)')
      expect(rgba('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)')
    })

    it('handles 3-digit hex', () => {
      expect(rgba('#f00', 0.8)).toBe('rgba(255, 0, 0, 0.8)')
    })
  })

  describe('mix', () => {
    it('returns pure color A when ratio is 0', () => {
      expect(mix('#ff0000', '#0000ff', 0)).toBe('#ff0000')
    })

    it('returns pure color B when ratio is 1', () => {
      expect(mix('#ff0000', '#0000ff', 1)).toBe('#0000ff')
    })

    it('returns 50/50 blend when ratio is 0.5', () => {
      const result = mix('#000000', '#ffffff', 0.5)
      expect(result).toBe('#808080')
    })

    it('blends red and blue to purple', () => {
      const result = mix('#ff0000', '#0000ff', 0.5)
      expect(result).toBe('#800080')
    })

    it('handles small ratios correctly', () => {
      const result = mix('#000000', '#ffffff', 0.1)
      const { r } = { r: parseInt(result.slice(1, 3), 16) }
      expect(r).toBeCloseTo(26, -1)
    })
  })

  describe('lighten', () => {
    it('returns original color when amount is 0', () => {
      expect(lighten('#ff0000', 0)).toBe('#ff0000')
    })

    it('returns white when amount is 1', () => {
      expect(lighten('#ff0000', 1)).toBe('#ffffff')
    })

    it('lightens black toward white', () => {
      expect(lighten('#000000', 0.5)).toBe('#808080')
    })

    it('lightens a dark color partially', () => {
      const result = lighten('#333333', 0.5)
      expect(result).toBe('#999999')
    })
  })

  describe('darken', () => {
    it('returns original color when amount is 0', () => {
      expect(darken('#ff0000', 0)).toBe('#ff0000')
    })

    it('returns black when amount is 1', () => {
      expect(darken('#ffffff', 1)).toBe('#000000')
    })

    it('darkens white toward black', () => {
      expect(darken('#ffffff', 0.5)).toBe('#808080')
    })

    it('darkens a light color partially', () => {
      const result = darken('#cccccc', 0.5)
      expect(result).toBe('#666666')
    })
  })

  describe('round-trip: hexToRgb -> rgbToHex', () => {
    it('preserves color values through conversion', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#abcdef', '#123456', '#000000', '#ffffff']
      for (const hex of colors) {
        expect(rgbToHex(hexToRgb(hex))).toBe(hex)
      }
    })
  })
})
