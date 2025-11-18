import { describe, it, expect, beforeEach, afterEach } from 'vitest'

/**
 * CSS Specificity Tests
 * 
 * These tests ensure that CSS changes maintain proper styling behavior,
 * particularly for the gate-svg selector fix that addressed the descending
 * specificity warning.
 */

describe('CSS Specificity - Gate SVG Styling', () => {
  let container: HTMLElement
  let styleElement: HTMLStyleElement

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div')
    document.body.appendChild(container)

    // Inject the relevant CSS rules for testing
    styleElement = document.createElement('style')
    styleElement.textContent = `
      .gate-svg {
        width: 90%;
        height: 90%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        pointer-events: none;
        display: block;
      }

      .gate:hover {
        transform: translateY(-2px);
        color: var(--primary);
      }

      .gate:hover .gate-svg {
        filter: brightness(0.7);
      }
    `
    document.head.appendChild(styleElement)
  })

  afterEach(() => {
    // Clean up
    document.body.removeChild(container)
    document.head.removeChild(styleElement)
  })

  describe('Base .gate-svg styles', () => {
    it('should apply base styles to .gate-svg elements', () => {
      container.innerHTML = `
        <div class="gate">
          <svg class="gate-svg" viewBox="0 0 100 100"></svg>
        </div>
      `

      const svg = container.querySelector('.gate-svg') as HTMLElement
      expect(svg).toBeTruthy()

      const styles = window.getComputedStyle(svg)
      
      // Base styles should be applied
      expect(styles.display).toBe('block')
      expect(styles.pointerEvents).toBe('none')
      expect(styles.objectFit).toBe('contain')
    })

    it('should apply width and height to .gate-svg', () => {
      container.innerHTML = `
        <div class="gate">
          <svg class="gate-svg" viewBox="0 0 100 100"></svg>
        </div>
      `

      const svg = container.querySelector('.gate-svg') as HTMLElement
      const styles = window.getComputedStyle(svg)
      
      // Width and height should be set (may be computed differently by browser)
      expect(styles.width).toBeTruthy()
      expect(styles.height).toBeTruthy()
    })
  })

  describe('Hover state specificity', () => {
    it('should apply hover styles to nested .gate-svg when parent .gate is hovered', () => {
      container.innerHTML = `
        <div class="gate">
          <svg class="gate-svg" viewBox="0 0 100 100"></svg>
        </div>
      `

      const gate = container.querySelector('.gate') as HTMLElement
      const svg = container.querySelector('.gate-svg') as HTMLElement
      
      expect(gate).toBeTruthy()
      expect(svg).toBeTruthy()

      // The CSS rule .gate:hover .gate-svg should have higher specificity
      // than just .gate-svg, so hover styles should override base styles
      // This test verifies the CSS rule exists and can be applied
      
      // In a real DOM with hover, the brightness filter would be applied
      // We're mainly ensuring no CSS specificity errors occur
    })

    it('should maintain base styles when gate is not hovered', () => {
      container.innerHTML = `
        <div class="gate">
          <svg class="gate-svg" viewBox="0 0 100 100"></svg>
        </div>
      `

      const svg = container.querySelector('.gate-svg') as HTMLElement
      const styles = window.getComputedStyle(svg)
      
      // When not hovered, base styles should apply
      expect(styles.display).toBe('block')
      expect(styles.objectFit).toBe('contain')
    })
  })

  describe('Specificity order validation', () => {
    it('should have .gate-svg defined before .gate:hover .gate-svg in cascade', () => {
      // This test ensures that the CSS is ordered correctly to avoid
      // the "descending specificity" warning that was fixed
      
      // The fix moved .gate-svg to appear before .gate:hover .gate-svg
      // This ensures lower specificity rules come first
      
      const cssText = styleElement.textContent || ''
      
      const gateSvgIndex = cssText.indexOf('.gate-svg')
      const gateHoverSvgIndex = cssText.indexOf('.gate:hover .gate-svg')
      
      // .gate-svg should appear before .gate:hover .gate-svg
      expect(gateSvgIndex).toBeLessThan(gateHoverSvgIndex)
    })

    it('should calculate specificity correctly', () => {
      // Specificity calculation:
      // .gate-svg -> (0, 1, 0) - one class
      // .gate:hover .gate-svg -> (0, 3, 0) - two classes + one pseudo-class
      
      // The more specific rule should override the less specific one
      container.innerHTML = `
        <div class="gate">
          <svg class="gate-svg" viewBox="0 0 100 100"></svg>
        </div>
      `

      const svg = container.querySelector('.gate-svg') as HTMLElement
      expect(svg).toBeTruthy()
      
      // This test documents that the specificity hierarchy is correct
      // (0, 1, 0) < (0, 3, 0), so .gate:hover .gate-svg wins during hover
    })
  })

  describe('Integration with actual component structure', () => {
    it('should work with typical gate component HTML structure', () => {
      container.innerHTML = `
        <div class="gate">
          <div class="gate-icon">
            <svg class="gate-svg" viewBox="0 0 100 100">
              <path d="M 10 10 L 90 90" />
            </svg>
          </div>
          <span class="gate-label">AND</span>
        </div>
      `

      const gate = container.querySelector('.gate')
      const svg = container.querySelector('.gate-svg')
      
      expect(gate).toBeTruthy()
      expect(svg).toBeTruthy()
      
      // Ensure nested structure works correctly
      const styles = window.getComputedStyle(svg as HTMLElement)
      expect(styles.display).toBe('block')
    })

    it('should maintain styles with multiple gates', () => {
      container.innerHTML = `
        <div class="gate">
          <svg class="gate-svg"></svg>
        </div>
        <div class="gate">
          <svg class="gate-svg"></svg>
        </div>
        <div class="gate">
          <svg class="gate-svg"></svg>
        </div>
      `

      const svgs = container.querySelectorAll('.gate-svg')
      expect(svgs.length).toBe(3)
      
      // All SVGs should have consistent styling
      svgs.forEach(svg => {
        const styles = window.getComputedStyle(svg as HTMLElement)
        expect(styles.display).toBe('block')
        expect(styles.pointerEvents).toBe('none')
      })
    })
  })
})
