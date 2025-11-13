import { describe, expect, it } from "vitest";
import { expressionDatabase } from "../../src/lib/data";

/**
 * Data integrity tests - ensures all expressions were migrated correctly
 */
describe("Expression Database", () => {
	it("should have the correct number of level1 expressions", () => {
		expect(expressionDatabase.level1).toHaveLength(4);
	});

	it("should have the correct number of level2 expressions", () => {
		expect(expressionDatabase.level2).toHaveLength(39);
	});

	it("should have the correct number of level2NoOverlap expressions", () => {
		expect(expressionDatabase.level2NoOverlap).toHaveLength(21);
	});

	it("should have the correct number of level3 expressions", () => {
		expect(expressionDatabase.level3).toHaveLength(28);
	});

	it("should have the correct number of level4 expressions", () => {
		expect(expressionDatabase.level4).toHaveLength(8);
	});

	it("should have the correct number of level5 expressions", () => {
		expect(expressionDatabase.level5).toHaveLength(35);
	});

	it("should have 135 total expressions", () => {
		const total =
			expressionDatabase.level1.length +
			expressionDatabase.level2.length +
			expressionDatabase.level2NoOverlap.length +
			expressionDatabase.level3.length +
			expressionDatabase.level4.length +
			expressionDatabase.level5.length;
		expect(total).toBe(135);
	});

	it("should have all expressions in uppercase", () => {
		const allExpressions = [
			...expressionDatabase.level1,
			...expressionDatabase.level2,
			...expressionDatabase.level2NoOverlap,
			...expressionDatabase.level3,
			...expressionDatabase.level4,
			...expressionDatabase.level5,
		];

		allExpressions.forEach((expr) => {
			expect(expr).toBe(expr.toUpperCase());
		});
	});

	it("should have valid expression format (contains =)", () => {
		const allExpressions = [
			...expressionDatabase.level1,
			...expressionDatabase.level2,
			...expressionDatabase.level2NoOverlap,
			...expressionDatabase.level3,
			...expressionDatabase.level4,
			...expressionDatabase.level5,
		];

		allExpressions.forEach((expr) => {
			expect(expr).toContain(" = ");
		});
	});
});
