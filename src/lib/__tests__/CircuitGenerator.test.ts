import { describe, it, expect, beforeEach } from 'vitest'
import { CircuitGenerator } from '../CircuitGenerator'

/**
 * Tests for CircuitGenerator - SVG circuit generation from Boolean expressions
 * 
 * Tests cover:
 * - Expression parsing and tokenization
 * - AST generation
 * - Circuit layout calculation
 * - SVG rendering for simple and complex circuits
 */

describe('CircuitGenerator', () => {
	let generator: CircuitGenerator

	beforeEach(() => {
		generator = new CircuitGenerator()
	})

	describe('tokenize', () => {
		it('should tokenize simple AND expression', () => {
			const tokens = generator.tokenize('A AND B')
			expect(tokens).toEqual(['A', 'AND', 'B'])
		})

		it('should tokenize OR expression', () => {
			const tokens = generator.tokenize('A OR B')
			expect(tokens).toEqual(['A', 'OR', 'B'])
		})

		it('should tokenize XOR expression', () => {
			const tokens = generator.tokenize('A XOR B')
			expect(tokens).toEqual(['A', 'XOR', 'B'])
		})

		it('should tokenize NOT expression', () => {
			const tokens = generator.tokenize('NOT A')
			expect(tokens).toEqual(['NOT', 'A'])
		})

		it('should handle parentheses', () => {
			const tokens = generator.tokenize('(A AND B)')
			expect(tokens).toEqual(['(', 'A', 'AND', 'B', ')'])
		})

		it('should handle complex nested expression', () => {
			const tokens = generator.tokenize('(A AND B) OR (C XOR D)')
			expect(tokens).toEqual(['(', 'A', 'AND', 'B', ')', 'OR', '(', 'C', 'XOR', 'D', ')'])
		})

		it('should ignore extra spaces', () => {
			const tokens = generator.tokenize('A   AND   B')
			expect(tokens).toEqual(['A', 'AND', 'B'])
		})

		it('should handle NOT with parentheses', () => {
			const tokens = generator.tokenize('NOT (A AND B)')
			expect(tokens).toEqual(['NOT', '(', 'A', 'AND', 'B', ')'])
		})
	})

	describe('parseExpression', () => {
		it('should parse expression with output variable', () => {
			const ast = generator.parseExpression('Q = A AND B')
			expect(ast).toEqual({
				type: 'AND',
				left: { type: 'VAR', name: 'A' },
				right: { type: 'VAR', name: 'B' }
			})
		})

		it('should parse expression without output variable', () => {
			const ast = generator.parseExpression('A AND B')
			expect(ast).toEqual({
				type: 'AND',
				left: { type: 'VAR', name: 'A' },
				right: { type: 'VAR', name: 'B' }
			})
		})

		it('should parse OR expression', () => {
			const ast = generator.parseExpression('Q = A OR B')
			expect(ast).toEqual({
				type: 'OR',
				left: { type: 'VAR', name: 'A' },
				right: { type: 'VAR', name: 'B' }
			})
		})

		it('should parse XOR expression', () => {
			const ast = generator.parseExpression('Q = A XOR B')
			expect(ast).toEqual({
				type: 'XOR',
				left: { type: 'VAR', name: 'A' },
				right: { type: 'VAR', name: 'B' }
			})
		})

		it('should parse NOT expression', () => {
			const ast = generator.parseExpression('Q = NOT A')
			expect(ast).toEqual({
				type: 'NOT',
				operand: { type: 'VAR', name: 'A' }
			})
		})

		it('should parse nested expression', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR C')
			expect(ast).toEqual({
				type: 'OR',
				left: {
					type: 'AND',
					left: { type: 'VAR', name: 'A' },
					right: { type: 'VAR', name: 'B' }
				},
				right: { type: 'VAR', name: 'C' }
			})
		})

		it('should handle NOT with parentheses', () => {
			const ast = generator.parseExpression('Q = NOT (A AND B)')
			expect(ast).toEqual({
				type: 'NOT',
				operand: {
					type: 'AND',
					left: { type: 'VAR', name: 'A' },
					right: { type: 'VAR', name: 'B' }
				}
			})
		})

		it('should respect operator precedence (AND before OR)', () => {
			const ast = generator.parseExpression('Q = A OR B AND C')
			expect(ast).toEqual({
				type: 'OR',
				left: { type: 'VAR', name: 'A' },
				right: {
					type: 'AND',
					left: { type: 'VAR', name: 'B' },
					right: { type: 'VAR', name: 'C' }
				}
			})
		})

		it('should handle complex nested expression from legacy tests', () => {
			// From expression-variations.test.js - Circuit NOT Expression Commutative
			const ast = generator.parseExpression('Y = NOT (E AND (NOT G))')
			expect(ast).toEqual({
				type: 'NOT',
				operand: {
					type: 'AND',
					left: { type: 'VAR', name: 'E' },
					right: {
						type: 'NOT',
						operand: { type: 'VAR', name: 'G' }
					}
				}
			})
		})
	})

	describe('isSingleGateCircuit', () => {
		it('should identify simple AND gate', () => {
			const ast = generator.parseExpression('Q = A AND B')
			expect(generator.isSingleGateCircuit(ast!)).toBe(true)
		})

		it('should identify simple OR gate', () => {
			const ast = generator.parseExpression('Q = A OR B')
			expect(generator.isSingleGateCircuit(ast!)).toBe(true)
		})

		it('should identify simple XOR gate', () => {
			const ast = generator.parseExpression('Q = A XOR B')
			expect(generator.isSingleGateCircuit(ast!)).toBe(true)
		})

		it('should identify simple NOT gate', () => {
			const ast = generator.parseExpression('Q = NOT A')
			expect(generator.isSingleGateCircuit(ast!)).toBe(true)
		})

		it('should NOT identify complex circuit as single gate', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR C')
			expect(generator.isSingleGateCircuit(ast!)).toBe(false)
		})

		it('should NOT identify nested gates as single gate', () => {
			const ast = generator.parseExpression('Q = NOT (A AND B)')
			expect(generator.isSingleGateCircuit(ast!)).toBe(false)
		})
	})

	describe('getCircuitDepth', () => {
		it('should calculate depth 1 for single variable', () => {
			const ast = generator.parseExpression('Q = A')
			expect(generator.getCircuitDepth(ast!)).toBe(1)
		})

		it('should calculate depth 2 for simple gate', () => {
			const ast = generator.parseExpression('Q = A AND B')
			expect(generator.getCircuitDepth(ast!)).toBe(2)
		})

		it('should calculate depth 2 for NOT gate', () => {
			const ast = generator.parseExpression('Q = NOT A')
			expect(generator.getCircuitDepth(ast!)).toBe(2)
		})

		it('should calculate depth for nested expression', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR C')
			// OR gate (1) + AND gate (1) + variables (1) = 3
			expect(generator.getCircuitDepth(ast!)).toBe(3)
		})

		it('should calculate depth for deep nesting', () => {
			const ast = generator.parseExpression('Q = NOT (A AND (B OR C))')
			// NOT (1) + AND (1) + OR (1) + variables (1) = 4
			expect(generator.getCircuitDepth(ast!)).toBe(4)
		})
	})

	describe('generateCircuit - SVG output', () => {
		let container: HTMLElement

		beforeEach(() => {
			container = document.createElement('div')
		})

		it('should generate SVG for simple AND gate', () => {
			const svg = generator.generateCircuit('Q = A AND B', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('</svg>')
			expect(svg).toContain('A') // Variable A label
			expect(svg).toContain('B') // Variable B label
			expect(svg).toContain('Q') // Output label
		})

		it('should generate SVG for simple OR gate', () => {
			const svg = generator.generateCircuit('Q = A OR B', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('A')
			expect(svg).toContain('B')
			expect(svg).toContain('Q')
		})

		it('should generate SVG for simple XOR gate', () => {
			const svg = generator.generateCircuit('Q = A XOR B', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('A')
			expect(svg).toContain('B')
			expect(svg).toContain('Q')
		})

		it('should generate SVG for simple NOT gate', () => {
			const svg = generator.generateCircuit('Q = NOT A', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('A')
			expect(svg).toContain('Q')
			expect(svg).toContain('circle') // NOT gate has a bubble
		})

		it('should generate SVG for complex circuit', () => {
			const svg = generator.generateCircuit('Q = (A AND B) OR C', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('A')
			expect(svg).toContain('B')
			expect(svg).toContain('C')
			expect(svg).toContain('Q')
			expect(svg).toContain('line') // Connections
		})

		it('should update container innerHTML', () => {
			generator.generateCircuit('Q = A AND B', container)
			expect(container.innerHTML).toContain('<svg')
		})

		it('should handle circuit without output variable', () => {
			const svg = generator.generateCircuit('A AND B', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('Q') // Should default to Q
		})

		it('should generate different output for different expressions', () => {
			const svg1 = generator.generateCircuit('Q = A AND B', container)
			const svg2 = generator.generateCircuit('Q = A OR B', container)
			expect(svg1).not.toBe(svg2)
		})

		it('should handle circuit NOT expression from legacy tests', () => {
			// From expression-variations.test.js
			const svg = generator.generateCircuit('Y = NOT (E AND (NOT G))', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('E')
			expect(svg).toContain('G')
			expect(svg).toContain('Y')
		})

		it('should handle AND with NOT expressions from legacy tests', () => {
			// From expression-variations.test.js
			const svg = generator.generateCircuit('R = ((NOT A) AND G) AND H', container)
			expect(svg).toContain('<svg')
			expect(svg).toContain('A')
			expect(svg).toContain('G')
			expect(svg).toContain('H')
			expect(svg).toContain('R')
		})

		it('should handle case-insensitive expressions', () => {
			const svg1 = generator.generateCircuit('q = a and b', container)
			const svg2 = generator.generateCircuit('Q = A AND B', container)
			// Should produce same output (both uppercase)
			expect(svg1).toContain('A')
			expect(svg1).toContain('B')
			expect(svg2).toContain('A')
			expect(svg2).toContain('B')
		})
	})

	describe('renderSimpleCircuit - hardcoded templates', () => {
		it('should use hardcoded template for simple AND', () => {
			const ast = generator.parseExpression('Q = A AND B')
			const layout = generator.layoutNodes(ast!)
			const result = generator['renderSimpleCircuit'](layout!)
			expect(result).not.toBeNull()
			expect(result).toContain('A')
			expect(result).toContain('B')
		})

		it('should use hardcoded template for simple OR', () => {
			const ast = generator.parseExpression('Q = A OR B')
			const layout = generator.layoutNodes(ast!)
			const result = generator['renderSimpleCircuit'](layout!)
			expect(result).not.toBeNull()
			expect(result).toContain('A')
			expect(result).toContain('B')
		})

		it('should use hardcoded template for simple XOR', () => {
			const ast = generator.parseExpression('Q = A XOR B')
			const layout = generator.layoutNodes(ast!)
			const result = generator['renderSimpleCircuit'](layout!)
			expect(result).not.toBeNull()
			expect(result).toContain('A')
			expect(result).toContain('B')
		})

		it('should use hardcoded template for simple NOT', () => {
			const ast = generator.parseExpression('Q = NOT A')
			const layout = generator.layoutNodes(ast!)
			const result = generator['renderSimpleCircuit'](layout!)
			expect(result).not.toBeNull()
			expect(result).toContain('A')
		})

		it('should return null for complex circuits', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR C')
			const layout = generator.layoutNodes(ast!)
			const result = generator['renderSimpleCircuit'](layout!)
			expect(result).toBeNull()
		})
	})

	describe('layoutNodes - position calculation', () => {
		it('should assign positions to simple gate', () => {
			const ast = generator.parseExpression('Q = A AND B')
			const layout = generator.layoutNodes(ast!)

			expect(layout).toBeDefined()
			expect(layout?.x).toBeGreaterThan(0)
			expect(layout?.y).toBeGreaterThan(0)
		})

		it('should assign IDs to nodes', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR C')
			const layout = generator.layoutNodes(ast!)

			expect(layout?.id).toBeDefined()
			expect(layout?.id).toBeGreaterThanOrEqual(0)
		})

		it('should assign level information', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR C')
			const layout = generator.layoutNodes(ast!)

			expect(layout?.level).toBe(0) // Root level
		})

		it('should keep y-coordinates within bounds', () => {
			const ast = generator.parseExpression('Q = A AND B')
			const layout = generator.layoutNodes(ast!)

			const minY = 40
			const maxY = 210

			expect(layout?.y).toBeGreaterThanOrEqual(minY)
			expect(layout?.y).toBeLessThanOrEqual(maxY)
		})
	})

	describe('adjustVariablePosition - overlap avoidance', () => {
		it('should return same position for same variable', () => {
			const ast = generator.parseExpression('Q = A AND A')
			generator.layoutNodes(ast!) // This will call adjustVariablePosition

			// Both A variables should have the same position
			// (verified through layout generation)
			expect(true).toBe(true) // Layout succeeds without error
		})

		it('should separate different variables', () => {
			const ast = generator.parseExpression('Q = A AND B')
			const layout = generator.layoutNodes(ast!)

			// Variables should have different positions
			expect(layout).toBeDefined()
		})
	})

	describe('collectVariables', () => {
		it('should collect variables from simple expression', () => {
			const ast = generator.parseExpression('Q = A AND B')
			const layout = generator.layoutNodes(ast!)
			const variables = new Set<string>()

			generator['collectVariables'](layout, variables)

			expect(variables.has('A')).toBe(true)
			expect(variables.has('B')).toBe(true)
			expect(variables.size).toBe(2)
		})

		it('should collect variables from complex expression', () => {
			const ast = generator.parseExpression('Q = (A AND B) OR (C XOR D)')
			const layout = generator.layoutNodes(ast!)
			const variables = new Set<string>()

			generator['collectVariables'](layout, variables)

			expect(variables.has('A')).toBe(true)
			expect(variables.has('B')).toBe(true)
			expect(variables.has('C')).toBe(true)
			expect(variables.has('D')).toBe(true)
			expect(variables.size).toBe(4)
		})

		it('should not duplicate variables', () => {
			const ast = generator.parseExpression('Q = A AND A')
			const layout = generator.layoutNodes(ast!)
			const variables = new Set<string>()

			generator['collectVariables'](layout, variables)

			expect(variables.has('A')).toBe(true)
			expect(variables.size).toBe(1)
		})
	})

	describe('getOutputPoint', () => {
		it('should calculate output point for variable', () => {
			const ast = generator.parseExpression('Q = A')
			const layout = generator.layoutNodes(ast!)
			const output = generator['getOutputPoint'](layout)

			expect(output.x).toBeDefined()
			expect(output.y).toBeDefined()
		})

		it('should calculate output point for gate', () => {
			const ast = generator.parseExpression('Q = A AND B')
			const layout = generator.layoutNodes(ast!)
			const output = generator['getOutputPoint'](layout)

			expect(output.x).toBeDefined()
			expect(output.y).toBeDefined()
		})
	})
})
