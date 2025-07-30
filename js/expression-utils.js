// expression-utils.js - Expression parsing and validation utilities

// Used in expression mode, scenario mode and draw circuit mode
export function generateAllAcceptedAnswers(baseExpression) {
	const answers = new Set([baseExpression]);

	const parts = baseExpression.split(' = ');
	if (parts.length !== 2) return [baseExpression];

	// Output on left, expression on right
	const leftSide = parts[0];
	const rightSide = parts[1];

	// Generate all possible variations
	const variations = generateExpressionVariations(rightSide);

	variations.forEach(variation => {
		answers.add(`${leftSide} = ${variation}`);
	});

	// Convert to array and sort for consistent display
	const result = [...answers].sort();
	return result;
}

// Generates possible options using commutative but not associative (eg no removal of brackets)
export function generateExpressionVariations(expression) {
	// Parse the expression into an abstract syntax tree
	function parseExpression(expr) {
		expr = expr.trim();

		// Handle NOT operations
		if (expr.startsWith('NOT ')) {
			const operand = expr.substring(4).trim();
			return {
				type: 'NOT',
				operand: parseExpression(operand),
				hasParens: false // Track if this NOT was originally in parentheses
			};
		}

		// Handle parentheses
		if (expr.startsWith('(') && expr.endsWith(')')) {
			// Check if these are the outermost parentheses
			let depth = 0;
			let isOutermost = true;
			for (let i = 0; i < expr.length; i++) {
				if (expr[i] === '(') depth++;
				else if (expr[i] === ')') depth--;

				if (depth === 0 && i < expr.length - 1) {
					isOutermost = false;
					break;
				}
			}

			if (isOutermost) {
				const inner = parseExpression(expr.substring(1, expr.length - 1));
				// Mark if this was a NOT expression that had explicit parentheses
				if (inner.type === 'NOT') {
					inner.hasParens = true;
				}
				return inner;
			}
		}

		// Find the main operator (AND/OR) at the lowest depth
		let depth = 0;
		let mainOpIndex = -1;
		let mainOp = null;

		// Look for OR first (lower precedence)
		for (let i = expr.length - 1; i >= 0; i--) {
			if (expr[i] === ')') depth++;
			else if (expr[i] === '(') depth--;
			else if (depth === 0) {
				if (expr.substring(i, i + 3) === ' OR') {
					mainOpIndex = i;
					mainOp = 'OR';
					break;
				} else if (expr.substring(i, i + 4) === ' AND' && mainOp === null) {
					mainOpIndex = i;
					mainOp = 'AND';
				}
			}
		}

		if (mainOpIndex !== -1) {
			const left = expr.substring(0, mainOpIndex).trim();
			const right = expr.substring(mainOpIndex + (mainOp === 'OR' ? 3 : 4)).trim();

			return {
				type: mainOp,
				left: parseExpression(left),
				right: parseExpression(right)
			};
		}

		// If no operator found, it's a variable
		return {
			type: 'VAR',
			name: expr
		};
	}

	// Generate all variations of an AST
	function generateASTVariations(ast) {
		if (ast.type === 'VAR') {
			return [ast];
		}

		if (ast.type === 'NOT') {
			const operandVariations = generateASTVariations(ast.operand);
			return operandVariations.map(operand => ({
				type: 'NOT',
				operand: operand,
				hasParens: ast.hasParens || false // Preserve parentheses flag
			}));
		}

		if (ast.type === 'AND' || ast.type === 'OR') {
			const leftVariations = generateASTVariations(ast.left);
			const rightVariations = generateASTVariations(ast.right);

			const variations = [];

			// Generate all combinations of left and right variations
			for (const left of leftVariations) {
				for (const right of rightVariations) {
					// Original order
					variations.push({
						type: ast.type,
						left: left,
						right: right
					});

					// Commutative order (swap left and right)
					variations.push({
						type: ast.type,
						left: right,
						right: left
					});
				}
			}

			return variations;
		}

		return [ast];
	}

	// Convert AST back to string, preserving original parentheses structure
	function astToString(ast) {
		if (ast.type === 'VAR') {
			return ast.name;
		}

		if (ast.type === 'NOT') {
			const operandStr = astToString(ast.operand);

			// Use parentheses if originally had them or if operand is complex
			const needsParens = ast.hasParens || (ast.operand.type === 'AND' || ast.operand.type === 'OR');

			if (needsParens) {
				return `(NOT ${operandStr})`;
			}
			return `NOT ${operandStr}`;
		}

		if (ast.type === 'AND' || ast.type === 'OR') {
			const leftStr = astToString(ast.left);
			const rightStr = astToString(ast.right);

			// Preserve parentheses structure - add parentheses around complex sub-expressions
			let leftFinal = leftStr;
			let rightFinal = rightStr;

			// Add parentheses if sub-expression is complex (contains operators)
			if (ast.left.type === 'AND' || ast.left.type === 'OR') {
				leftFinal = `(${leftStr})`;
			}
			if (ast.right.type === 'AND' || ast.right.type === 'OR') {
				rightFinal = `(${rightStr})`;
			}

			return `${leftFinal} ${ast.type} ${rightFinal}`;
		}

		return '';
	}

	try {
		// Parse the expression
		const ast = parseExpression(expression);

		// Generate all variations
		const astVariations = generateASTVariations(ast);

		// Convert back to strings and remove duplicates
		const stringVariations = astVariations.map(astToString);
		const uniqueVariations = [...new Set(stringVariations)];

		return uniqueVariations;
	} catch (error) {
		// Fallback to original expression if parsing fails
		console.warn('Failed to parse expression:', expression, error);
		return [expression];
	}
}