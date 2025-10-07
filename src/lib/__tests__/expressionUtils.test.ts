import { describe, it, expect } from "vitest";
import {
	normalizeExpression,
	generateAllAcceptedAnswers,
	getInputVariables,
	evaluateExpression,
	shuffleExpression,
	areExpressionsLogicallyEquivalent,
} from "../expressionUtils";

/**
 * Comprehensive tests for expression utility functions
 * Based on legacy/tests/normalization.test.js and legacy/tests/expression-variations.test.js
 */

describe("normalizeExpression", () => {
	describe("Space Normalization", () => {
		it("should normalize multiple spaces to single spaces", () => {
			const inputs = [
				"A = B   AND    C",
				"A=B AND C",
				"A = B AND C",
				"A  =  B  AND  C",
			];
			const expected = "A = B AND C";

			inputs.forEach((input) => {
				expect(normalizeExpression(input)).toBe(expected);
			});
		});
	});

	describe("Parentheses Normalization", () => {
		it("should normalize spaces around parentheses", () => {
			const inputs = [
				"A = ( B AND C )",
				"A = (B AND C)",
				"A = ( B AND C)",
				"A = (B AND C )",
			];
			const expected = "A = B AND C";

			inputs.forEach((input) => {
				expect(normalizeExpression(input)).toBe(expected);
			});
		});

		it("should remove outer parentheses around entire right-hand side", () => {
			expect(normalizeExpression("Q = ((A AND B) OR C)")).toBe(
				"Q = (A AND B) OR C",
			);
			expect(normalizeExpression("Q = (A AND B)")).toBe("Q = A AND B");
			expect(normalizeExpression("Q = (NOT A)")).toBe("Q = NOT A");
			expect(normalizeExpression("P = (A)")).toBe("P = A");
		});
	});

	describe("NOT Expression Normalization", () => {
		it("should remove double parentheses around NOT expressions", () => {
			expect(normalizeExpression("Y = F OR ((NOT D) AND G)")).toBe(
				"Y = F OR (NOT D AND G)",
			);
		});

		it("should normalize outer parentheses around NOT expressions", () => {
			expect(normalizeExpression("X = (NOT (A AND B))")).toBe(
				"X = NOT (A AND B)",
			);
		});

		it("should normalize various NOT expression formats", () => {
			const inputs = ["X = NOT (A AND B)", "X =NOT(A AND B)"];
			const expected = "X = NOT (A AND B)";

			inputs.forEach((input) => {
				expect(normalizeExpression(input)).toBe(expected);
			});
		});

		it("should handle complex NOT expressions with extra spaces", () => {
			expect(normalizeExpression("Z = ( NOT ( A AND B ) ) OR C")).toBe(
				"Z =(NOT (A AND B)) OR C",
			);
			expect(normalizeExpression("Z = (NOT (A AND B)) OR C")).toBe(
				"Z =(NOT (A AND B)) OR C",
			);
		});
	});

	describe("Operator Spacing", () => {
		it("should normalize equals sign spacing", () => {
			expect(normalizeExpression("A=B AND C")).toBe("A = B AND C");
		});

		it("should normalize operator spacing", () => {
			expect(normalizeExpression("A AND(B OR C)")).toBe("A AND (B OR C)");
		});

		it("should handle all operators (AND/OR/NOT/XOR)", () => {
			expect(normalizeExpression("A=B AND C OR D")).toBe("A = B AND C OR D");
			expect(normalizeExpression("A=NOT B")).toBe("A = NOT B");
			expect(normalizeExpression("A=B XOR C")).toBe("A = B XOR C");
		});
	});
});

