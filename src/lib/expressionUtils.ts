/**
 * Expression Parsing and Validation Utilities
 * Handles Boolean expression manipulation, evaluation, and variation generation
 *
 * Ported from legacy/js/expression-utils.js
 * IMPORTANT: Logic is kept identical to original - do not modify algorithms
 */

/**
 * AST Node types for expression parsing
 */
interface ASTNode {
	type: "VAR" | "AND" | "OR" | "NOT" | "XOR";
	name?: string;
	left?: ASTNode;
	right?: ASTNode;
	operand?: ASTNode;
	hasParens?: boolean;
}

/**
 * Normalizes a Boolean expression by standardizing spacing and parentheses
 * @param expr - The expression to normalize
 * @returns Normalized expression string
 */
export function normalizeExpression(expr: string): string {
	return (
		expr
			.replace(/\s+/g, " ")
			.replace(/\s*=\s*/g, " = ") // normalizes equals sign spacing
			.replace(/\s*\(\s*/g, "(")
			.replace(/\s*\)\s*/g, ")")
			// Remove outer parentheses around entire right-hand side: Q = (expr) -> Q = expr
			.replace(/^(\w+)\s*=\s*\((.+)\)$/g, "$1 = $2")
			// Normalize parentheses around NOT expressions
			.replace(/\(NOT\s+\(([^)]+)\)\)/g, "NOT ($1)") // (NOT (expr)) -> NOT (expr)
			.replace(/\(\(NOT\s+([^)]+)\)\s+AND/g, "(NOT $1 AND") // ((NOT var) AND -> (NOT var AND
			.replace(/\(\(NOT\s+([^)]+)\)\s+OR/g, "(NOT $1 OR") // ((NOT var) OR -> (NOT var OR
			.replace(/AND\s+\(NOT\s+([^)]+)\)\)/g, "AND NOT $1)") // AND (NOT var)) -> AND NOT var)
			.replace(/OR\s+\(NOT\s+([^)]+)\)\)/g, "OR NOT $1)") // OR (NOT var)) -> OR NOT var)
			// Handle double parentheses around NOT expressions: ((NOT var) -> (NOT var
			.replace(/\(\(NOT\s+([^)]+)\)/g, "(NOT $1") // ((NOT var) -> (NOT var
			// Normalize outer parentheses around entire NOT expressions
			.replace(/=\s*\(NOT\s+\(([^)]+)\)\)/g, "= NOT ($1)") // = (NOT (expr)) -> = NOT (expr)
			.replace(/\s*(AND|OR|NOT|XOR)\s*/g, " $1 ") // Supports XOR
			.replace(/\s+/g, " ")
			.replace(/\(\s+/g, "(") // remove extra spaces after opening parentheses
			.replace(/\s+\)/g, ")") // remove extra spaces before closing parentheses
			.trim()
	);
}

/**
 * Generates all accepted answer variations for a base expression
 * Includes commutative variations and different parenthesization styles
 * @param baseExpression - The base Boolean expression
 * @returns Array of all accepted equivalent expressions
 */
export function generateAllAcceptedAnswers(baseExpression: string): string[] {
	// Ensuring the base expression is in uppercase for consistency
	const capitalisedBaseExpression = baseExpression.toUpperCase();
	const answers = new Set([capitalisedBaseExpression]);

	const parts = capitalisedBaseExpression.split(" = ");
	if (parts.length !== 2) return [capitalisedBaseExpression];

	// Output on left, expression on right
	const leftSide = parts[0];
	const rightSide = parts[1];

	// Generate all possible variations
	const variations = _generateExpressionVariations(rightSide);

	variations.forEach((variation) => {
		answers.add(`${leftSide} = ${variation}`);
	});

	// Convert to array and sort for consistent display
	const result = [...answers].sort();
	return result;
}

/**
 * Generates all commutative variations of an expression
 * @param expression - The expression to generate variations for
 * @returns Array of expression variations
 */
