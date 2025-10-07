/**
 * Truth Table Utilities
 * 
 * Functions for generating and validating truth tables for Boolean expressions.
 * Ported from legacy/js/truth-table-utils.js
 */

import { evaluateExpression, getInputVariables } from "./expressionUtils";

/**
 * Checks if two Boolean expressions produce the same truth table.
 * Used for generating distractor options in NameThat Level 3.
 * 
 * @example
 * hasSameTruthTable("Q = (B AND C) OR A", "Q = A OR (B AND C)") // true
 * hasSameTruthTable("Q = A AND B", "Q = A OR B") // false
 * 
 * @param expr1 - First Boolean expression (e.g., "Q = (B AND C) OR A")
 * @param expr2 - Second Boolean expression (e.g., "Q = A OR (B AND C)")
 * @returns True if both expressions produce identical truth tables
 */
export function hasSameTruthTable(expr1: string, expr2: string): boolean {
	try {
		// Get all unique input variables from both expressions
		const inputs1 = getInputVariables(expr1);
		const inputs2 = getInputVariables(expr2);

		// If they don't have the same input variables, they're different
		if (
			inputs1.length !== inputs2.length ||
			!inputs1.every((input) => inputs2.includes(input))
		) {
			return false;
		}

		const inputs = inputs1; // Use either set since they're the same
		const numCombinations = 2 ** inputs.length;

		// Extract the expression bodies (right side of the equals)
		const body1 = expr1.split(" = ")[1];
		const body2 = expr2.split(" = ")[1];

		// Test every possible input combination
		for (let i = 0; i < numCombinations; i++) {
			const combination: Record<string, boolean> = {};

			// Generate input combination
			for (let j = 0; j < inputs.length; j++) {
				const inputName = inputs[j];
				const value = Boolean((i >> (inputs.length - 1 - j)) & 1);
				combination[inputName] = value;
			}

			// Evaluate both expressions with this combination
			const result1 = evaluateExpression(body1, combination);
			const result2 = evaluateExpression(body2, combination);

			// If any combination produces different results, they're not equivalent
			if (result1 !== result2) {
				return false;
			}
		}

		// All combinations produced the same results
		return true;
	} catch (error) {
		// If there's an error evaluating, assume they're different
		console.warn("Error comparing truth tables:", error);
		return false;
	}
}

/**
 * Parsed expression data for truth table generation
 */
export interface ParsedExpression {
	/** Sorted input variable names (e.g., ['A', 'B', 'C']) */
	inputs: string[];
	/** Intermediate sub-expressions found in parentheses */
	intermediateExpressions: string[];
}

/**
 * A single row in the truth table
 */
export interface TruthTableRow {
	/** Input values (e.g., { A: true, B: false }) */
	[key: string]: boolean;
	/** Intermediate expression values (e.g., { intermediate_0: true }) */
	// intermediate_${number}?: boolean;
	/** Output value (e.g., { Q: true }) */
	// [outputVar: string]: boolean;
}

/**
 * Parses a boolean expression to extract input variables and intermediate sub-expressions.
 * 
 * @example
 * parseExpressionForTable("Q = A AND (B OR C)")
 * // Returns: { inputs: ['A', 'B', 'C'], intermediateExpressions: ['B OR C'] }
 * 
 * @param expression - The boolean expression string (e.g., "Q = A AND (B OR C)")
 * @returns Object containing sorted inputs and intermediate expressions
 */
export function parseExpressionForTable(expression: string): ParsedExpression {
	const rightSide = expression.split(" = ")[1];
	const inputs = getInputVariables(expression);

	const intermediateExpressions: string[] = [];
	const parenthesesMatches = rightSide.match(/\([^()]+\)/g) || [];

	for (const match of parenthesesMatches) {
		const cleaned = match.slice(1, -1); // Remove parentheses
		if (!intermediateExpressions.includes(cleaned)) {
			intermediateExpressions.push(cleaned);
		}
	}

	return { inputs, intermediateExpressions };
}