describe("getInputVariables", () => {
	it("should extract single variable", () => {
		expect(getInputVariables("Q = A")).toEqual(["A"]);
	});

	it("should extract multiple variables from AND expression", () => {
		expect(getInputVariables("Q = A AND B")).toEqual(["A", "B"]);
	});

	it("should extract variables from complex expression", () => {
		expect(getInputVariables("Q = (A AND B) OR (C AND D)")).toEqual([
			"A",
			"B",
			"C",
			"D",
		]);
	});

	it("should handle NOT expressions", () => {
		expect(getInputVariables("Q = NOT A")).toEqual(["A"]);
		expect(getInputVariables("Q = (NOT A) AND B")).toEqual(["A", "B"]);
	});

	it("should return unique sorted variables", () => {
		expect(getInputVariables("Q = A AND B AND A")).toEqual(["A", "B"]);
		expect(getInputVariables("Q = C OR A OR B")).toEqual(["A", "B", "C"]);
	});

	it("should handle XOR expressions", () => {
		expect(getInputVariables("Q = A XOR B")).toEqual(["A", "B"]);
	});

	it("should ignore output variable", () => {
		expect(getInputVariables("P = A AND B")).toEqual(["A", "B"]);
		expect(getInputVariables("Q = A AND B")).toEqual(["A", "B"]);
	});
});

describe("evaluateExpression", () => {
	it("should evaluate simple AND expression", () => {
		expect(evaluateExpression("A AND B", { A: true, B: true })).toBe(true);
		expect(evaluateExpression("A AND B", { A: true, B: false })).toBe(false);
		expect(evaluateExpression("A AND B", { A: false, B: true })).toBe(false);
		expect(evaluateExpression("A AND B", { A: false, B: false })).toBe(false);
	});

	it("should evaluate simple OR expression", () => {
		expect(evaluateExpression("A OR B", { A: true, B: true })).toBe(true);
		expect(evaluateExpression("A OR B", { A: true, B: false })).toBe(true);
		expect(evaluateExpression("A OR B", { A: false, B: true })).toBe(true);
		expect(evaluateExpression("A OR B", { A: false, B: false })).toBe(false);
	});

	it("should evaluate NOT expression", () => {
		expect(evaluateExpression("NOT A", { A: true })).toBe(false);
		expect(evaluateExpression("NOT A", { A: false })).toBe(true);
	});

	it("should evaluate complex expression with parentheses", () => {
		expect(
			evaluateExpression("(A AND B) OR C", { A: true, B: true, C: false }),
		).toBe(true);
		expect(
			evaluateExpression("(A AND B) OR C", { A: false, B: true, C: false }),
		).toBe(false);
		expect(
			evaluateExpression("(A AND B) OR C", { A: false, B: false, C: true }),
		).toBe(true);
	});

	it("should evaluate NOT with complex expressions", () => {
		expect(evaluateExpression("NOT (A AND B)", { A: true, B: true })).toBe(
			false,
		);
		expect(evaluateExpression("NOT (A AND B)", { A: true, B: false })).toBe(
			true,
		);
	});

	it("should handle nested expressions", () => {
		expect(
			evaluateExpression("(A OR B) AND (C OR D)", {
				A: true,
				B: false,
				C: false,
				D: true,
			}),
		).toBe(true);
		expect(
			evaluateExpression("(A OR B) AND (C OR D)", {
				A: false,
				B: false,
				C: true,
				D: true,
			}),
		).toBe(false);
	});
});

describe("areExpressionsLogicallyEquivalent", () => {
	it("should recognize identical expressions", () => {
		expect(
			areExpressionsLogicallyEquivalent("Q = A AND B", "Q = A AND B"),
		).toBe(true);
	});

	it("should recognize commutative equivalence", () => {
		expect(
			areExpressionsLogicallyEquivalent("Q = A AND B", "Q = B AND A"),
		).toBe(true);
		expect(areExpressionsLogicallyEquivalent("Q = A OR B", "Q = B OR A")).toBe(
			true,
		);
	});

	it("should recognize De Morgan's law equivalences", () => {
		expect(
			areExpressionsLogicallyEquivalent(
				"Q = NOT (A AND B)",
				"Q = (NOT A) OR (NOT B)",
			),
		).toBe(true);
		expect(
			areExpressionsLogicallyEquivalent(
				"Q = NOT (A OR B)",
				"Q = (NOT A) AND (NOT B)",
			),
		).toBe(true);
	});

	it("should recognize double negation", () => {
		expect(areExpressionsLogicallyEquivalent("Q = NOT (NOT A)", "Q = A")).toBe(
			true,
		);
	});

	it("should detect non-equivalent expressions", () => {
		expect(areExpressionsLogicallyEquivalent("Q = A AND B", "Q = A OR B")).toBe(
			false,
		);
		expect(areExpressionsLogicallyEquivalent("Q = A", "Q = NOT A")).toBe(false);
	});

	it("should handle complex expressions", () => {
		expect(
			areExpressionsLogicallyEquivalent(
				"Q = (A AND B) OR C",
				"Q = C OR (B AND A)",
			),
		).toBe(true);
	});

	it("should work with different variable sets", () => {
		expect(areExpressionsLogicallyEquivalent("Q = A", "Q = B")).toBe(false);
	});
});