function _generateExpressionVariations(expression: string): string[] {
	// Parse the expression into an abstract syntax tree
	function _parseExpression(expr: string): ASTNode {
		expr = expr.trim();

		// Handle NOT operations
		if (expr.startsWith("NOT ")) {
			const operand = expr.substring(4).trim();
			return {
				type: "NOT",
				operand: _parseExpression(operand),
				hasParens: false, // Track if this NOT was originally in parentheses
			};
		}

		// Handle parentheses
		if (expr.startsWith("(") && expr.endsWith(")")) {
			// Check if these are the outermost parentheses
			let depth = 0;
			let isOutermost = true;
			for (let i = 0; i < expr.length; i++) {
				if (expr[i] === "(") depth++;
				else if (expr[i] === ")") depth--;

				if (depth === 0 && i < expr.length - 1) {
					isOutermost = false;
					break;
				}
			}

			if (isOutermost) {
				const inner = _parseExpression(expr.substring(1, expr.length - 1));
				// Mark if this was a NOT expression that had explicit parentheses
				if (inner.type === "NOT") {
					inner.hasParens = true;
				}
				return inner;
			}
		}

		// Find the main operator (AND/OR/XOR) at the lowest depth
		let depth = 0;
		let mainOpIndex = -1;
		let mainOp: string | null = null;

		// Look for OR and XOR first (lower precedence than AND)
		for (let i = expr.length - 1; i >= 0; i--) {
			if (expr[i] === ")") depth++;
			else if (expr[i] === "(") depth--;
			else if (depth === 0) {
				if (expr.substring(i, i + 4) === " XOR") {
					mainOpIndex = i;
					mainOp = "XOR";
					break;
				} else if (expr.substring(i, i + 3) === " OR") {
					mainOpIndex = i;
					mainOp = "OR";
					break;
				} else if (expr.substring(i, i + 4) === " AND" && mainOp === null) {
					mainOpIndex = i;
					mainOp = "AND";
				}
			}
		}

		if (mainOpIndex !== -1 && mainOp) {
			const left = expr.substring(0, mainOpIndex).trim();
			let operatorLength: number;
			if (mainOp === "OR") {
				operatorLength = 3;
			} else if (mainOp === "AND" || mainOp === "XOR") {
				operatorLength = 4;
			} else {
				operatorLength = 0;
			}
			const right = expr.substring(mainOpIndex + operatorLength).trim();

			return {
				type: mainOp as "AND" | "OR" | "XOR",
				left: _parseExpression(left),
				right: _parseExpression(right),
			};
		}

		// If no operator found, it's a variable
		return {
			type: "VAR",
			name: expr,
		};
	}

	// Generate all variations of an AST
	function _generateASTVariations(ast: ASTNode): ASTNode[] {
		if (ast.type === "VAR") {
			return [ast];
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return [ast];
			}
			const operandVariations = _generateASTVariations(ast.operand);
			return operandVariations.map((operand) => ({
				type: "NOT",
				operand: operand,
				hasParens: ast.hasParens || false, // Preserve parentheses flag
			}));
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return [ast];
			}
			const leftVariations = _generateASTVariations(ast.left);
			const rightVariations = _generateASTVariations(ast.right);

			const variations: ASTNode[] = [];

			// Generate all combinations of left and right variations
			for (const left of leftVariations) {
				for (const right of rightVariations) {
					// Original order
					variations.push({
						type: ast.type,
						left: left,
						right: right,
					});

					// Commutative order (swap left and right)
					variations.push({
						type: ast.type,
						left: right,
						right: left,
					});
				}
			}

			return variations;
		}

		return [ast];
	}

	// Convert AST back to string, preserving original parentheses structure
	function _astToString(ast: ASTNode): string {
		if (ast.type === "VAR") {
			return ast.name || "";
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return "NOT";
			}
			const operandStr = _astToString(ast.operand);

			// Use parentheses if originally had them or if operand is complex
			const needsParens =
				ast.hasParens ||
				ast.operand?.type === "AND" ||
				ast.operand?.type === "OR" ||
				ast.operand?.type === "XOR";

			if (needsParens) {
				return `NOT (${operandStr})`;
			}
			return `NOT ${operandStr}`;
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return "";
			}
			const leftStr = _astToString(ast.left);
			const rightStr = _astToString(ast.right);

			// Preserve parentheses structure - add parentheses around complex sub-expressions
			let leftFinal = leftStr;
			let rightFinal = rightStr;

			// Add parentheses if sub-expression is complex (contains operators)
			if (
				ast.left?.type === "AND" ||
				ast.left?.type === "OR" ||
				ast.left?.type === "XOR"
			) {
				leftFinal = `(${leftStr})`;
			}
			if (
				ast.right?.type === "AND" ||
				ast.right?.type === "OR" ||
				ast.right?.type === "XOR"
			) {
				rightFinal = `(${rightStr})`;
			}

			return `${leftFinal} ${ast.type} ${rightFinal}`;
		}

		return "";
	}

	// Alternative AST to string that adds extra parentheses around NOT expressions
	function _astToStringWithNOTParens(ast: ASTNode): string {
		if (ast.type === "VAR") {
			return ast.name || "";
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return "NOT";
			}
			const operandStr = _astToStringWithNOTParens(ast.operand);

			// Always use parentheses around the entire NOT expression when it has complex operands
			const needsParens =
				ast.hasParens ||
				ast.operand?.type === "AND" ||
				ast.operand?.type === "OR" ||
				ast.operand?.type === "XOR";

			if (needsParens) {
				return `(NOT (${operandStr}))`;
			}
			return `NOT ${operandStr}`;
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return "";
			}
			const leftStr = _astToStringWithNOTParens(ast.left);
			const rightStr = _astToStringWithNOTParens(ast.right);

			// Preserve parentheses structure - add parentheses around complex sub-expressions
			let leftFinal = leftStr;
			let rightFinal = rightStr;

			// Add parentheses if sub-expression is complex (contains operators)
			if (
				ast.left?.type === "AND" ||
				ast.left?.type === "OR" ||
				ast.left?.type === "XOR"
			) {
				leftFinal = `(${leftStr})`;
			}
			if (
				ast.right?.type === "AND" ||
				ast.right?.type === "OR" ||
				ast.right?.type === "XOR"
			) {
				rightFinal = `(${rightStr})`;
			}

			return `${leftFinal} ${ast.type} ${rightFinal}`;
		}

		return "";
	}

	// Alternative AST to string that minimizes parentheses around variables in NOT expressions
	function _astToStringMinimalParens(ast: ASTNode): string {
		if (ast.type === "VAR") {
			return ast.name || "";
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return "NOT";
			}
			const operandStr = _astToStringMinimalParens(ast.operand);

			// Only use parentheses around complex operands, not single variables
			if (
				ast.operand?.type === "AND" ||
				ast.operand?.type === "OR" ||
				ast.operand?.type === "XOR"
			) {
				return `NOT (${operandStr})`;
			}
			return `NOT ${operandStr}`;
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return "";
			}
			const leftStr = _astToStringMinimalParens(ast.left);
			const rightStr = _astToStringMinimalParens(ast.right);

			// Preserve parentheses structure - add parentheses around complex sub-expressions
			let leftFinal = leftStr;
			let rightFinal = rightStr;

			// Add parentheses if sub-expression is complex (contains operators)
			if (
				ast.left?.type === "AND" ||
				ast.left?.type === "OR" ||
				ast.left?.type === "XOR"
			) {
				leftFinal = `(${leftStr})`;
			}
			if (
				ast.right?.type === "AND" ||
				ast.right?.type === "OR" ||
				ast.right?.type === "XOR"
			) {
				rightFinal = `(${rightStr})`;
			}

			return `${leftFinal} ${ast.type} ${rightFinal}`;
		}

		return "";
	}

	// Circuit drawer style: matches how the circuit drawer builds expressions
	function _astToStringCircuitStyle(ast: ASTNode): string {
		if (ast.type === "VAR") {
			return ast.name || "";
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return "NOT";
			}
			const operandStr = _astToStringCircuitStyle(ast.operand);
			// Circuit drawer adds parentheses around operands that contain operators or start with NOT
			let operandFinal = operandStr;
			if (
				operandStr.includes(" AND ") ||
				operandStr.includes(" OR ") ||
				operandStr.includes(" XOR ") ||
				operandStr.startsWith("NOT ")
			) {
				operandFinal = `(${operandStr})`;
			}
			return `NOT ${operandFinal}`;
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return "";
			}
			const leftStr = _astToStringCircuitStyle(ast.left);
			const rightStr = _astToStringCircuitStyle(ast.right);

			// Don't add extra parentheses here - let the parent handle it
			return `${leftStr} ${ast.type} ${rightStr}`;
		}

		return "";
	}

	// Hybrid circuit style: NOT variables with parentheses, complex operands get wrapped
	function _astToStringHybridCircuit(ast: ASTNode): string {
		if (ast.type === "VAR") {
			return ast.name || "";
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return "NOT";
			}
			const operandStr = _astToStringHybridCircuit(ast.operand);
			// Always wrap NOT around single variables and preserve complex expressions
			if (ast.operand.type === "VAR") {
				return `(NOT ${operandStr})`; // (NOT G)
			}
			// For complex operands, add outer parentheses
			return `NOT (${operandStr})`; // NOT (complex)
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return "";
			}
			const leftStr = _astToStringHybridCircuit(ast.left);
			const rightStr = _astToStringHybridCircuit(ast.right);

			return `${leftStr} ${ast.type} ${rightStr}`;
		}

		return "";
	}

	// Aggressive parentheses: wraps sub-expressions that would get parentheses in circuit drawer
	function _astToStringAggressiveParens(ast: ASTNode): string {
		if (ast.type === "VAR") {
			return ast.name || "";
		}

		if (ast.type === "NOT") {
			if (!ast.operand) {
				return "NOT";
			}
			const operandStr = _astToStringAggressiveParens(ast.operand);
			// Circuit drawer adds parentheses around operands that contain operators or start with NOT
			let operandFinal = operandStr;
			if (
				operandStr.includes(" AND ") ||
				operandStr.includes(" OR ") ||
				operandStr.includes(" XOR ") ||
				operandStr.startsWith("NOT ")
			) {
				operandFinal = `(${operandStr})`;
			}
			return `NOT ${operandFinal}`;
		}

		if (ast.type === "AND" || ast.type === "OR" || ast.type === "XOR") {
			if (!ast.left || !ast.right) {
				return "";
			}
			const leftStr = _astToStringAggressiveParens(ast.left);
			const rightStr = _astToStringAggressiveParens(ast.right);

			// Add parentheses around sub-expressions that contain operators or start with NOT
			let leftFinal = leftStr;
			let rightFinal = rightStr;

			if (
				leftStr.includes(" AND ") ||
				leftStr.includes(" OR ") ||
				leftStr.includes(" XOR ") ||
				leftStr.startsWith("NOT ")
			) {
				leftFinal = `(${leftStr})`;
			}
			if (
				rightStr.includes(" AND ") ||
				rightStr.includes(" OR ") ||
				rightStr.includes(" XOR ") ||
				rightStr.startsWith("NOT ")
			) {
				rightFinal = `(${rightStr})`;
			}

			return `${leftFinal} ${ast.type} ${rightFinal}`;
		}

		return "";
	}

	try {
		// Parse the expression
		const ast = _parseExpression(expression);

		// Generate all variations
		const astVariations = _generateASTVariations(ast);

		// Convert back to strings using all six formats and remove duplicates
		const stringVariations1 = astVariations.map(_astToString);
		const stringVariations2 = astVariations.map(_astToStringWithNOTParens);
		const stringVariations3 = astVariations.map(_astToStringMinimalParens);
		const stringVariations4 = astVariations.map(_astToStringCircuitStyle);
		const stringVariations5 = astVariations.map(_astToStringHybridCircuit);
		const stringVariations6 = astVariations.map(_astToStringAggressiveParens);
		const allVariations = [
			...stringVariations1,
			...stringVariations2,
			...stringVariations3,
			...stringVariations4,
			...stringVariations5,
			...stringVariations6,
		];
		const uniqueVariations = [...new Set(allVariations)];

		return uniqueVariations;
	} catch (error) {
		// Fallback to original expression if parsing fails
		console.warn("Failed to parse expression:", expression, error);
		return [expression];
	}
}

