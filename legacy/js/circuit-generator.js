// circuit-generator.js
// Generates SVG for expressions - used in expression writing + truth table modes

// TODO - Add a shuffle option ie commutation to practice that
export class CircuitGenerator {
	constructor() {
		this.gateId = 0;
		this.wireId = 0;
		this.variablePositions = new Map(); // Track variable positions to avoid overlaps
		this.input = '';
	}

	parseExpression(expr) {
		const parts = expr.split(' = ');
		if (parts.length !== 2) {
			// Fallback for invalid format - assume no output variable specified
			this.input = 'Q'; // Default to Q for backward compatibility
			return this.parseTokens(this.tokenize(expr));
		}
		
		this.input = parts[0];
		const rightSide = parts[1];
		return this.parseTokens(this.tokenize(rightSide));
	}

	tokenize(expr) {
		const tokens = [];
		let i = 0;
		while (i < expr.length) {
			if (expr[i] === ' ') {
				i++;
				continue;
			}
			if (expr[i] === '(') {
				tokens.push('(');
				i++;
			} else if (expr[i] === ')') {
				tokens.push(')');
				i++;
			} else if (expr.substr(i, 3) === 'XOR') {
				tokens.push('XOR');
				i += 3;
			} else if (expr.substr(i, 3) === 'AND') {
				tokens.push('AND');
				i += 3;
			} else if (expr.substr(i, 2) === 'OR') {
				tokens.push('OR');
				i += 2;
			} else if (expr.substr(i, 3) === 'NOT') {
				tokens.push('NOT');
				i += 3;
			} else if (/[A-Z]/.test(expr[i])) {
				tokens.push(expr[i]);
				i++;
			} else {
				i++;
			}
		}
		return tokens;
	}

	parseTokens(tokens) {
		return this.parseOr(tokens, 0).node;
	}

	parseOr(tokens, pos) {
		let result = this.parseXor(tokens, pos);

		while (result.pos < tokens.length && tokens[result.pos] === 'OR') {
			const right = this.parseXor(tokens, result.pos + 1);
			result = {
				node: {
					type: 'OR',
					left: result.node,
					right: right.node
				},
				pos: right.pos
			};
		}
		return result;
	}

	parseXor(tokens, pos) {
		let result = this.parseAnd(tokens, pos);

		while (result.pos < tokens.length && tokens[result.pos] === 'XOR') {
			const right = this.parseAnd(tokens, result.pos + 1);
			result = {
				node: {
					type: 'XOR',
					left: result.node,
					right: right.node
				},
				pos: right.pos
			};
		}
		return result;
	}

	parseAnd(tokens, pos) {
		let result = this.parseNot(tokens, pos);

		while (result.pos < tokens.length && tokens[result.pos] === 'AND') {
			const right = this.parseNot(tokens, result.pos + 1);
			result = {
				node: {
					type: 'AND',
					left: result.node,
					right: right.node
				},
				pos: right.pos
			};
		}
		return result;
	}

	parseNot(tokens, pos) {
		if (pos < tokens.length && tokens[pos] === 'NOT') {
			const operand = this.parsePrimary(tokens, pos + 1);
			return {
				node: {
					type: 'NOT',
					operand: operand.node
				},
				pos: operand.pos
			};
		}
		return this.parsePrimary(tokens, pos);
	}

	parsePrimary(tokens, pos) {
		if (pos >= tokens.length) return {
			node: null,
			pos
		};

		if (tokens[pos] === '(') {
			const result = this.parseOr(tokens, pos + 1);
			return {
				node: result.node,
				pos: result.pos + 1
			}; // Skip closing )
		} else if (/[A-Z]/.test(tokens[pos])) {
			return {
				node: {
					type: 'VAR',
					name: tokens[pos]
				},
				pos: pos + 1
			};
		}
		return {
			node: null,
			pos
		};
	}

	generateCircuit(expression, container) {
		this.gateId = 0;
		this.wireId = 0;
		this.variablePositions = new Map(); // Reset for each circuit generation

		// Ensuring the base expression is in uppercase for consistency
		const capitalisedExpression = expression.toUpperCase();
		const ast = this.parseExpression(capitalisedExpression);
		const layout = this.layoutNodes(ast);
		const svg = this.renderSVG(layout, container);

		return svg;
	}

	// Check if this is a simple single-gate circuit
	isSingleGateCircuit(node) {
		if (!node) return false;

		// Single gate: AND/OR/XOR with only variable children, or NOT with variable child
		if (node.type === 'AND' || node.type === 'OR' || node.type === 'XOR') {
			return (node.left && node.left.type === 'VAR') &&
				(node.right && node.right.type === 'VAR');
		} else if (node.type === 'NOT') {
			return node.operand && node.operand.type === 'VAR';
		}

		return false;
	}