describe("generateAllAcceptedAnswers", () => {
	it("should include the original expression", () => {
		const answers = generateAllAcceptedAnswers("Q = A AND B");
		expect(answers).toContain("Q = A AND B");
	});

	it("should generate commutative variations for AND", () => {
		const answers = generateAllAcceptedAnswers("Q = A AND B");
		expect(answers.some((a) => a.includes("A AND B"))).toBe(true);
		expect(answers.some((a) => a.includes("B AND A"))).toBe(true);
	});

	it("should generate commutative variations for OR", () => {
		const answers = generateAllAcceptedAnswers("Q = A OR B");
		expect(answers.some((a) => a.includes("A OR B"))).toBe(true);
		expect(answers.some((a) => a.includes("B OR A"))).toBe(true);
	});

	it("should preserve NOT expressions", () => {
		const answers = generateAllAcceptedAnswers("Q = NOT A");
		expect(answers).toContain("Q = NOT A");
	});

	it("should generate variations for complex expressions", () => {
		const answers = generateAllAcceptedAnswers("Q = (A AND B) OR C");
		expect(answers.length).toBeGreaterThan(1);
		// Should include variations like C OR (A AND B)
		expect(answers.some((a) => a.includes("C OR"))).toBe(true);
	});

	it("should handle NOT in complex expressions", () => {
		const answers = generateAllAcceptedAnswers("Q = (NOT A) AND B");
		expect(answers.length).toBeGreaterThan(1);
		// Should include B AND (NOT A)
		expect(answers.some((a) => a.includes("B AND"))).toBe(true);
	});

	it("should convert to uppercase", () => {
		const answers = generateAllAcceptedAnswers("q = a and b");
		answers.forEach((answer) => {
			expect(answer).toBe(answer.toUpperCase());
		});
	});

	it("should handle invalid format", () => {
		const answers = generateAllAcceptedAnswers("INVALID");
		expect(answers).toEqual(["INVALID"]);
	});
});

describe("shuffleExpression", () => {
	it("should maintain expression structure", () => {
		const original = "Q = A AND B";
		const shuffled = shuffleExpression(original);

		// Should still have format: [VAR] = [VAR] AND [VAR]
		expect(shuffled).toMatch(/^[A-Z] = [A-Z] AND [A-Z]$/);
	});

	it("should change variables", () => {
		const original = "Q = A AND B";
		// Run multiple times to ensure it changes at least once
		let changed = false;
		for (let i = 0; i < 10; i++) {
			const shuffled = shuffleExpression(original);
			if (shuffled !== original) {
				changed = true;
				break;
			}
		}
		expect(changed).toBe(true);
	});

	it("should preserve operators", () => {
		const original = "Q = (A AND B) OR C";
		const shuffled = shuffleExpression(original);

		expect(shuffled).toContain("AND");
		expect(shuffled).toContain("OR");
		expect(shuffled).toContain("(");
		expect(shuffled).toContain(")");
	});

	it("should preserve NOT operations", () => {
		const original = "Q = NOT A";
		const shuffled = shuffleExpression(original);

		expect(shuffled).toContain("NOT");
		expect(shuffled).toMatch(/^[A-Z] = NOT [A-Z]$/);
	});

	it("should use different input and output variable pools", () => {
		// Output should be from P-Z, inputs from A-H
		const original = "Q = A AND B";
		const shuffled = shuffleExpression(original);

		const outputVar = shuffled.charAt(0);
		expect(["P", "Q", "R", "S", "T", "W", "X", "Y", "Z"]).toContain(outputVar);
	});
});
