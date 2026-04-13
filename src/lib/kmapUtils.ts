/**
 * K-Map Grid Utilities
 *
 * Functions for computing K-Map layouts and solution grids from Boolean expressions.
 * Supports 2, 3, and 4 variable expressions.
 */

import { evaluateExpression } from "./expressionUtils";

/**
 * Gray code sequences used for K-Map axes.
 * Each entry gives the [MSB, LSB] boolean values at that position.
 */
const GRAY_2BIT: [boolean, boolean][] = [
	[false, false], // 00
	[false, true], // 01
	[true, true], // 11
	[true, false], // 10
];

const GRAY_2BIT_LABELS = ["00", "01", "11", "10"];
const GRAY_1BIT_LABELS = ["0", "1"];

/**
 * Layout descriptor for a K-Map grid.
 */
export interface KMapLayout {
	/** Variable names used as column headers, in order (e.g. ["A","B"]) */
	colVars: string[];
	/** Variable names used as row headers, in order (e.g. ["C","D"]) */
	rowVars: string[];
	/** Display labels for each column (Gray-code order) */
	colLabels: string[];
	/** Display labels for each row (Gray-code order) */
	rowLabels: string[];
	/** Total number of columns */
	colCount: number;
	/** Total number of rows */
	rowCount: number;
}

/**
 * Derives the K-Map layout from the given sorted variable list.
 * - 2 vars → 2×2  (A rows, B cols)
 * - 3 vars → 2×4  (AB cols Gray-coded, C rows)
 * - 4 vars → 4×4  (AB cols Gray-coded, CD rows Gray-coded)
 */
export function getKMapLayout(variables: string[]): KMapLayout {
	const vars = [...variables].sort();

	switch (vars.length) {
		case 2:
			return {
				colVars: [vars[1]], // B
				rowVars: [vars[0]], // A
				colLabels: GRAY_1BIT_LABELS,
				rowLabels: GRAY_1BIT_LABELS,
				colCount: 2,
				rowCount: 2,
			};
		case 3:
			return {
				colVars: [vars[0], vars[1]], // AB
				rowVars: [vars[2]], // C
				colLabels: GRAY_2BIT_LABELS,
				rowLabels: GRAY_1BIT_LABELS,
				colCount: 4,
				rowCount: 2,
			};
		case 4:
		default:
			return {
				colVars: [vars[0], vars[1]], // AB
				rowVars: [vars[2], vars[3]], // CD
				colLabels: GRAY_2BIT_LABELS,
				rowLabels: GRAY_2BIT_LABELS,
				colCount: 4,
				rowCount: 4,
			};
	}
}

/**
 * Returns the Boolean variable values assigned to the cell at (row, col)
 * given the K-Map layout.
 */
export function getCellVarValues(
	row: number,
	col: number,
	layout: KMapLayout,
): Record<string, boolean> {
	const values: Record<string, boolean> = {};

	if (layout.colVars.length === 2) {
		values[layout.colVars[0]] = GRAY_2BIT[col][0];
		values[layout.colVars[1]] = GRAY_2BIT[col][1];
	} else {
		// 1-bit column axis
		values[layout.colVars[0]] = col === 1;
	}

	if (layout.rowVars.length === 2) {
		values[layout.rowVars[0]] = GRAY_2BIT[row][0];
		values[layout.rowVars[1]] = GRAY_2BIT[row][1];
	} else {
		// 1-bit row axis
		values[layout.rowVars[0]] = row === 1;
	}

	return values;
}

/**
 * Evaluates the expression for every cell in the K-Map and returns the
 * solution grid as a 2D boolean array (true = cell value is 1).
 */
export function buildKMapSolution(
	expression: string,
	layout: KMapLayout,
): boolean[][] {
	const body = expression.split(" = ")[1];
	const grid: boolean[][] = [];

	for (let row = 0; row < layout.rowCount; row++) {
		const gridRow: boolean[] = [];
		for (let col = 0; col < layout.colCount; col++) {
			const varValues = getCellVarValues(row, col, layout);
			gridRow.push(evaluateExpression(body, varValues));
		}
		grid.push(gridRow);
	}

	return grid;
}