/**
 * Shuffles an expression by replacing variables with random ones
 * @param expression - The expression to shuffle
 * @returns Expression with randomized variables
 */
export function shuffleExpression(expression: string): string {
	const inputVars = getInputVariables(expression);
	return replaceVariables(inputVars, expression);
}

/**
 * Parses a boolean expression to extract input variables
 * @param expression - The boolean expression string
 * @returns An array of unique, sorted input variable names
 */
export function getInputVariables(expression: string): string[] {
	const rightSide = expression.split(" = ")[1];

	const cleanExpression = rightSide
		.replace(/\bAND\b/g, " | ")
		.replace(/\bOR\b/g, " | ")
		.replace(/\bNOT\b/g, " | ")
		.replace(/\bXOR\b/g, " | ")
		.replace(/[()]/g, " | ");
	const tokens = cleanExpression
		.split("|")
		.map((token) => token.trim())
		.filter((token) => token.length > 0);

	return [
		...new Set(
			tokens.filter((token) => token.length === 1 && token.match(/[A-Z]/)),
		),
	].sort();
}

/**
 * Replaces the input and output variables in a Boolean expression with new random ones
 * - Input variables are replaced with unique characters from A-H
 * - The output variable is replaced with a character from P-Z
 * @param inputVars - An array of the original input variables, e.g., ['A', 'B']
 * @param expression - The full original expression string, e.g., "Q = A AND (B OR A)"
 * @returns The expression with replaced variables
 */