	layoutNodes(node, x = null, y = null, level = 0, parentGateInputY = null) {
		if (!node) return null;

		// Calculate circuit depth for width determination
		const depth = this.getCircuitDepth(node);
		const baseWidth = Math.max(300, depth * 100);

		if (x === null) {
			x = baseWidth - 50;
		}

		if (y === null) {
			y = 125;
		}

		const minY = 40;
		const maxY = 210;
		y = Math.max(minY, Math.min(maxY, y));

		const nodeLayout = {
			...node,
			x: x,
			y: y,
			id: this.gateId++,
			level: level
		};

		if (node.type === 'VAR') {
			nodeLayout.width = 20;
			nodeLayout.height = 20;
			nodeLayout.x = 60;

			let targetY = y;
			if (parentGateInputY !== null) {
				targetY = parentGateInputY;
			}

			nodeLayout.y = this.adjustVariablePosition(node.name, targetY);
		} else if (node.type === 'NOT') {
			nodeLayout.width = 60;
			nodeLayout.height = 40;
			nodeLayout.operand = this.layoutNodes(node.operand, x - 90, y, level + 1, y);
		} else { // AND, OR, or XOR
			nodeLayout.width = 80;
			nodeLayout.height = 60;

			const baseSpacing = Math.max(40, 55 - (level * 5));
			const spacing = Math.min(baseSpacing, (maxY - minY) / 4);

			const leftY = Math.max(minY, Math.min(maxY, y - spacing));
			const rightY = Math.max(minY, Math.min(maxY, y + spacing));

			nodeLayout.left = this.layoutNodes(node.left, x - 100, leftY, level + 1, y - 15);
			nodeLayout.right = this.layoutNodes(node.right, x - 100, rightY, level + 1, y + 15);
		}

		return nodeLayout;
	}

	adjustVariablePosition(varName, proposedY) {
		const minSeparation = 30;

		// Check if this variable already has a position assigned
		if (this.variablePositions.has(varName)) {
			return this.variablePositions.get(varName);
		}

		let adjustedY = proposedY;
		let conflictFound = true;
		let attempts = 0;
		const maxAttempts = 10;

		const minY = 40;
		const maxY = 210;

		while (conflictFound && attempts < maxAttempts) {
			conflictFound = false;
			attempts++;

			for (const [existingVar, existingY] of this.variablePositions) {
				if (Math.abs(adjustedY - existingY) < minSeparation) {
					const moveUp = existingY - minSeparation;
					const moveDown = existingY + minSeparation;

					if (Math.abs(moveUp - proposedY) < Math.abs(moveDown - proposedY) && moveUp >= minY) {
						adjustedY = moveUp;
					} else if (moveDown <= maxY) {
						adjustedY = moveDown;
					} else if (moveUp >= minY) {
						adjustedY = moveUp;
					} else {
						adjustedY = Math.max(minY, Math.min(maxY, proposedY));
					}

					conflictFound = true;
					break;
				}
			}
		}

		adjustedY = Math.max(minY, Math.min(maxY, adjustedY));
		this.variablePositions.set(varName, adjustedY);

		return adjustedY;
	}

	getCircuitDepth(node) {
		if (!node) return 0;
		if (node.type === 'VAR') return 1;
		if (node.type === 'NOT') return 1 + this.getCircuitDepth(node.operand);
		return 1 + Math.max(this.getCircuitDepth(node.left), this.getCircuitDepth(node.right));
	}

