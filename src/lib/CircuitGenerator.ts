/**
 * CircuitGenerator - Generates SVG circuits for Boolean expressions
 *
 * Used in NameThat, Expression Writing, and Truth Table modes to render
 * logic gate circuits from Boolean expressions.
 *
 * Ported from legacy/js/circuit-generator.js
 */

// AST Node Types
type ASTNode = VarNode | NotNode | BinaryOpNode;

interface VarNode {
	type: "VAR";
	name: string;
}

interface NotNode {
	type: "NOT";
	operand: ASTNode;
}

interface BinaryOpNode {
	type: "AND" | "OR" | "XOR";
	left: ASTNode;
	right: ASTNode;
}

// Layout Node Types (AST nodes with position information)
type LayoutNode = VarLayoutNode | NotLayoutNode | BinaryOpLayoutNode;

interface BaseLayoutNode {
	x: number;
	y: number;
	id: number;
	level: number;
	width: number;
	height: number;
}

interface VarLayoutNode extends BaseLayoutNode {
	type: "VAR";
	name: string;
}

interface NotLayoutNode extends BaseLayoutNode {
	type: "NOT";
	operand: LayoutNode;
}

interface BinaryOpLayoutNode extends BaseLayoutNode {
	type: "AND" | "OR" | "XOR";
	left: LayoutNode;
	right: LayoutNode;
}

// Parser result
interface ParseResult {
	node: ASTNode | null;
	pos: number;
}

export class CircuitGenerator {
	private gateId = 0;
	// private wireId = 0 // Reserved for future use
	private variablePositions = new Map<string, number>();
	private input = "";

	/**
	 * Parse expression into AST
	 * Expects format: "Q = A AND B" or just "A AND B"
	 */
	parseExpression(expr: string): ASTNode | null {
		const parts = expr.split(" = ");
		if (parts.length !== 2) {
			// Fallback for invalid format - assume no output variable specified
			this.input = "Q"; // Default to Q for backward compatibility
			return this.parseTokens(this.tokenize(expr));
		}

		this.input = parts[0];
		const rightSide = parts[1];
		return this.parseTokens(this.tokenize(rightSide));
	}

