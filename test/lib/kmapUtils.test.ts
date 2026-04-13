import { describe, expect, it } from "vitest";
import { getInputVariables } from "../../src/lib/expressionUtils";
import {
	buildKMapSolution,
	getCellVarValues,
	getKMapLayout,
} from "../../src/lib/kmapUtils";

// ---------------------------------------------------------------------------
// getKMapLayout
// ---------------------------------------------------------------------------

describe("getKMapLayout", () => {
	describe("2-variable (2×2 grid)", () => {
		it("returns 2 columns and 2 rows", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(layout.colCount).toBe(2);
			expect(layout.rowCount).toBe(2);
		});

		it("assigns the second sorted variable to columns and first to rows", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(layout.colVars).toEqual(["B"]);
			expect(layout.rowVars).toEqual(["A"]);
		});

		it("uses single-bit labels [0, 1] for both axes", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(layout.colLabels).toEqual(["0", "1"]);
			expect(layout.rowLabels).toEqual(["0", "1"]);
		});
	});

	describe("3-variable (2×4 grid)", () => {
		it("returns 4 columns and 2 rows", () => {
			const layout = getKMapLayout(["A", "B", "C"]);
			expect(layout.colCount).toBe(4);
			expect(layout.rowCount).toBe(2);
		});

		it("assigns first two sorted vars to columns and last to rows", () => {
			const layout = getKMapLayout(["A", "B", "C"]);
			expect(layout.colVars).toEqual(["A", "B"]);
			expect(layout.rowVars).toEqual(["C"]);
		});

		it("uses Gray-code labels [00,01,11,10] for columns", () => {
			const layout = getKMapLayout(["A", "B", "C"]);
			expect(layout.colLabels).toEqual(["00", "01", "11", "10"]);
		});

		it("uses single-bit labels [0, 1] for rows", () => {
			const layout = getKMapLayout(["A", "B", "C"]);
			expect(layout.rowLabels).toEqual(["0", "1"]);
		});
	});

	describe("4-variable (4×4 grid)", () => {
		it("returns 4 columns and 4 rows", () => {
			const layout = getKMapLayout(["A", "B", "C", "D"]);
			expect(layout.colCount).toBe(4);
			expect(layout.rowCount).toBe(4);
		});

		it("assigns first two vars to columns, last two to rows", () => {
			const layout = getKMapLayout(["A", "B", "C", "D"]);
			expect(layout.colVars).toEqual(["A", "B"]);
			expect(layout.rowVars).toEqual(["C", "D"]);
		});

		it("uses Gray-code labels on both axes", () => {
			const layout = getKMapLayout(["A", "B", "C", "D"]);
			expect(layout.colLabels).toEqual(["00", "01", "11", "10"]);
			expect(layout.rowLabels).toEqual(["00", "01", "11", "10"]);
		});
	});

	it("sorts variables before assigning axes", () => {
		// Pass variables in non-sorted order — layout should behave identically
		const unsorted = getKMapLayout(["D", "B", "A", "C"]);
		const sorted = getKMapLayout(["A", "B", "C", "D"]);
		expect(unsorted.colVars).toEqual(sorted.colVars);
		expect(unsorted.rowVars).toEqual(sorted.rowVars);
	});
});

// ---------------------------------------------------------------------------
// getCellVarValues
// ---------------------------------------------------------------------------