	renderSVG(layout, container) {
		// Check for simple hardcoded cases first
		const simpleResult = this.renderSimpleCircuit(layout);
		if (simpleResult) {
			const svg = `<svg width="200" height="120" viewBox="0 0 200 120">${simpleResult}</svg>`;
			container.innerHTML = svg;
			return svg;
		}

		// Calculate dynamic width based on circuit complexity
		const depth = this.getCircuitDepth(layout);
		const width = Math.max(350, depth * 100 + 100);
		const height = 250;
		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

		// Collect all variables for input labels
		const variables = new Set();
		this.collectVariables(layout, variables);

		// Render connections first (so they appear behind gates)
		svg += this.renderConnections(layout);

		// Render gates
		svg += this.renderGates(layout);

		// Output label
		svg += `<text x="${width - 30}" y="${height/2 + 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;

		// Output line to eg Q
		const rootOutput = this.getOutputPoint(layout);
		svg += `<line x1="${rootOutput.x}" y1="${rootOutput.y}" x2="${width - 50}" y2="${height/2}" stroke="#333" stroke-width="2"/>`;

		svg += '</svg>';
		container.innerHTML = svg;
		return svg;
	}

	renderSimpleCircuit(layout) {
		if (!layout || !this.isSingleGateCircuit(layout)) {
			return null;
		}

		if (layout.type === 'AND' && layout.left && layout.right &&
			layout.left.type === 'VAR' && layout.right.type === 'VAR') {
			// Hardcoded AND gate
			const varA = layout.left.name;
			const varB = layout.right.name;
			return `<path d="M 62 35 L 62 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="62" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="62" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		if (layout.type === 'OR' && layout.left && layout.right &&
			layout.left.type === 'VAR' && layout.right.type === 'VAR') {
			// Hardcoded OR gate
			const varA = layout.left.name;
			const varB = layout.right.name;
			return `<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		if (layout.type === 'XOR' && layout.left && layout.right &&
			layout.left.type === 'VAR' && layout.right.type === 'VAR') {
			// Hardcoded XOR gate - OR shape with extra input curve, lines connect to main gate body
			const varA = layout.left.name;
			const varB = layout.right.name;
			return `<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
        <path d="M 55 35 Q 70 60 55 85" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		if (layout.type === 'NOT' && layout.operand && layout.operand.type === 'VAR') {
			// Hardcoded NOT gate
			const varA = layout.operand.name;
			return `<path d="M 60 30 L 60 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="114" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="60" x2="60" y2="60" stroke="#333" stroke-width="2"/>
        <line x1="120" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		return null;
	}

	collectVariables(node, variables) {
		if (!node) return;
		if (node.type === 'VAR') {
			variables.add(node.name);
		} else if (node.type === 'NOT') {
			this.collectVariables(node.operand, variables);
		} else {
			this.collectVariables(node.left, variables);
			this.collectVariables(node.right, variables);
		}
	}

	renderGates(node) {
		if (!node) return '';

		let svg = '';

		if (node.type === 'AND') {
			svg += `<path d="M ${node.x - 40} ${node.y - 30} L ${node.x - 40} ${node.y + 30} L ${node.x - 15} ${node.y + 30} A 30 30 0 0 0 ${node.x - 15} ${node.y - 30} Z" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(node.left);
			svg += this.renderGates(node.right);
		} else if (node.type === 'OR') {
			svg += `<path d="M ${node.x - 40} ${node.y - 30} Q ${node.x - 15} ${node.y - 30} ${node.x + 10} ${node.y} Q ${node.x - 15} ${node.y + 30} ${node.x - 40} ${node.y + 30} Q ${node.x - 25} ${node.y} ${node.x - 40} ${node.y - 30}" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(node.left);
			svg += this.renderGates(node.right);
		} else if (node.type === 'XOR') {
			// XOR gate - OR shape with additional input curve
			svg += `<path d="M ${node.x - 40} ${node.y - 30} Q ${node.x - 15} ${node.y - 30} ${node.x + 10} ${node.y} Q ${node.x - 15} ${node.y + 30} ${node.x - 40} ${node.y + 30} Q ${node.x - 25} ${node.y} ${node.x - 40} ${node.y - 30}" fill="none" stroke="#333" stroke-width="2"/>`;
			// Additional curved line at the input
			svg += `<path d="M ${node.x - 45} ${node.y - 30} Q ${node.x - 30} ${node.y} ${node.x - 45} ${node.y + 30}" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(node.left);
			svg += this.renderGates(node.right);
		} else if (node.type === 'NOT') {
			svg += `<path d="M ${node.x - 30} ${node.y - 20} L ${node.x - 30} ${node.y + 20} L ${node.x + 19} ${node.y} Z" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += `<circle cx="${node.x + 25}" cy="${node.y}" r="5" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(node.operand);
		} else if (node.type === 'VAR') {
			// Render variable labels at their positions
			svg += `<text x="${node.x - 10}" y="${node.y + 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${node.name}</text>`;
		}

		return svg;
	}

	renderConnections(node) {
		if (!node) return '';

		let svg = '';

		if (node.type === 'AND') {
			// Connection from left child to gate
			if (node.left) {
				const leftOutput = this.getOutputPoint(node.left);
				svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 40}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
			}

			// Connection from right child to gate
			if (node.right) {
				const rightOutput = this.getOutputPoint(node.right);
				svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 40}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(node.left);
			svg += this.renderConnections(node.right);
		} else if (node.type === 'OR') {
			// Connection from left child to gate
			if (node.left) {
				const leftOutput = this.getOutputPoint(node.left);
				svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 35}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
			}

			// Connection from right child to gate
			if (node.right) {
				const rightOutput = this.getOutputPoint(node.right);
				svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 35}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(node.left);
			svg += this.renderConnections(node.right);
		} else if (node.type === 'XOR') {
			// Connection from left child to gate - connect to main gate body, passing through the extra curve
			if (node.left) {
				const leftOutput = this.getOutputPoint(node.left);
				svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 35}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
			}

			// Connection from right child to gate - connect to main gate body, passing through the extra curve
			if (node.right) {
				const rightOutput = this.getOutputPoint(node.right);
				svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 35}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(node.left);
			svg += this.renderConnections(node.right);
		} else if (node.type === 'NOT') {
			// Connection from operand to NOT gate
			if (node.operand) {
				const operandOutput = this.getOutputPoint(node.operand);
				svg += `<line x1="${operandOutput.x}" y1="${operandOutput.y}" x2="${node.x - 30}" y2="${node.y}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(node.operand);
		}

		return svg;
	}

	getOutputPoint(node) {
		if (!node) return {
			x: 0,
			y: 0
		};

		if (node.type === 'VAR') {
			return {
				x: node.x + 10,
				y: node.y
			};
		} else if (node.type === 'NOT') {
			return {
				x: node.x + 30,
				y: node.y
			};
		} else if (node.type === 'OR' || node.type === 'XOR') {
			return {
				x: node.x + 10,
				y: node.y
			};
		} else {
			return {
				x: node.x + 15,
				y: node.y
			};
		}
	}
}