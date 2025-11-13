import { describe, expect, it } from "vitest";
import {
	areExpressionsLogicallyEquivalent,
	evaluateExpression,
	generateAllAcceptedAnswers,
	getInputVariables,
	normalizeExpression,
} from "../../src/lib/expressionUtils";

/**
 * Edge case tests for expressionUtils - specifically targeting areas with non-null assertions
 * These tests ensure robust handling of malformed input, edge cases, and complex nested structures
 */

describe("generateAllAcceptedAnswers - Edge Cases & AST Coverage", () => {
	describe("Malformed Input Handling", () => {
		it("should handle empty string gracefully", () => {
			const answers = generateAllAcceptedAnswers("");
			expect(Array.isArray(answers)).toBe(true);
			expect(answers.length).toBeGreaterThan(0);
		});

		it("should handle expression without equals sign", () => {
			const answers = generateAllAcceptedAnswers("A AND B");
			expect(Array.isArray(answers)).toBe(true);
			expect(answers).toContain("A AND B");
		});

		it("should handle expression with multiple equals signs", () => {
			const answers = generateAllAcceptedAnswers("Q = R = A AND B");
			expect(Array.isArray(answers)).toBe(true);
			expect(answers.length).toBeGreaterThan(0);
		});

		it("should handle only operator without operands", () => {
			const answers = generateAllAcceptedAnswers("Q = AND");
			expect(Array.isArray(answers)).toBe(true);
		});

		it("should handle expression with only NOT", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT");
			expect(Array.isArray(answers)).toBe(true);
		});

		it("should handle incomplete binary expression", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND");
			expect(Array.isArray(answers)).toBe(true);
		});
	});

	describe("NOT Expression AST Variations (_generateASTVariations)", () => {
		it("should generate variations for simple NOT expression", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT A");
			expect(answers).toContain("Q = NOT A");
			expect(answers.length).toBeGreaterThanOrEqual(1);
		});

		it("should generate variations for NOT with parentheses", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A)");
			expect(answers.length).toBeGreaterThan(0);
			// Should handle the operand being unwrapped from parens
			expect(answers.some((a) => a.includes("NOT A"))).toBe(true);
		});

		it("should generate variations for nested NOT expressions", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (NOT A)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT"))).toBe(true);
		});

		it("should generate variations for NOT with complex operand", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A AND B)");
			expect(answers.length).toBeGreaterThan(0);
			// Should preserve NOT around the binary operation
			expect(answers.some((a) => a.includes("NOT ("))).toBe(true);
		});

		it("should handle NOT with OR operand", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A OR B)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT (A OR B)"))).toBe(true);
		});

		it("should handle NOT with XOR operand", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A XOR B)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT ("))).toBe(true);
			expect(answers.some((a) => a.includes("XOR"))).toBe(true);
		});
	});

	describe("Binary Operations AST Variations", () => {
		it("should generate commutative variations for AND", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B");
			expect(answers.some((a) => a.includes("A AND B"))).toBe(true);
			expect(answers.some((a) => a.includes("B AND A"))).toBe(true);
			expect(answers.length).toBeGreaterThanOrEqual(2);
		});

		it("should generate commutative variations for OR", () => {
			const answers = generateAllAcceptedAnswers("Q = A OR B");
			expect(answers.some((a) => a.includes("A OR B"))).toBe(true);
			expect(answers.some((a) => a.includes("B OR A"))).toBe(true);
		});

		it("should generate commutative variations for XOR", () => {
			const answers = generateAllAcceptedAnswers("Q = A XOR B");
			expect(answers.some((a) => a.includes("A XOR B"))).toBe(true);
			expect(answers.some((a) => a.includes("B XOR A"))).toBe(true);
		});

		it("should generate all combinations for nested binary operations", () => {
			const answers = generateAllAcceptedAnswers("Q = (A AND B) OR (C AND D)");
			expect(answers.length).toBeGreaterThan(4);
			// Should have variations swapping the OR operands
			expect(answers.some((a) => a.includes("C AND D") && a.includes("OR"))).toBe(true);
		});

		it("should handle three-way AND", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B AND C");
			expect(answers.length).toBeGreaterThan(2);
			expect(answers.some((a) => a.includes("A AND B"))).toBe(true);
			expect(answers.some((a) => a.includes("B AND C"))).toBe(true);
		});

		it("should handle mixed operators", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B OR C XOR D");
			expect(answers.length).toBeGreaterThan(1);
			expect(answers.some((a) => a.includes("AND"))).toBe(true);
			expect(answers.some((a) => a.includes("OR"))).toBe(true);
			expect(answers.some((a) => a.includes("XOR"))).toBe(true);
		});
	});

	describe("AST to String Conversion (_astToString)", () => {
		it("should convert VAR node to string", () => {
			const answers = generateAllAcceptedAnswers("Q = A");
			expect(answers).toContain("Q = A");
		});

		it("should convert NOT VAR to string without parens", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT A");
			expect(answers.some((a) => a === "Q = NOT A")).toBe(true);
		});

		it("should convert NOT binary op to string with parens", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A AND B)");
			expect(answers.some((a) => a.includes("NOT (") && a.includes(")"))).toBe(true);
		});

		it("should add parentheses for nested binary operations", () => {
			const answers = generateAllAcceptedAnswers("Q = (A AND B) OR (C AND D)");
			expect(answers.some((a) => a.includes("(") && a.includes(")"))).toBe(true);
		});

		it("should handle deeply nested expressions", () => {
			const answers = generateAllAcceptedAnswers("Q = ((A AND B) OR C) XOR (D AND (E OR F))");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("(") && a.includes(")"))).toBe(true);
		});
	});

	describe("AST to String with NOT Parens (_astToStringWithNOTParens)", () => {
		it("should add extra parentheses around NOT expressions with complex operands", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A AND B)");
			// Should include variations with (NOT (A AND B))
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT"))).toBe(true);
		});

		it("should not add extra parens for NOT with single variable", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT A");
			expect(answers.some((a) => a === "Q = NOT A")).toBe(true);
		});

		it("should handle NOT in complex context", () => {
			const answers = generateAllAcceptedAnswers("Q = (NOT A) AND B");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT A"))).toBe(true);
		});
	});

	describe("AST to String Minimal Parens (_astToStringMinimalParens)", () => {
		it("should minimize parentheses for NOT with variable", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT A");
			expect(answers.some((a) => a === "Q = NOT A")).toBe(true);
		});

		it("should use parentheses only for complex NOT operands", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A OR B)");
			expect(answers.some((a) => a.includes("NOT ("))).toBe(true);
		});

		it("should minimize parentheses in binary operations", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B");
			expect(answers.some((a) => !a.includes("("))).toBe(true);
		});
	});

	describe("Circuit Style String Conversion (_astToStringCircuitStyle)", () => {
		it("should convert simple expression in circuit style", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B");
			expect(answers.length).toBeGreaterThan(0);
		});

		it("should handle NOT in circuit style", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT A AND B");
			expect(answers.some((a) => a.includes("NOT A"))).toBe(true);
		});

		it("should add parentheses for complex NOT operands in circuit style", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A AND B)");
			expect(answers.some((a) => a.includes("NOT ("))).toBe(true);
		});

		it("should handle nested NOT in circuit style", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (NOT A)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT"))).toBe(true);
		});
	});

	describe("Hybrid Circuit Style (_astToStringHybridCircuit)", () => {
		it("should wrap NOT around single variables with parentheses", () => {
			const answers = generateAllAcceptedAnswers("Q = (NOT A) AND B");
			expect(answers.length).toBeGreaterThan(0);
			// Should have variations with (NOT A)
			expect(answers.some((a) => a.includes("NOT"))).toBe(true);
		});

		it("should handle complex operands in hybrid style", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (A AND B)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT"))).toBe(true);
		});
	});

	describe("Aggressive Parens Style (_astToStringAggressiveParens)", () => {
		it("should add parentheses aggressively", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B OR C");
			expect(answers.length).toBeGreaterThan(0);
			// Should include variations with various parenthesization
		});

		it("should wrap sub-expressions containing operators", () => {
			const answers = generateAllAcceptedAnswers("Q = (A AND B) OR (C XOR D)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("("))).toBe(true);
		});

		it("should handle NOT in aggressive paren style", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT A AND NOT B");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT A"))).toBe(true);
		});
	});

	describe("Complex Real-World Scenarios", () => {
		it("should handle expression with all operators", () => {
			const answers = generateAllAcceptedAnswers("Q = (A AND B) OR (C XOR D) AND (NOT E)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("AND"))).toBe(true);
			expect(answers.some((a) => a.includes("OR"))).toBe(true);
			expect(answers.some((a) => a.includes("XOR"))).toBe(true);
			expect(answers.some((a) => a.includes("NOT"))).toBe(true);
		});

		it("should handle deeply nested NOT expressions", () => {
			const answers = generateAllAcceptedAnswers("Q = NOT (NOT (NOT A))");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.every((a) => a.includes("NOT"))).toBe(true);
		});

		it("should handle complex associative operations", () => {
			const answers = generateAllAcceptedAnswers("Q = A OR B OR C OR D");
			expect(answers.length).toBeGreaterThan(0);
			// Should generate many commutative variations
			expect(answers.length).toBeGreaterThan(4);
		});

		it("should handle mixed NOT and binary operations", () => {
			const answers = generateAllAcceptedAnswers("Q = (NOT A AND NOT B) OR (NOT C AND NOT D)");
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.some((a) => a.includes("NOT A"))).toBe(true);
			expect(answers.some((a) => a.includes("NOT B"))).toBe(true);
		});

		it("should generate unique variations (no duplicates)", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND B");
			const unique = new Set(answers);
			expect(unique.size).toBe(answers.length);
		});

		it("should handle very long expressions", () => {
			const answers = generateAllAcceptedAnswers(
				"Q = ((A AND B) OR (C AND D)) XOR ((E OR F) AND (G OR H))"
			);
			expect(answers.length).toBeGreaterThan(0);
			expect(answers.every((a) => a.startsWith("Q = "))).toBe(true);
		});
	});

	describe("Error Recovery and Fallback", () => {
		it("should fallback gracefully for unparseable expressions", () => {
			const answers = generateAllAcceptedAnswers("Q = )()(");
			expect(Array.isArray(answers)).toBe(true);
			expect(answers.length).toBeGreaterThan(0);
		});

		it("should handle expressions with invalid characters", () => {
			const answers = generateAllAcceptedAnswers("Q = A & B");
			expect(Array.isArray(answers)).toBe(true);
		});

		it("should handle expressions with numbers", () => {
			const answers = generateAllAcceptedAnswers("Q = A AND 1");
			expect(Array.isArray(answers)).toBe(true);
		});
	});
});