describe("getCellVarValues", () => {
	describe("2-variable grid", () => {
		it("cell (0,0) → A=false, B=false", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(getCellVarValues(0, 0, layout)).toEqual({ A: false, B: false });
		});

		it("cell (0,1) → A=false, B=true", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(getCellVarValues(0, 1, layout)).toEqual({ A: false, B: true });
		});

		it("cell (1,0) → A=true, B=false", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(getCellVarValues(1, 0, layout)).toEqual({ A: true, B: false });
		});

		it("cell (1,1) → A=true, B=true", () => {
			const layout = getKMapLayout(["A", "B"]);
			expect(getCellVarValues(1, 1, layout)).toEqual({ A: true, B: true });
		});
	});

	describe("4-variable grid — Gray-code column ordering", () => {
		// Columns are in Gray-code order: 00, 01, 11, 10
		// So col=2 corresponds to AB=11 (A=true, B=true)
		//    col=3 corresponds to AB=10 (A=true, B=false)
		it("col=2 → A=true, B=true (Gray-code 11)", () => {
			const layout = getKMapLayout(["A", "B", "C", "D"]);
			const { A, B } = getCellVarValues(0, 2, layout);
			expect(A).toBe(true);
			expect(B).toBe(true);
		});

		it("col=3 → A=true, B=false (Gray-code 10)", () => {
			const layout = getKMapLayout(["A", "B", "C", "D"]);
			const { A, B } = getCellVarValues(0, 3, layout);
			expect(A).toBe(true);
			expect(B).toBe(false);
		});
	});

	it("covers all 4 cells of a 2×2 grid with unique combinations", () => {
		const layout = getKMapLayout(["A", "B"]);
		const seen = new Set<string>();
		for (let r = 0; r < 2; r++) {
			for (let c = 0; c < 2; c++) {
				const v = getCellVarValues(r, c, layout);
				seen.add(JSON.stringify(v));
			}
		}
		expect(seen.size).toBe(4);
	});

	it("covers all 16 cells of a 4×4 grid with unique combinations", () => {
		const layout = getKMapLayout(["A", "B", "C", "D"]);
		const seen = new Set<string>();
		for (let r = 0; r < 4; r++) {
			for (let c = 0; c < 4; c++) {
				const v = getCellVarValues(r, c, layout);
				seen.add(JSON.stringify(v));
			}
		}
		expect(seen.size).toBe(16);
	});
});

// ---------------------------------------------------------------------------
// buildKMapSolution
// ---------------------------------------------------------------------------

describe("buildKMapSolution", () => {
	it("Q = A AND B → only the (A=1,B=1) cell is 1 in 2×2 grid", () => {
		const expression = "Q = A AND B";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);

		// row=A, col=B  →  A=1,B=1  is at row=1, col=1
		expect(solution[0][0]).toBe(false); // A=0, B=0
		expect(solution[0][1]).toBe(false); // A=0, B=1
		expect(solution[1][0]).toBe(false); // A=1, B=0
		expect(solution[1][1]).toBe(true); //  A=1, B=1  ← only 1
	});

	it("Q = A OR B → three cells are 1, only (A=0,B=0) is 0", () => {
		const expression = "Q = A OR B";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);

		expect(solution[0][0]).toBe(false); // A=0, B=0
		expect(solution[0][1]).toBe(true); //  A=0, B=1
		expect(solution[1][0]).toBe(true); //  A=1, B=0
		expect(solution[1][1]).toBe(true); //  A=1, B=1
	});

	it("Q = NOT A AND NOT B → only (A=0,B=0) is 1", () => {
		const expression = "Q = NOT A AND NOT B";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);
		const ones = solution.flat().filter(Boolean).length;
		expect(ones).toBe(1);
		expect(solution[0][0]).toBe(true);
	});

	it("returns a grid with correct dimensions for 4-variable expression", () => {
		const expression = "Q = A AND B AND C AND D";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);
		expect(solution).toHaveLength(4);
		for (const row of solution) {
			expect(row).toHaveLength(4);
		}
	});

	it("Q = A AND B AND C AND D → exactly one cell is 1", () => {
		const expression = "Q = A AND B AND C AND D";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);
		const ones = solution.flat().filter(Boolean).length;
		expect(ones).toBe(1);
	});

	it("total 1-count matches truth-table expectation for 3-variable expression", () => {
		// Q = A AND B → two variables but let's pick a 3-var expression
		// Q = A AND B AND C → 1 row out of 8 is true  → 1 one in 2×4 grid
		const expression = "Q = A AND B AND C";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);
		expect(solution.flat().filter(Boolean).length).toBe(1);
	});

	it("Q = A OR B OR C → 7 cells are 1 in 2×4 grid", () => {
		const expression = "Q = A OR B OR C";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);
		expect(solution.flat().filter(Boolean).length).toBe(7);
	});

	it("correctly evaluates the placeholder Level 3 expression", () => {
		// (A AND B) OR (NOT A AND B) OR (NOT C AND NOT D)
		// simplifies to B OR (NOT C AND NOT D)
		const expression =
			"Q = (A AND B) OR (NOT A AND B) OR (NOT C AND NOT D)";
		const layout = getKMapLayout(getInputVariables(expression));
		const solution = buildKMapSolution(expression, layout);

		// Every cell should be either true or false (no undefined / null)
		for (const row of solution) {
			for (const cell of row) {
				expect(typeof cell).toBe("boolean");
			}
		}

		// The total count of 1s must be between 1 and 15 (not all-zero / all-one)
		const ones = solution.flat().filter(Boolean).length;
		expect(ones).toBeGreaterThan(0);
		expect(ones).toBeLessThan(16);
	});
});