function replaceVariables(inputVars: string[], expression: string): string {
	// Ensure these don't overlap - otherwise we can end up with collisions
	const inputLetterPool = ["A", "B", "C", "D", "E", "F", "G", "H"];
	const outputLetterPool = ["P", "Q", "R", "S", "T", "W", "X", "Y", "Z"];

	// 1. Create a shuffled list of potential replacements
	const replacements = [...inputLetterPool].sort(() => Math.random() - 0.5);

	const inputMap: Record<string, string> = {};

	// 2. Assign a unique replacement to each input variable
	for (const originalVar of inputVars) {
		if (replacements.length > 0) {
			const newVar = replacements.pop();
			if (newVar) {
				inputMap[originalVar] = newVar;
			} else {
				inputMap[originalVar] = originalVar;
			}
		} else {
			// Fallback: If we run out of replacements, map the variable to itself
			inputMap[originalVar] = originalVar;
		}
	}

	// Replace the output variable
	let newExpression = expression;
	const outputVarMatch = expression.match(/^(\w)\s*=/);
	if (outputVarMatch) {
		const outputVar = outputVarMatch[1];
		const outputReplacement =
			outputLetterPool[Math.floor(Math.random() * outputLetterPool.length)];
		const outputRegex = new RegExp(`^${outputVar}(\\s*=)`);
		newExpression = newExpression.replace(
			outputRegex,
			`${outputReplacement}$1`,
		);
	}

	// Replace input variables using the corrected, collision-free map
	// Step 1: Temporarily replace input variables with unique tokens
	const tempMap: Record<string, string> = {};
	for (const [originalVar, newVar] of Object.entries(inputMap)) {
		const tempToken = `__TMP_${originalVar}__`;
		tempMap[tempToken] = newVar;
		const regex = new RegExp(`\\b${originalVar}\\b`, "g");
		newExpression = newExpression.replace(regex, tempToken);
	}

	// Step 2: Replace temporary tokens with final new variable names
	for (const [tempToken, newVar] of Object.entries(tempMap)) {
		const regex = new RegExp(tempToken, "g");
		newExpression = newExpression.replace(regex, newVar);
	}
	return newExpression;
}