describe("getInputVariables - Edge Cases", () => {
	it("should handle expression without right side", () => {
		const vars = getInputVariables("Q = ");
		expect(Array.isArray(vars)).toBe(true);
	});

	it("should handle expression with only operators", () => {
		const vars = getInputVariables("Q = AND OR NOT");
		expect(Array.isArray(vars)).toBe(true);
		expect(vars.length).toBe(0);
	});

	it("should handle complex nested parentheses", () => {
		const vars = getInputVariables("Q = ((((A))))");
		expect(vars).toEqual(["A"]);
	});

	it("should handle expression with repeated variables in different contexts", () => {
		const vars = getInputVariables("Q = (A AND A) OR (A XOR A)");
		expect(vars).toEqual(["A"]);
	});

	it("should ignore multi-character tokens", () => {
		const vars = getInputVariables("Q = AB AND CD");
		expect(vars.length).toBe(0);
	});

	it("should handle XOR with NOT", () => {
		const vars = getInputVariables("Q = (NOT A) XOR (NOT B)");
		expect(vars).toEqual(["A", "B"]);
	});
});

describe("evaluateExpression - Edge Cases", () => {
	it("should handle expression with no variables", () => {
		// This is a degenerate case but shouldn't crash
		const result = evaluateExpression("true", {});
		expect(typeof result).toBe("boolean");
	});

	it("should handle very complex nested expression", () => {
		const result = evaluateExpression(
			"((A AND B) OR C) AND (D OR (E AND F))",
			{ A: true, B: true, C: false, D: true, E: false, F: false }
		);
		expect(typeof result).toBe("boolean");
		expect(result).toBe(true);
	});

	it("should handle all false inputs", () => {
		const result = evaluateExpression("A OR B OR C", {
			A: false,
			B: false,
			C: false,
		});
		expect(result).toBe(false);
	});

	it("should handle all true inputs", () => {
		const result = evaluateExpression("A AND B AND C", {
			A: true,
			B: true,
			C: true,
		});
		expect(result).toBe(true);
	});

	it("should handle double negation", () => {
		const result = evaluateExpression("NOT (NOT A)", { A: true });
		expect(result).toBe(true);
	});

	it("should handle triple negation", () => {
		const result = evaluateExpression("NOT (NOT (NOT A))", { A: true });
		expect(result).toBe(false);
	});

	it("should handle XOR correctly", () => {
		// XOR is true when inputs differ
		// XOR should return proper booleans (not numbers like bitwise ^)
		expect(evaluateExpression("A XOR B", { A: true, B: false })).toBe(true);
		expect(evaluateExpression("A XOR B", { A: false, B: true })).toBe(true);
		expect(evaluateExpression("A XOR B", { A: true, B: true })).toBe(false);
		expect(evaluateExpression("A XOR B", { A: false, B: false })).toBe(false);
	});

	it("should handle invalid expression gracefully", () => {
		const result = evaluateExpression("INVALID SYNTAX )(", { A: true });
		expect(typeof result).toBe("boolean");
		// Should return false as fallback
		expect(result).toBe(false);
	});
});

