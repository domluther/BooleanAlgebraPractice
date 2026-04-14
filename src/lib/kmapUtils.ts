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

// ---------------------------------------------------------------------------
// Grouping types and utilities
// ---------------------------------------------------------------------------

export interface KMapGroup {
	id: string;
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
	colorIndex: number;
}

export const GROUP_COLORS = [
	"rgba(59, 130, 246, 0.25)", // blue
	"rgba(239, 68, 68, 0.25)", // red
	"rgba(34, 197, 94, 0.25)", // green
	"rgba(168, 85, 247, 0.25)", // purple
	"rgba(249, 115, 22, 0.25)", // orange
	"rgba(236, 72, 153, 0.25)", // pink
];

export const GROUP_BORDER_COLORS = [
	"rgb(59, 130, 246)", // blue
	"rgb(239, 68, 68)", // red
	"rgb(34, 197, 94)", // green
	"rgb(168, 85, 247)", // purple
	"rgb(249, 115, 22)", // orange
	"rgb(236, 72, 153)", // pink
];

function isPowerOfTwo(n: number): boolean {
	return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Returns the width/height of a group, handling wrap-around.
 * When startCol > endCol, the group wraps around columns.
 * When startRow > endRow, the group wraps around rows.
 */
export function getGroupDimensions(
	group: KMapGroup,
	layout: KMapLayout,
): { width: number; height: number } {
	const width =
		group.startCol <= group.endCol
			? group.endCol - group.startCol + 1
			: layout.colCount - group.startCol + group.endCol + 1;
	const height =
		group.startRow <= group.endRow
			? group.endRow - group.startRow + 1
			: layout.rowCount - group.startRow + group.endRow + 1;
	return { width, height };
}

/**
 * Checks if a cell at (row, col) is inside a group, handling wrap-around.
 */
export function isCellInGroup(
	row: number,
	col: number,
	group: KMapGroup,
): boolean {
	const inRow =
		group.startRow <= group.endRow
			? row >= group.startRow && row <= group.endRow
			: row >= group.startRow || row <= group.endRow;
	const inCol =
		group.startCol <= group.endCol
			? col >= group.startCol && col <= group.endCol
			: col >= group.startCol || col <= group.endCol;
	return inRow && inCol;
}

/**
 * Iterates over all cells in a group, handling wrap-around.
 */
function forEachGroupCell(
	group: KMapGroup,
	layout: KMapLayout,
	callback: (row: number, col: number) => void,
): void {
	const { width, height } = getGroupDimensions(group, layout);
	for (let dr = 0; dr < height; dr++) {
		const r = (group.startRow + dr) % layout.rowCount;
		for (let dc = 0; dc < width; dc++) {
			const c = (group.startCol + dc) % layout.colCount;
			callback(r, c);
		}
	}
}

export function validateGroup(
	startRow: number,
	startCol: number,
	endRow: number,
	endCol: number,
	solution: boolean[][],
	layout: KMapLayout,
): { valid: boolean; reason?: string } {
	const tempGroup: KMapGroup = {
		id: "",
		startRow,
		startCol,
		endRow,
		endCol,
		colorIndex: 0,
	};
	const { width, height } = getGroupDimensions(tempGroup, layout);

	if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
		return {
			valid: false,
			reason: `Group dimensions ${width}×${height} are not valid. Each side must be a power of 2 (1, 2, or 4).`,
		};
	}

	let allOnes = true;
	forEachGroupCell(tempGroup, layout, (r, c) => {
		if (!solution[r][c]) allOnes = false;
	});

	if (!allOnes) {
		return {
			valid: false,
			reason: "Group must only contain cells with value 1.",
		};
	}

	return { valid: true };
}

export function areAllOnesCovered(
	groups: KMapGroup[],
	solution: boolean[][],
): boolean {
	for (let r = 0; r < solution.length; r++) {
		for (let c = 0; c < solution[r].length; c++) {
			if (solution[r][c]) {
				const covered = groups.some((g) => isCellInGroup(r, c, g));
				if (!covered) return false;
			}
		}
	}
	return true;
}

