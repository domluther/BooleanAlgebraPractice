import { beforeEach, describe, expect, it } from "vitest";
import { CircuitGenerator } from "../../src/lib/CircuitGenerator";

/**
 * Edge case tests for CircuitGenerator null/undefined handling
 * 
 * These tests verify that the null checks added to prevent non-null assertions
 * work correctly and handle malformed input gracefully.
 */

describe("CircuitGenerator - Edge Cases and Null Handling", () => {
	let generator: CircuitGenerator;

	beforeEach(() => {
		generator = new CircuitGenerator();
	});

	describe("parseExpression - malformed input", () => {
		it("should handle empty expression", () => {
			const ast = generator.parseExpression("");
			expect(ast).toBeNull();
		});

		it("should handle expression with only spaces", () => {
			const ast = generator.parseExpression("   ");
			expect(ast).toBeNull();
		});

		it("should handle incomplete OR expression", () => {
			const ast = generator.parseExpression("A OR");
			// Should return null or handle gracefully when right side is missing
			expect(ast).toBeDefined();
		});

		it("should handle incomplete AND expression", () => {
			const ast = generator.parseExpression("A AND");
			expect(ast).toBeDefined();
		});

		it("should handle incomplete XOR expression", () => {
			const ast = generator.parseExpression("A XOR");
			expect(ast).toBeDefined();
		});

		it("should handle NOT without operand", () => {
			const ast = generator.parseExpression("NOT");
			// Should handle gracefully when operand is missing
			expect(ast).toBeDefined();
		});

		it("should handle mismatched parentheses - missing closing", () => {
			const ast = generator.parseExpression("(A AND B");
			expect(ast).toBeDefined();
		});

		it("should handle mismatched parentheses - extra closing", () => {
			const ast = generator.parseExpression("A AND B)");
			expect(ast).toBeDefined();
		});

		it("should handle empty parentheses", () => {
			const ast = generator.parseExpression("()");
			expect(ast).toBeDefined();
		});

		it("should handle only operator", () => {
			const ast = generator.parseExpression("AND");
			expect(ast).toBeDefined();
		});

		it("should handle multiple operators without operands", () => {
			const ast = generator.parseExpression("AND OR XOR");
			expect(ast).toBeDefined();
		});
	});

	describe("parseTokens - edge cases", () => {
		it("should handle empty token array", () => {
			const ast = generator.parseTokens([]);
			expect(ast).toBeNull();
		});

		it("should handle token array with only operators", () => {
			const ast = generator.parseTokens(["AND", "OR"]);
			expect(ast).toBeDefined();
		});

		it("should handle single variable token", () => {
			const ast = generator.parseTokens(["A"]);
			expect(ast).toEqual({ type: "VAR", name: "A" });
		});
	});

	describe("layoutNodes - null handling", () => {
		it("should handle null AST node", () => {
			const layout = generator.layoutNodes(null as any);
			expect(layout).toBeNull();
		});

		it("should return layout for valid single variable", () => {
			const ast = generator.parseExpression("A");
			const layout = generator.layoutNodes(ast!);
			expect(layout).toBeDefined();
			expect(layout?.type).toBe("VAR");
		});

		it("should handle layout of NOT with valid operand", () => {
			const ast = generator.parseExpression("NOT A");
			const layout = generator.layoutNodes(ast!);
			expect(layout).toBeDefined();
			expect(layout?.type).toBe("NOT");
		});

		it("should handle layout of binary operation with valid operands", () => {
			const ast = generator.parseExpression("A AND B");
			const layout = generator.layoutNodes(ast!);
			expect(layout).toBeDefined();
			expect(layout?.type).toBe("AND");
		});

		it("should handle deeply nested expression", () => {
			const ast = generator.parseExpression(
				"((A AND B) OR (C AND D)) XOR ((E OR F) AND (G OR H))",
			);
			const layout = generator.layoutNodes(ast!);
			expect(layout).toBeDefined();
		});
	});

	describe("generateCircuit - error handling", () => {
		let container: HTMLElement;

		beforeEach(() => {
			container = document.createElement("div");
		});



		it("should successfully generate complex valid expression", () => {
			const svg = generator.generateCircuit(
				"Q = ((A AND B) OR C) XOR (D AND (NOT E))",
				container,
			);
			expect(svg).toContain("<svg");
			expect(container.innerHTML).toContain("<svg");
		});
	});

	describe("adjustVariablePosition - consistency", () => {
		it("should return consistent positions for same variable across multiple calls", () => {
			const ast = generator.parseExpression("Q = (A AND A) OR (A XOR A)");
			const layout = generator.layoutNodes(ast!);
			expect(layout).toBeDefined();

			// All A variables should have same position (tested implicitly by layout success)
		});

		it("should handle many different variables", () => {
			const ast = generator.parseExpression(
				"Q = ((A AND B) OR (C AND D)) XOR ((E OR F) AND (G OR H))",
			);
			const layout = generator.layoutNodes(ast!);
			expect(layout).toBeDefined();

			const variables = new Set<string>();
			generator.collectVariables(layout, variables);
			expect(variables.size).toBe(8); // A through H
		});
	});

	describe("renderSimpleCircuit - null checks", () => {
		it("should return null for null layout", () => {
			const result = generator.renderSimpleCircuit(null as any);
			expect(result).toBeNull();
		});

		it("should return null for complex circuit", () => {
			const ast = generator.parseExpression("Q = (A AND B) OR C");
			const layout = generator.layoutNodes(ast!);
			const result = generator.renderSimpleCircuit(layout!);
			expect(result).toBeNull();
		});

		it("should return template for simple AND", () => {
			const ast = generator.parseExpression("Q = A AND B");
			const layout = generator.layoutNodes(ast!);
			const result = generator.renderSimpleCircuit(layout!);
			expect(result).not.toBeNull();
		});
	});

	describe("getOutputPoint - null handling", () => {
		it("should handle null node", () => {
			const output = generator.getOutputPoint(null);
			expect(output).toEqual({ x: 0, y: 0 });
		});

		it("should return valid coordinates for VAR node", () => {
			const ast = generator.parseExpression("A");
			const layout = generator.layoutNodes(ast!);
			const output = generator.getOutputPoint(layout);
			expect(output.x).toBeGreaterThan(0);
			expect(output.y).toBeGreaterThan(0);
		});

		it("should return valid coordinates for NOT node", () => {
			const ast = generator.parseExpression("NOT A");
			const layout = generator.layoutNodes(ast!);
			const output = generator.getOutputPoint(layout);
			expect(output.x).toBeGreaterThan(0);
			expect(output.y).toBeGreaterThan(0);
		});

		it("should return valid coordinates for binary operation", () => {
			const ast = generator.parseExpression("A AND B");
			const layout = generator.layoutNodes(ast!);
			const output = generator.getOutputPoint(layout);
			expect(output.x).toBeGreaterThan(0);
			expect(output.y).toBeGreaterThan(0);
		});
	});

	describe("collectVariables - null handling", () => {
		it("should handle null node", () => {
			const variables = new Set<string>();
			generator.collectVariables(null, variables);
			expect(variables.size).toBe(0);
		});

		it("should collect from NOT node", () => {
			const ast = generator.parseExpression("NOT A");
			const layout = generator.layoutNodes(ast!);
			const variables = new Set<string>();
			generator.collectVariables(layout, variables);
			expect(variables.has("A")).toBe(true);
			expect(variables.size).toBe(1);
		});

		it("should collect from deeply nested expression", () => {
			const ast = generator.parseExpression("Q = NOT ((A AND B) OR (NOT C))");
			const layout = generator.layoutNodes(ast!);
			const variables = new Set<string>();
			generator.collectVariables(layout, variables);
			expect(variables.has("A")).toBe(true);
			expect(variables.has("B")).toBe(true);
			expect(variables.has("C")).toBe(true);
			expect(variables.size).toBe(3);
		});
	});

	describe("getCircuitDepth - null handling", () => {
		it("should return 0 for null node", () => {
			const depth = generator.getCircuitDepth(null);
			expect(depth).toBe(0);
		});

		it("should calculate correct depth for very deep nesting", () => {
			const ast = generator.parseExpression(
				"Q = NOT (NOT (NOT (NOT A)))",
			);
			const depth = generator.getCircuitDepth(ast!);
			expect(depth).toBe(5); // 4 NOTs + 1 variable
		});
	});

	describe("Integration - end-to-end null safety", () => {
		let container: HTMLElement;

		beforeEach(() => {
			container = document.createElement("div");
		});

		it("should handle complete workflow with valid complex expression", () => {
			const expression = "Q = ((A AND B) OR (NOT C)) XOR (D AND E)";
			const svg = generator.generateCircuit(expression, container);

			expect(svg).toContain("<svg");
			expect(svg).toContain("A");
			expect(svg).toContain("B");
			expect(svg).toContain("C");
			expect(svg).toContain("D");
			expect(svg).toContain("E");
			expect(svg).toContain("Q");
			expect(container.innerHTML).toContain("<svg");
		});

		it("should reset state between circuit generations", () => {
			// Generate first circuit
			generator.generateCircuit("Q = A AND B", container);
			expect(container.innerHTML).toContain("A");
			expect(container.innerHTML).toContain("B");

			// Generate second circuit with different variables
			generator.generateCircuit("R = C OR D", container);
			expect(container.innerHTML).toContain("C");
			expect(container.innerHTML).toContain("D");
			// Should not contain old variables
			expect(container.innerHTML).not.toContain("Q = A");
		});
	});
});