/**
 * Generates all possible input combinations for a given set of inputs.
 * Uses binary counting to generate all 2^n combinations.
 * 
 * @example
 * generateInputCombinations(['A', 'B'])
 * // Returns: [
 * //   { A: false, B: false },
 * //   { A: false, B: true },
 * //   { A: true, B: false },
 * //   { A: true, B: true }
 * // ]
 * 
 * @param inputs - Array of input variable names
 * @returns Array of objects, each representing a row of input values
 */
export function generateInputCombinations(
	inputs: string[],
): TruthTableRow[] {
	const numInputs = inputs.length;
	const numCombinations = 2 ** numInputs;
	const combinations: TruthTableRow[] = [];

	for (let i = 0; i < numCombinations; i++) {
		const combination: TruthTableRow = {};
		for (let j = 0; j < numInputs; j++) {
			combination[inputs[j]] = Boolean((i >> (numInputs - 1 - j)) & 1);
		}
		combinations.push(combination);
	}

	return combinations;
}

/**
 * Calculates the full data for a truth table, including intermediate and final outputs.
 * 
 * @param expression - The full expression string, e.g., "Q = A AND B"
 * @param inputs - Array of input variable names
 * @param intermediateExpressions - Array of intermediate expression strings
 * @param showIntermediateColumns - Flag to control calculation of intermediate values
 * @returns Array of objects, where each object represents a row in the truth table
 */
export function calculateTruthTableData(
	expression: string,
	inputs: string[],
	intermediateExpressions: string[],
	showIntermediateColumns: boolean,
): TruthTableRow[] {
	const inputCombinations = generateInputCombinations(inputs);
	const expressionBody = expression.split(" = ")[1];
	const outputVar = expression.split(" = ")[0].trim();

	const truthTableData = inputCombinations.map((combination) => {
		const result: TruthTableRow = { ...combination };

		// Calculate intermediate expressions if requested
		if (showIntermediateColumns && intermediateExpressions.length > 0) {
			for (const [index, expr] of intermediateExpressions.entries()) {
				result[`intermediate_${index}`] = evaluateExpression(expr, combination);
			}
		}

		// Calculate final output
		result[outputVar] = evaluateExpression(expressionBody, combination);

		return result;
	});

	return truthTableData;
}

/**
 * Validation result for expert mode truth tables
 */
export interface ExpertModeValidationResult {
	/** Whether the entire table is correct */
	isCorrect: boolean;
	/** Number of correctly matched rows */
	correctRows: number;
	/** Mapping of user row indices to correct row indices (-1 if no match) */
	rowMatches: number[];
}

/**
 * Performs order-independent validation for expert mode.
 * In expert mode, users can enter rows in any order, so we need to find matching rows.
 * 
 * @param userRows - The rows of data entered by the user
 * @param correctData - The correct, pre-calculated truth table data
 * @returns Validation result indicating correctness and which rows matched
 */
export function validateExpertModeAnswers(
	userRows: Array<{ rowIndex: number; data: TruthTableRow }>,
	correctData: TruthTableRow[],
): ExpertModeValidationResult {
	const numRows = correctData.length;
	const usedCorrectRows = new Set<number>();
	const rowMatches: number[] = new Array(numRows).fill(-1);
	let correctRowCount = 0;

	// For each user row, try to find a matching correct row
	for (const userRow of userRows) {
		for (let j = 0; j < correctData.length; j++) {
			if (usedCorrectRows.has(j)) continue;

			const correctRow = correctData[j];
			let matches = true;

			// Check if all fields match
			for (const key in userRow.data) {
				if (userRow.data[key] !== correctRow[key]) {
					matches = false;
					break;
				}
			}

			if (matches) {
				usedCorrectRows.add(j);
				rowMatches[userRow.rowIndex] = j;
				correctRowCount++;
				break;
			}
		}
	}

	return {
		isCorrect: correctRowCount === numRows,
		correctRows: correctRowCount,
		rowMatches,
	};
}