/**
 * Finds groups that are redundant — i.e. removing them would still leave
 * all 1s covered by the remaining groups.
 */
export function findRedundantGroups(
	groups: KMapGroup[],
	solution: boolean[][],
): string[] {
	const redundantIds: string[] = [];
	for (let i = 0; i < groups.length; i++) {
		const remaining = groups.filter((_, j) => j !== i);
		if (areAllOnesCovered(remaining, solution)) {
			redundantIds.push(groups[i].id);
		}
	}
	return redundantIds;
}

/**
 * Finds groups that could be made larger (doubled in some direction)
 * while still containing only 1s. Supports wrap-around expansion.
 */
export function findExpandableGroups(
	groups: KMapGroup[],
	solution: boolean[][],
	layout: KMapLayout,
): string[] {
	const expandableIds: string[] = [];

	for (const group of groups) {
		const { width, height } = getGroupDimensions(group, layout);

		// Skip if already covers all columns/rows in that dimension
		const canExpandCols = width < layout.colCount;
		const canExpandRows = height < layout.rowCount;

		const expansions: KMapGroup[] = [];

		if (canExpandCols) {
			// Double width, extending from startCol with 2× width (wraps via modulo)
			const newEndCol = (group.startCol + width * 2 - 1) % layout.colCount;
			expansions.push({ ...group, endCol: newEndCol });
			// Double width, extending endCol backwards
			const newStartCol =
				(group.startCol - width + layout.colCount) % layout.colCount;
			expansions.push({ ...group, startCol: newStartCol });
		}
		if (canExpandRows) {
			const newEndRow = (group.startRow + height * 2 - 1) % layout.rowCount;
			expansions.push({ ...group, endRow: newEndRow });
			const newStartRow =
				(group.startRow - height + layout.rowCount) % layout.rowCount;
			expansions.push({ ...group, startRow: newStartRow });
		}

		let canExpand = false;
		for (const expanded of expansions) {
			const { width: ew, height: eh } = getGroupDimensions(expanded, layout);
			if (!isPowerOfTwo(ew) || !isPowerOfTwo(eh)) continue;

			let allOnes = true;
			forEachGroupCell(expanded, layout, (r, c) => {
				if (!solution[r][c]) allOnes = false;
			});
			if (allOnes) {
				canExpand = true;
				break;
			}
		}

		if (canExpand) {
			expandableIds.push(group.id);
		}
	}

	return expandableIds;
}

export function getSimplifiedTermForGroup(
	group: KMapGroup,
	layout: KMapLayout,
): string {
	const allVarValues: Record<string, Set<boolean>> = {};

	forEachGroupCell(group, layout, (r, c) => {
		const values = getCellVarValues(r, c, layout);
		for (const [varName, value] of Object.entries(values)) {
			if (!allVarValues[varName]) allVarValues[varName] = new Set();
			allVarValues[varName].add(value);
		}
	});

	const termParts: string[] = [];
	const allVars = [...layout.colVars, ...layout.rowVars].sort();

	for (const varName of allVars) {
		const values = allVarValues[varName];
		if (values && values.size === 1) {
			termParts.push(values.has(true) ? varName : `NOT ${varName}`);
		}
	}

	if (termParts.length === 0) return "1";
	return termParts.join(" AND ");
}

export function getSimplifiedExpression(
	groups: KMapGroup[],
	layout: KMapLayout,
): string {
	if (groups.length === 0) return "";
	const terms = groups.map((g) => getSimplifiedTermForGroup(g, layout));
	if (terms.length === 1) return `Q = ${terms[0]}`;
	return `Q = ${terms.map((t) => (t.includes(" ") ? `(${t})` : t)).join(" OR ")}`;
}
