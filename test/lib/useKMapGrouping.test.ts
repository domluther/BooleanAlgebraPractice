import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKMapGrouping } from "@/lib/useKMapGrouping";
import type { KMapLayout } from "@/lib/kmapUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 2-variable layout: rows = A, cols = B */
function makeLayout2var(): KMapLayout {
	return {
		colVars: ["B"],
		rowVars: ["A"],
		colLabels: ["0", "1"],
		rowLabels: ["0", "1"],
		colCount: 2,
		rowCount: 2,
	};
}

/** 3-variable layout: rows = A, cols = BC */
function makeLayout3var(): KMapLayout {
	return {
		colVars: ["B", "C"],
		rowVars: ["A"],
		colLabels: ["00", "01", "11", "10"],
		rowLabels: ["0", "1"],
		colCount: 4,
		rowCount: 2,
	};
}

/**
 * Sets up the hook with a valid optimal group and returns the hook result.
 *
 * Uses Q = A AND B on a 2-var grid:
 *   B=0  B=1
 * A=0 [ 0,  0 ]
 * A=1 [ 0,  1 ]
 *
 * A single group covering cell (1,1) is the only and optimal group.
 */
function setupWithOptimalGroup() {
	const layout = makeLayout2var();
	const solution = [
		[false, false],
		[false, true],
	];
	const { result } = renderHook(() =>
		useKMapGrouping({ solution, layout }),
	);

	// Draw a group: click (1,1) then (1,1) — single-cell group
	act(() => result.current.handleCellClick(1, 1));
	act(() => result.current.handleCellClick(1, 1));
	// Check groups — should be optimal
	act(() => result.current.checkGroups());

	expect(result.current.isOptimal).toBe(true);
	expect(result.current.groups).toHaveLength(1);

	return result;
}

/**
 * Sets up a 3-var hook with Q = A (all of row 1 is 1).
 * Optimal grouping: one group covering the entire bottom row.
 *
 *      BC=00 BC=01 BC=11 BC=10
 * A=0 [  0,    0,    0,    0  ]
 * A=1 [  1,    1,    1,    1  ]
 */
function setupWithOptimalGroup3var() {
	const layout = makeLayout3var();
	const solution = [
		[false, false, false, false],
		[true, true, true, true],
	];
	const { result } = renderHook(() =>
		useKMapGrouping({ solution, layout }),
	);

	// Draw a group covering entire bottom row: (1,0) → (1,3)
	act(() => result.current.handleCellClick(1, 0));
	act(() => result.current.handleCellClick(1, 3));
	act(() => result.current.checkGroups());

	expect(result.current.isOptimal).toBe(true);
	expect(result.current.groups).toHaveLength(1);

	return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useKMapGrouping — checkTerms", () => {
	describe("case insensitivity", () => {
		it("accepts uppercase input", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts lowercase input", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "a and b"));
			act(() => result.current.setFinalExpression("a and b"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts mixed case input", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "a And B"));
			act(() => result.current.setFinalExpression("A and b"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});
	});

	describe("symbol notation support", () => {
		it("accepts unicode symbol notation (∧ ∨ ¬)", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A ∧ B"));
			act(() => result.current.setFinalExpression("A ∧ B"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts keyboard shortcut notation (^ v !)", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A ^ B"));
			act(() => result.current.setFinalExpression("A ^ B"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts lowercase symbols mixed with keyboard shortcuts", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "a ^ b"));
			act(() => result.current.setFinalExpression("a ^ b"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts NOT with ¬ symbol", () => {
			const result = setupWithOptimalGroup3var();
			const groupId = result.current.groups[0].id;
			// Group covers all of row A=1, so simplified term is just "A"
			// Final expression is "Q = A"

			act(() => result.current.setGroupTermInput(groupId, "A"));
			act(() => result.current.setFinalExpression("A"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(true);
		});
	});

	describe("final expression with Q = prefix", () => {
		it("accepts final expression without Q = prefix", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts final expression with Q = prefix", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("Q = A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("accepts final expression with lowercase q = prefix", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("q = a and b"));
			act(() => result.current.checkTerms());

			expect(result.current.finalExpressionResult).toBe(true);
		});
	});

	describe("incorrect answers", () => {
		it("rejects wrong group term", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A OR B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(false);
			expect(result.current.finalExpressionResult).toBe(true);
		});

		it("rejects wrong final expression", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A OR B"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(true);
			expect(result.current.finalExpressionResult).toBe(false);
		});

		it("rejects empty group term", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, ""));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.termResults?.[groupId]).toBe(false);
		});

		it("rejects empty final expression", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression(""));
			act(() => result.current.checkTerms());

			expect(result.current.finalExpressionResult).toBe(false);
		});
	});

	describe("state management", () => {
		it("sets areTermsChecked to true after checking", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			expect(result.current.areTermsChecked).toBe(false);

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.areTermsChecked).toBe(true);
		});

		it("resets check state when group term input changes", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.areTermsChecked).toBe(true);

			act(() => result.current.setGroupTermInput(groupId, "A"));

			expect(result.current.areTermsChecked).toBe(false);
			expect(result.current.termResults).toBe(null);
		});

		it("resets check state when final expression input changes", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());

			expect(result.current.areTermsChecked).toBe(true);

			act(() => result.current.setFinalExpression("something else"));

			expect(result.current.areTermsChecked).toBe(false);
			expect(result.current.finalExpressionResult).toBe(null);
		});

		it("clears all term state on resetGroups", () => {
			const result = setupWithOptimalGroup();
			const groupId = result.current.groups[0].id;

			act(() => result.current.setGroupTermInput(groupId, "A AND B"));
			act(() => result.current.setFinalExpression("A AND B"));
			act(() => result.current.checkTerms());
			act(() => result.current.resetGroups());

			expect(result.current.groupTermInputs).toEqual({});
			expect(result.current.finalExpressionInput).toBe("");
			expect(result.current.termResults).toBe(null);
			expect(result.current.finalExpressionResult).toBe(null);
			expect(result.current.areTermsChecked).toBe(false);
			expect(result.current.groups).toEqual([]);
		});
	});
});