/**
 * Evaluates a boolean expression string with a given set of input values
 * @param expression - The expression part to evaluate
 * @param values - An object mapping variable names to boolean values
 * @returns The result of the evaluation
 */
export function evaluateExpression(
	expression: string,
	values: Record<string, boolean>,
): boolean {
	try {
		let evalExpression = expression;
		Object.keys(values).forEach((variable) => {
			const regex = new RegExp(`\\b${variable}\\b`, "g");
			evalExpression = evalExpression.replace(regex, String(values[variable]));
		});

		evalExpression = evalExpression
			.replace(/\bAND\b/g, "&&")
			.replace(/\bOR\b/g, "||")
			.replace(/\bNOT\b/g, "!")
			.replace(/\bXOR\b/g, "^");

		// Use Function constructor to evaluate (safe in this controlled context)
		// Wrap in Boolean() to ensure XOR (which returns 0 or 1) becomes proper boolean
		const func = new Function(`return Boolean(${evalExpression})`);
		return func();
	} catch (error) {
		console.error("Error evaluating expression:", expression, error);
		return false;
	}
}

/**
 * Compare two expressions for logical equivalence using truth tables
 * @param expr1 - First expression to compare
 * @param expr2 - Second expression to compare
 * @returns True if expressions are logically equivalent
 */
export function areExpressionsLogicallyEquivalent(
	expr1: string,
	expr2: string,
): boolean {
	try {
		// Extract variables from both expressions
		const vars1 = getInputVariables(expr1);
		const vars2 = getInputVariables(expr2);
		const allVars = [...new Set([...vars1, ...vars2])].sort();

		// Extract the right-hand side of equations
		const rhs1 = expr1.split("=")[1]?.trim();
		const rhs2 = expr2.split("=")[1]?.trim();

		if (!rhs1 || !rhs2) return false;

		// Generate all possible truth value combinations
		const numVars = allVars.length;
		const numCombinations = 2 ** numVars;

		for (let i = 0; i < numCombinations; i++) {
			const values: Record<string, boolean> = {};
			for (let j = 0; j < numVars; j++) {
				values[allVars[j]] = Boolean(i & (1 << j));
			}

			const result1 = evaluateExpression(rhs1, values);
			const result2 = evaluateExpression(rhs2, values);

			if (result1 !== result2) {
				return false;
			}
		}

		return true;
	} catch (error) {
		console.error("Error comparing expressions:", error);
		return false;
	}
}
