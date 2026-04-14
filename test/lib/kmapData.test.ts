import { describe, expect, it } from "vitest";
import { getInputVariables } from "../../src/lib/expressionUtils";
import { kmapDatabase } from "../../src/lib/kmapData";
import { buildKMapSolution, getKMapLayout } from "../../src/lib/kmapUtils";

const ALL_EXPRESSIONS = [
	...kmapDatabase.level1,
	...kmapDatabase.level2,
	...kmapDatabase.level3,
	...kmapDatabase.level4,
];

// ---------------------------------------------------------------------------
// Shape / count tests
// ---------------------------------------------------------------------------

describe("K-Map Expression Database", () => {
	it("has at least 1 expression per level", () => {
		expect(kmapDatabase.level1.length).toBeGreaterThan(0);
		expect(kmapDatabase.level2.length).toBeGreaterThan(0);
		expect(kmapDatabase.level3.length).toBeGreaterThan(0);
		expect(kmapDatabase.level4.length).toBeGreaterThan(0);
	});

	it("level1 has exactly 10 expressions", () => {
		expect(kmapDatabase.level1).toHaveLength(10);
	});

	it("level2 has exactly 18 expressions", () => {
		expect(kmapDatabase.level2).toHaveLength(18);
	});

	it("level3 has exactly 16 expressions", () => {
		expect(kmapDatabase.level3).toHaveLength(16);
	});

	it("level4 has exactly 13 expressions", () => {
		expect(kmapDatabase.level4).toHaveLength(13);
	});

	// ---------------------------------------------------------------------------
	// Format
	// ---------------------------------------------------------------------------

	it("all expressions contain ' = '", () => {
		for (const expr of ALL_EXPRESSIONS) {
			expect(expr).toContain(" = ");
		}
	});

	it("all expressions are uppercase (word notation)", () => {
		for (const expr of ALL_EXPRESSIONS) {
			expect(expr).toBe(expr.toUpperCase());
		}
	});

	it("all expressions start with a single letter output variable", () => {
		for (const expr of ALL_EXPRESSIONS) {
			expect(expr).toMatch(/^[A-Z] = /);
		}
	});

	// ---------------------------------------------------------------------------
	// Variable-count constraints per level
	// ---------------------------------------------------------------------------

	it("level1 expressions each have exactly 2 input variables", () => {
		for (const expr of kmapDatabase.level1) {
			const vars = getInputVariables(expr);
			expect(vars, `Expected 2 vars in "${expr}"`).toHaveLength(2);
		}
	});

	it("level2 expressions each have exactly 3 input variables", () => {
		for (const expr of kmapDatabase.level2) {
			const vars = getInputVariables(expr);
			expect(vars, `Expected 3 vars in "${expr}"`).toHaveLength(3);
		}
	});

	it("level3 expressions each have exactly 4 input variables", () => {
		for (const expr of kmapDatabase.level3) {
			const vars = getInputVariables(expr);
			expect(vars, `Expected 4 vars in "${expr}"`).toHaveLength(4);
		}
	});

	it("level4 expressions each have exactly 4 input variables", () => {
		for (const expr of kmapDatabase.level4) {
			const vars = getInputVariables(expr);
			expect(vars, `Expected 4 vars in "${expr}"`).toHaveLength(4);
		}
	});

	// ---------------------------------------------------------------------------
	// Evaluability — every expression produces a valid boolean grid
	// ---------------------------------------------------------------------------

	it("every expression can be built into a K-Map solution grid without error", () => {
		for (const expr of ALL_EXPRESSIONS) {
			const vars = getInputVariables(expr);
			const layout = getKMapLayout(vars);
			const solution = buildKMapSolution(expr, layout);

			// Grid has correct dimensions
			expect(solution).toHaveLength(layout.rowCount);
			for (const row of solution) {
				expect(row).toHaveLength(layout.colCount);
				for (const cell of row) {
					expect(typeof cell).toBe("boolean");
				}
			}
		}
	});

	it("no expression produces an all-zero grid (would be trivial / useless)", () => {
		for (const expr of ALL_EXPRESSIONS) {
			const vars = getInputVariables(expr);
			const solution = buildKMapSolution(expr, getKMapLayout(vars));
			const ones = solution.flat().filter(Boolean).length;
			expect(ones, `All-zero grid for "${expr}"`).toBeGreaterThan(0);
		}
	});

	it("no expression produces an all-one grid (would be trivial / useless)", () => {
		for (const expr of ALL_EXPRESSIONS) {
			const vars = getInputVariables(expr);
			const layout = getKMapLayout(vars);
			const solution = buildKMapSolution(expr, layout);
			const totalCells = layout.rowCount * layout.colCount;
			const ones = solution.flat().filter(Boolean).length;
			expect(ones, `All-one grid for "${expr}"`).toBeLessThan(totalCells);
		}
	});
});