	/**
	 * Tokenize expression string into array of tokens
	 */
	tokenize(expr: string): string[] {
		const tokens: string[] = [];
		let i = 0;
		while (i < expr.length) {
			if (expr[i] === " ") {
				i++;
				continue;
			}
			if (expr[i] === "(") {
				tokens.push("(");
				i++;
			} else if (expr[i] === ")") {
				tokens.push(")");
				i++;
			} else if (expr.substr(i, 3) === "XOR") {
				tokens.push("XOR");
				i += 3;
			} else if (expr.substr(i, 3) === "AND") {
				tokens.push("AND");
				i += 3;
			} else if (expr.substr(i, 2) === "OR") {
				tokens.push("OR");
				i += 2;
			} else if (expr.substr(i, 3) === "NOT") {
				tokens.push("NOT");
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

	/**
	 * Parse tokens into AST using recursive descent parser
	 */
	parseTokens(tokens: string[]): ASTNode | null {
		return this.parseOr(tokens, 0).node;
	}

	/**
	 * Parse OR expressions (lowest precedence)
	 */
	parseOr(tokens: string[], pos: number): ParseResult {
		let result = this.parseXor(tokens, pos);

		while (result.pos < tokens.length && tokens[result.pos] === "OR") {
			const right = this.parseXor(tokens, result.pos + 1);
			result = {
				node: {
					type: "OR",
					left: result.node!,
					right: right.node!,
				},
				pos: right.pos,
			};
		}
		return result;
	}

	/**
	 * Parse XOR expressions
	 */
	parseXor(tokens: string[], pos: number): ParseResult {
		let result = this.parseAnd(tokens, pos);

		while (result.pos < tokens.length && tokens[result.pos] === "XOR") {
			const right = this.parseAnd(tokens, result.pos + 1);
			result = {
				node: {
					type: "XOR",
					left: result.node!,
					right: right.node!,
				},
				pos: right.pos,
			};
		}
		return result;
	}

	/**
	 * Parse AND expressions
	 */
	parseAnd(tokens: string[], pos: number): ParseResult {
		let result = this.parseNot(tokens, pos);

		while (result.pos < tokens.length && tokens[result.pos] === "AND") {
			const right = this.parseNot(tokens, result.pos + 1);
			result = {
				node: {
					type: "AND",
					left: result.node!,
					right: right.node!,
				},
				pos: right.pos,
			};
		}
		return result;
	}

	/**
	 * Parse NOT expressions (highest precedence)
	 */
	parseNot(tokens: string[], pos: number): ParseResult {
		if (pos < tokens.length && tokens[pos] === "NOT") {
			const operand = this.parsePrimary(tokens, pos + 1);
			return {
				node: {
					type: "NOT",
					operand: operand.node!,
				},
				pos: operand.pos,
			};
		}
		return this.parsePrimary(tokens, pos);
	}

	/**
	 * Parse primary expressions (variables and parentheses)
	 */
	parsePrimary(tokens: string[], pos: number): ParseResult {
		if (pos >= tokens.length)
			return {
				node: null,
				pos,
			};

		if (tokens[pos] === "(") {
			const result = this.parseOr(tokens, pos + 1);
			return {
				node: result.node,
				pos: result.pos + 1,
			}; // Skip closing )
		} else if (/[A-Z]/.test(tokens[pos])) {
			return {
				node: {
					type: "VAR",
					name: tokens[pos],
				},
				pos: pos + 1,
			};
		}
		return {
			node: null,
			pos,
		};
	}

	/**
	 * Generate complete SVG circuit from expression
	 * @param expression - Boolean expression (e.g., "Q = A AND B")
	 * @param container - HTML element to render into
	 * @returns SVG string
	 */
	generateCircuit(expression: string, container: HTMLElement): string {
		this.gateId = 0;
		// this.wireId = 0 // Reserved for future use
		this.variablePositions = new Map(); // Reset for each circuit generation

		// Ensuring the base expression is in uppercase for consistency
		const capitalisedExpression = expression.toUpperCase();
		const ast = this.parseExpression(capitalisedExpression);
		if (!ast) {
			container.innerHTML = "<p>Error: Could not parse expression</p>";
			return "";
		}

		const layout = this.layoutNodes(ast);
		if (!layout) {
			container.innerHTML = "<p>Error: Could not layout circuit</p>";
			return "";
		}

		const svg = this.renderSVG(layout, container);
		return svg;
	}

	/**
	 * Check if this is a simple single-gate circuit
	 */
	isSingleGateCircuit(node: ASTNode | LayoutNode): boolean {
		if (!node) return false;

		// Single gate: AND/OR/XOR with only variable children, or NOT with variable child
		if (node.type === "AND" || node.type === "OR" || node.type === "XOR") {
			const binaryNode = node as BinaryOpNode | BinaryOpLayoutNode;
			return (
				binaryNode.left &&
				binaryNode.left.type === "VAR" &&
				binaryNode.right &&
				binaryNode.right.type === "VAR"
			);
		} else if (node.type === "NOT") {
			const notNode = node as NotNode | NotLayoutNode;
			return notNode.operand && notNode.operand.type === "VAR";
		}

		return false;
	}

	/**
	 * Calculate positions for all nodes in the circuit
	 */
	layoutNodes(
		node: ASTNode,
		x: number | null = null,
		y: number | null = null,
		level = 0,
		parentGateInputY: number | null = null,
	): LayoutNode | null {
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

		const baseLayout = {
			x: x,
			y: y,
			id: this.gateId++,
			level: level,
		};

		if (node.type === "VAR") {
			const varNode = node as VarNode;
			let targetY = y;
			if (parentGateInputY !== null) {
				targetY = parentGateInputY;
			}

			return {
				...baseLayout,
				type: "VAR",
				name: varNode.name,
				width: 20,
				height: 20,
				x: 60,
				y: this.adjustVariablePosition(varNode.name, targetY),
			} as VarLayoutNode;
		} else if (node.type === "NOT") {
			const notNode = node as NotNode;
			return {
				...baseLayout,
				type: "NOT",
				width: 60,
				height: 40,
				operand: this.layoutNodes(notNode.operand, x - 90, y, level + 1, y)!,
			} as NotLayoutNode;
		} else {
			// AND, OR, or XOR
			const binaryNode = node as BinaryOpNode;
			const baseSpacing = Math.max(40, 55 - level * 5);
			const spacing = Math.min(baseSpacing, (maxY - minY) / 4);

			const leftY = Math.max(minY, Math.min(maxY, y - spacing));
			const rightY = Math.max(minY, Math.min(maxY, y + spacing));

			return {
				...baseLayout,
				type: node.type,
				width: 80,
				height: 60,
				left: this.layoutNodes(
					binaryNode.left,
					x - 100,
					leftY,
					level + 1,
					y - 15,
				)!,
				right: this.layoutNodes(
					binaryNode.right,
					x - 100,
					rightY,
					level + 1,
					y + 15,
				)!,
			} as BinaryOpLayoutNode;
		}
	}

	/**
	 * Adjust variable position to avoid overlaps
	 */
	adjustVariablePosition(varName: string, proposedY: number): number {
		const minSeparation = 30;

		// Check if this variable already has a position assigned
		if (this.variablePositions.has(varName)) {
			return this.variablePositions.get(varName)!;
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

			for (const [, existingY] of this.variablePositions) {
				if (Math.abs(adjustedY - existingY) < minSeparation) {
					const moveUp = existingY - minSeparation;
					const moveDown = existingY + minSeparation;

					if (
						Math.abs(moveUp - proposedY) < Math.abs(moveDown - proposedY) &&
						moveUp >= minY
					) {
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

	/**
	 * Calculate the depth (levels) of the circuit
	 */
	getCircuitDepth(node: ASTNode | LayoutNode | null): number {
		if (!node) return 0;
		if (node.type === "VAR") return 1;
		if (node.type === "NOT") {
			const notNode = node as NotNode | NotLayoutNode;
			return 1 + this.getCircuitDepth(notNode.operand);
		}
		const binaryNode = node as BinaryOpNode | BinaryOpLayoutNode;
		return (
			1 +
			Math.max(
				this.getCircuitDepth(binaryNode.left),
				this.getCircuitDepth(binaryNode.right),
			)
		);
	}

	/**
	 * Render complete SVG from layout
	 */
	renderSVG(layout: LayoutNode, container: HTMLElement): string {
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

		// Render connections first (so they appear behind gates)
		svg += this.renderConnections(layout);

		// Render gates
		svg += this.renderGates(layout);

		// Output label
		svg += `<text x="${width - 30}" y="${height / 2 + 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;

		// Output line to eg Q
		const rootOutput = this.getOutputPoint(layout);
		svg += `<line x1="${rootOutput.x}" y1="${rootOutput.y}" x2="${width - 50}" y2="${height / 2}" stroke="#333" stroke-width="2"/>`;

		svg += "</svg>";
		container.innerHTML = svg;
		return svg;
	}

	/**
	 * Render simple hardcoded circuits for single gates
	 */
	renderSimpleCircuit(layout: LayoutNode): string | null {
		if (!layout || !this.isSingleGateCircuit(layout)) {
			return null;
		}

		if (
			layout.type === "AND" &&
			(layout as BinaryOpLayoutNode).left &&
			(layout as BinaryOpLayoutNode).right &&
			(layout as BinaryOpLayoutNode).left.type === "VAR" &&
			(layout as BinaryOpLayoutNode).right.type === "VAR"
		) {
			// Hardcoded AND gate
			const varA = ((layout as BinaryOpLayoutNode).left as VarLayoutNode).name;
			const varB = ((layout as BinaryOpLayoutNode).right as VarLayoutNode).name;
			return `<path d="M 62 35 L 62 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="62" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="62" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		if (
			layout.type === "OR" &&
			(layout as BinaryOpLayoutNode).left &&
			(layout as BinaryOpLayoutNode).right &&
			(layout as BinaryOpLayoutNode).left.type === "VAR" &&
			(layout as BinaryOpLayoutNode).right.type === "VAR"
		) {
			// Hardcoded OR gate
			const varA = ((layout as BinaryOpLayoutNode).left as VarLayoutNode).name;
			const varB = ((layout as BinaryOpLayoutNode).right as VarLayoutNode).name;
			return `<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		if (
			layout.type === "XOR" &&
			(layout as BinaryOpLayoutNode).left &&
			(layout as BinaryOpLayoutNode).right &&
			(layout as BinaryOpLayoutNode).left.type === "VAR" &&
			(layout as BinaryOpLayoutNode).right.type === "VAR"
		) {
			// Hardcoded XOR gate - OR shape with extra input curve, lines connect to main gate body
			const varA = ((layout as BinaryOpLayoutNode).left as VarLayoutNode).name;
			const varB = ((layout as BinaryOpLayoutNode).right as VarLayoutNode).name;
			return `<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
        <path d="M 55 35 Q 70 60 55 85" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		if (
			layout.type === "NOT" &&
			(layout as NotLayoutNode).operand &&
			(layout as NotLayoutNode).operand.type === "VAR"
		) {
			// Hardcoded NOT gate
			const varA = ((layout as NotLayoutNode).operand as VarLayoutNode).name;
			return `<path d="M 60 30 L 60 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="114" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="60" x2="60" y2="60" stroke="#333" stroke-width="2"/>
        <line x1="120" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${this.input}</text>`;
		}

		return null;
	}

	/**
	 * Collect all variable names from the circuit
	 */
	collectVariables(node: LayoutNode | null, variables: Set<string>): void {
		if (!node) return;
		if (node.type === "VAR") {
			variables.add((node as VarLayoutNode).name);
		} else if (node.type === "NOT") {
			this.collectVariables((node as NotLayoutNode).operand, variables);
		} else {
			const binaryNode = node as BinaryOpLayoutNode;
			this.collectVariables(binaryNode.left, variables);
			this.collectVariables(binaryNode.right, variables);
		}
	}

	/**
	 * Render all gates in the circuit
	 */
	renderGates(node: LayoutNode | null): string {
		if (!node) return "";

		let svg = "";

		if (node.type === "AND") {
			const andNode = node as BinaryOpLayoutNode;
			svg += `<path d="M ${node.x - 40} ${node.y - 30} L ${node.x - 40} ${node.y + 30} L ${node.x - 15} ${node.y + 30} A 30 30 0 0 0 ${node.x - 15} ${node.y - 30} Z" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(andNode.left);
			svg += this.renderGates(andNode.right);
		} else if (node.type === "OR") {
			const orNode = node as BinaryOpLayoutNode;
			svg += `<path d="M ${node.x - 40} ${node.y - 30} Q ${node.x - 15} ${node.y - 30} ${node.x + 10} ${node.y} Q ${node.x - 15} ${node.y + 30} ${node.x - 40} ${node.y + 30} Q ${node.x - 25} ${node.y} ${node.x - 40} ${node.y - 30}" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(orNode.left);
			svg += this.renderGates(orNode.right);
		} else if (node.type === "XOR") {
			const xorNode = node as BinaryOpLayoutNode;
			// XOR gate - OR shape with additional input curve
			svg += `<path d="M ${node.x - 40} ${node.y - 30} Q ${node.x - 15} ${node.y - 30} ${node.x + 10} ${node.y} Q ${node.x - 15} ${node.y + 30} ${node.x - 40} ${node.y + 30} Q ${node.x - 25} ${node.y} ${node.x - 40} ${node.y - 30}" fill="none" stroke="#333" stroke-width="2"/>`;
			// Additional curved line at the input
			svg += `<path d="M ${node.x - 45} ${node.y - 30} Q ${node.x - 30} ${node.y} ${node.x - 45} ${node.y + 30}" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(xorNode.left);
			svg += this.renderGates(xorNode.right);
		} else if (node.type === "NOT") {
			const notNode = node as NotLayoutNode;
			svg += `<path d="M ${node.x - 30} ${node.y - 20} L ${node.x - 30} ${node.y + 20} L ${node.x + 19} ${node.y} Z" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += `<circle cx="${node.x + 25}" cy="${node.y}" r="5" fill="none" stroke="#333" stroke-width="2"/>`;
			svg += this.renderGates(notNode.operand);
		} else if (node.type === "VAR") {
			// Render variable labels at their positions
			svg += `<text x="${node.x - 10}" y="${node.y + 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${(node as VarLayoutNode).name}</text>`;
		}

		return svg;
	}

	/**
	 * Render all wire connections in the circuit
	 */
	renderConnections(node: LayoutNode | null): string {
		if (!node) return "";

		let svg = "";

		if (node.type === "AND") {
			const andNode = node as BinaryOpLayoutNode;
			// Connection from left child to gate
			if (andNode.left) {
				const leftOutput = this.getOutputPoint(andNode.left);
				svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 40}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
			}

			// Connection from right child to gate
			if (andNode.right) {
				const rightOutput = this.getOutputPoint(andNode.right);
				svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 40}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(andNode.left);
			svg += this.renderConnections(andNode.right);
		} else if (node.type === "OR") {
			const orNode = node as BinaryOpLayoutNode;
			// Connection from left child to gate
			if (orNode.left) {
				const leftOutput = this.getOutputPoint(orNode.left);
				svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 35}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
			}

			// Connection from right child to gate
			if (orNode.right) {
				const rightOutput = this.getOutputPoint(orNode.right);
				svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 35}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(orNode.left);
			svg += this.renderConnections(orNode.right);
		} else if (node.type === "XOR") {
			const xorNode = node as BinaryOpLayoutNode;
			// Connection from left child to gate - connect to main gate body, passing through the extra curve
			if (xorNode.left) {
				const leftOutput = this.getOutputPoint(xorNode.left);
				svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 35}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
			}

			// Connection from right child to gate - connect to main gate body, passing through the extra curve
			if (xorNode.right) {
				const rightOutput = this.getOutputPoint(xorNode.right);
				svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 35}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(xorNode.left);
			svg += this.renderConnections(xorNode.right);
		} else if (node.type === "NOT") {
			const notNode = node as NotLayoutNode;
			// Connection from operand to NOT gate
			if (notNode.operand) {
				const operandOutput = this.getOutputPoint(notNode.operand);
				svg += `<line x1="${operandOutput.x}" y1="${operandOutput.y}" x2="${node.x - 30}" y2="${node.y}" stroke="#333" stroke-width="2"/>`;
			}

			svg += this.renderConnections(notNode.operand);
		}

		return svg;
	}

	/**
	 * Get the output point coordinates for a node
	 */
	getOutputPoint(node: LayoutNode | null): { x: number; y: number } {
		if (!node) return { x: 0, y: 0 };

		if (node.type === "VAR") {
			return {
				x: node.x + 10,
				y: node.y,
			};
		} else if (node.type === "NOT") {
			return {
				x: node.x + 30,
				y: node.y,
			};
		} else if (node.type === "OR" || node.type === "XOR") {
			return {
				x: node.x + 10,
				y: node.y,
			};
		} else {
			return {
				x: node.x + 15,
				y: node.y,
			};
		}
	}
}