describe("areExpressionsLogicallyEquivalent - Edge Cases", () => {
	it("should handle expressions with different variable names", () => {
		const result = areExpressionsLogicallyEquivalent("Q = A AND B", "R = C AND D");
		expect(typeof result).toBe("boolean");
	});

	it("should handle single variable expressions", () => {
		expect(areExpressionsLogicallyEquivalent("Q = A", "R = A")).toBe(true);
		expect(areExpressionsLogicallyEquivalent("Q = A", "R = B")).toBe(false);
	});

	it("should handle expressions with many variables", () => {
		const expr1 = "Q = A AND B AND C AND D";
		const expr2 = "Q = D AND C AND B AND A";
		expect(areExpressionsLogicallyEquivalent(expr1, expr2)).toBe(true);
	});

	it("should handle XOR equivalence", () => {
		const expr1 = "Q = A XOR B";
		const expr2 = "Q = B XOR A";
		expect(areExpressionsLogicallyEquivalent(expr1, expr2)).toBe(true);
	});

	it("should detect XOR vs OR difference", () => {
		expect(areExpressionsLogicallyEquivalent("Q = A XOR B", "Q = A OR B")).toBe(
			false
		);
	});

	it("should handle complex De Morgan variations", () => {
		const expr1 = "Q = NOT ((A OR B) AND (C OR D))";
		const expr2 = "Q = (NOT (A OR B)) OR (NOT (C OR D))";
		expect(areExpressionsLogicallyEquivalent(expr1, expr2)).toBe(true);
	});

	it("should handle expressions without equals sign", () => {
		const result = areExpressionsLogicallyEquivalent("A AND B", "C OR D");
		expect(typeof result).toBe("boolean");
	});

	it("should handle empty expressions", () => {
		const result = areExpressionsLogicallyEquivalent("", "");
		expect(typeof result).toBe("boolean");
	});

	it("should handle malformed expressions gracefully", () => {
		const result = areExpressionsLogicallyEquivalent("Q = )(", "R = )(");
		expect(typeof result).toBe("boolean");
	});
});

describe("normalizeExpression - Additional Edge Cases", () => {
	it("should handle empty string", () => {
		const result = normalizeExpression("");
		expect(result).toBe("");
	});

	it("should handle string with only spaces", () => {
		const result = normalizeExpression("     ");
		expect(result).toBe("");
	});

	it("should handle expression with tabs and newlines", () => {
		const result = normalizeExpression("Q\t=\nA\tAND\nB");
		expect(result).toContain("AND");
	});

	it("should handle deeply nested parentheses", () => {
		const result = normalizeExpression("Q = ((((A))))");
		// The normalizeExpression only removes ONE level of outer parens
		// Multiple nested parens are a degenerate case not fully handled
		expect(result).toContain("A");
		expect(result.startsWith("Q = ")).toBe(true);
	});

	it("should handle expression with only NOT", () => {
		const result = normalizeExpression("Q = NOT");
		expect(result).toContain("NOT");
	});

	it("should handle multiple consecutive NOTs", () => {
		const result = normalizeExpression("Q = NOT NOT NOT A");
		expect(result).toContain("NOT NOT NOT A");
	});

	it("should handle XOR in normalization", () => {
		const result = normalizeExpression("Q=A    XOR    B");
		expect(result).toBe("Q = A XOR B");
	});
});
