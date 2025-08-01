// expression-utils.js - Expression parsing and validation utilities

// Used in expression mode, scenario mode and draw circuit mode
export function generateAllAcceptedAnswers(baseExpression) {
	// Ensuring the base expression is in uppercase for consistency
	const capitalisedBaseExpression = baseExpression.toUpperCase();
	const answers = new Set([capitalisedBaseExpression]);

	const parts = capitalisedBaseExpression.split(' = ');
	if (parts.length !== 2) return [capitalisedBaseExpression];

	// Output on left, expression on right
	const leftSide = parts[0];
	const rightSide = parts[1];

	// Generate all possible variations
	const variations = _generateExpressionVariations(rightSide);

	variations.forEach(variation => {
		answers.add(`${leftSide} = ${variation}`);
	});

	// Convert to array and sort for consistent display
	const result = [...answers].sort();
	return result;
}

// Generates possible options using commutative but not associative (eg no removal of brackets)
function _generateExpressionVariations(expression) {
	// Parse the expression into an abstract syntax tree
	function _parseExpression(expr) {
		expr = expr.trim();

		// Handle NOT operations
		if (expr.startsWith('NOT ')) {
			const operand = expr.substring(4).trim();
			return {
				type: 'NOT',
				operand: _parseExpression(operand),
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
				const inner = _parseExpression(expr.substring(1, expr.length - 1));
				// Mark if this was a NOT expression that had explicit parentheses
				if (inner.type === 'NOT') {
					inner.hasParens = true;
				}
				return inner;
			}
		}

		// Find the main operator (AND/OR/XOR) at the lowest depth
		let depth = 0;
		let mainOpIndex = -1;
		let mainOp = null;

		// Look for OR and XOR first (lower precedence than AND)
		for (let i = expr.length - 1; i >= 0; i--) {
			if (expr[i] === ')') depth++;
			else if (expr[i] === '(') depth--;
			else if (depth === 0) {
				if (expr.substring(i, i + 4) === ' XOR') {
					mainOpIndex = i;
					mainOp = 'XOR';
					break;
				} else if (expr.substring(i, i + 3) === ' OR') {
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
			let operatorLength;
			if (mainOp === 'OR') {
				operatorLength = 3;
			} else if (mainOp === 'AND' || mainOp === 'XOR') {
				operatorLength = 4;
			}
			const right = expr.substring(mainOpIndex + operatorLength).trim();

			return {
				type: mainOp,
				left: _parseExpression(left),
				right: _parseExpression(right)
			};
		}

		// If no operator found, it's a variable
		return {
			type: 'VAR',
			name: expr
		};
	}

	// Generate all variations of an AST
	function _generateASTVariations(ast) {
		if (ast.type === 'VAR') {
			return [ast];
		}

		if (ast.type === 'NOT') {
			const operandVariations = _generateASTVariations(ast.operand);
			return operandVariations.map(operand => ({
				type: 'NOT',
				operand: operand,
				hasParens: ast.hasParens || false // Preserve parentheses flag
			}));
		}

		if (ast.type === 'AND' || ast.type === 'OR' || ast.type === 'XOR') {
			const leftVariations = _generateASTVariations(ast.left);
			const rightVariations = _generateASTVariations(ast.right);

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
	function _astToString(ast) {
		if (ast.type === 'VAR') {
			return ast.name;
		}

		if (ast.type === 'NOT') {
			const operandStr = _astToString(ast.operand);

			// Use parentheses if originally had them or if operand is complex
			const needsParens = ast.hasParens || (ast.operand.type === 'AND' || ast.operand.type === 'OR' || ast.operand.type === 'XOR');

			if (needsParens) {
				return `(NOT ${operandStr})`;
			}
			return `NOT ${operandStr}`;
		}

		if (ast.type === 'AND' || ast.type === 'OR' || ast.type === 'XOR') {
			const leftStr = _astToString(ast.left);
			const rightStr = _astToString(ast.right);

			// Preserve parentheses structure - add parentheses around complex sub-expressions
			let leftFinal = leftStr;
			let rightFinal = rightStr;

			// Add parentheses if sub-expression is complex (contains operators)
			if (ast.left.type === 'AND' || ast.left.type === 'OR' || ast.left.type === 'XOR') {
				leftFinal = `(${leftStr})`;
			}
			if (ast.right.type === 'AND' || ast.right.type === 'OR' || ast.right.type === 'XOR') {
				rightFinal = `(${rightStr})`;
			}

			return `${leftFinal} ${ast.type} ${rightFinal}`;
		}

		return '';
	}

	try {
		// Parse the expression
		const ast = _parseExpression(expression);

		// Generate all variations
		const astVariations = _generateASTVariations(ast);

		// Convert back to strings and remove duplicates
		const stringVariations = astVariations.map(_astToString);
		const uniqueVariations = [...new Set(stringVariations)];

		return uniqueVariations;
	} catch (error) {
		// Fallback to original expression if parsing fails
		console.warn('Failed to parse expression:', expression, error);
		return [expression];
	}
}

export function shuffleExpression(expression){
            const inputVars = getInputVariables(expression);
            return replaceVariables(inputVars, expression);
}

/**
 * Parses a boolean expression to extract input variables.
 * @param {string} expression - The boolean expression string.
 * @returns {string[]} An array of unique, sorted input variable names.
 */
export function getInputVariables(expression) {

	const rightSide = expression.split(' = ')[1];

	let cleanExpression = rightSide
		.replace(/\bAND\b/g, ' | ')
		.replace(/\bOR\b/g, ' | ')
		.replace(/\bNOT\b/g, ' | ')
		.replace(/\bXOR\b/g, ' | ')
		.replace(/[()]/g, ' | ');
	const tokens = cleanExpression.split('|').map(token => token.trim()).filter(token => token.length > 0);

	return [...new Set(tokens.filter(token =>
		token.length === 1 && token.match(/[A-Z]/)
	))].sort();
}


/**
 * Replaces the input and output variables in a Boolean expression with new random ones.
 * - Input variables are replaced with unique characters from A-H.
 * - The output variable is replaced with a character from P-Z.
 * This method returns the new expression.
 * @param {string[]} inputVars - An array of the original input variables, e.g., ['A', 'B'].
 * @param {string} expression - The full original expression string, e.g., "Q = A AND (B OR A)".
 */
function replaceVariables(inputVars, expression) {
	// Ensure these don't overlap - otherwise we can end up with collisions
    const inputLetterPool = ['A','B','C','D','E','F','G','H'];
    const outputLetterPool = ['P','Q','R','S','T','U','V','W','X','Y','Z'];

    // 1. Create a shuffled list of potential replacements.
    const replacements = [...inputLetterPool].sort(() => Math.random() - 0.5);

    const inputMap = {};
    
    // 2. Assign a unique replacement to each input variable.
    for (const originalVar of inputVars) {
        if (replacements.length > 0) {
            const newVar = replacements.pop();
            inputMap[originalVar] = newVar;
        } else {
            // Fallback: If we run out of replacements, map the variable to itself.
            newVar = originalVar;
            inputMap[originalVar] = newVar; 
        }
    }
    
    // Replace the output variable.
    let newExpression = expression;
    const outputVarMatch = expression.match(/^(\w)\s*=/);
    if (outputVarMatch) {
        const outputVar = outputVarMatch[1];
        const outputReplacement = outputLetterPool[Math.floor(Math.random() * outputLetterPool.length)];
        const outputRegex = new RegExp(`^${outputVar}(\\s*=)`);
        newExpression = newExpression.replace(outputRegex, `${outputReplacement}$1`);
    }

    // Replace input variables using the corrected, collision-free map.
	// Step 1: Temporarily replace input variables with unique tokens
	const tempMap = {};
	for (const [originalVar, newVar] of Object.entries(inputMap)) {
		const tempToken = `__TMP_${originalVar}__`;
		tempMap[tempToken] = newVar;
		const regex = new RegExp(`\\b${originalVar}\\b`, 'g');
		newExpression = newExpression.replace(regex, tempToken);
	}

	// Step 2: Replace temporary tokens with final new variable names
	for (const [tempToken, newVar] of Object.entries(tempMap)) {
		const regex = new RegExp(tempToken, 'g');
		newExpression = newExpression.replace(regex, newVar);
	}
    return newExpression;
}


/**
 * Evaluates a boolean expression string with a given set of input values.
 * @param {string} expression - The expression part to evaluate.
 * @param {object} values - An object mapping variable names to boolean values.
 * @returns {boolean} The result of the evaluation.
 */
export function evaluateExpression(expression, values) {
	try {
		let evalExpression = expression;
		Object.keys(values).forEach(variable => {
			const regex = new RegExp(`\\b${variable}\\b`, 'g');
			evalExpression = evalExpression.replace(regex, values[variable]);
		});

		evalExpression = evalExpression
			.replace(/\bAND\b/g, '&&')
			.replace(/\bOR\b/g, '||')
			.replace(/\bNOT\b/g, '!')
			.replace(/\bXOR\b/g, '^')
		
		const func = new Function('return ' + evalExpression);
		return func();
	} catch (error) {
		console.error('Error evaluating expression:', expression, error);
		return false;
	}
}