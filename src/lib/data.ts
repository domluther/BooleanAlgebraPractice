/**
 * Expression Database for Boolean Algebra Practice
 * Contains all questions organized by difficulty level
 * 
 * IMPORTANT: Keep this data synchronized with legacy/js/data.js
 * Do not modify expressions - they are carefully curated for educational progression
 */

export interface ExpressionDatabase {
	level1: string[]
	level2: string[]
	level2NoOverlap: string[]
	level3: string[]
	level4: string[]
	level5: string[]
}

/**
 * Complete expression database with all difficulty levels
 * Expressions use word notation internally (AND/OR/NOT/XOR)
 */
export const expressionDatabase: ExpressionDatabase = {
	// Level 1: Basic single gate expressions (GCSE)
	level1: [
		"Q = A AND B",
		"Q = A OR B",
		"Q = NOT A",
		"Q = NOT B",
	],
	
	// Level 2: Two-gate combinations with all commutative variations
	level2: [
		"Q = (A AND B) AND C",
		"Q = (A AND B) OR C",
		"Q = (A AND C) AND B",
		"Q = (A AND C) OR B",
		"Q = (A OR B) AND C",
		"Q = (A OR B) OR C",
		"Q = (A OR C) AND B",
		"Q = (A OR C) OR B",
		"Q = (B AND C) AND A",
		"Q = (B AND C) OR A",
		"Q = (B OR C) AND A",
		"Q = (B OR C) OR A",
		"Q = A AND (B AND C)",
		"Q = A AND (B OR C)",
		"Q = A AND (C AND B)",
		"Q = A AND (C OR B)",
		"Q = A OR (B AND C)",
		"Q = A OR (B OR C)",
		"Q = A OR (C AND B)",
		"Q = A OR (C OR B)",
		"Q = B AND (A AND C)",
		"Q = B AND (A OR C)",
		"Q = B AND (C AND A)",
		"Q = B AND (C OR A)",
		"Q = B OR (A AND C)",
		"Q = B OR (A OR C)",
		"Q = B OR (C AND A)",
		"Q = B OR (C OR A)",
		"Q = C AND (A AND B)",
		"Q = C AND (A OR B)",
		"Q = C AND (B AND A)",
		"Q = C AND (B OR A)",
		"Q = C OR (A AND B)",
		"Q = C OR (A OR B)",
		"Q = C OR (B AND A)",
		"Q = C OR (B OR A)",
		'Q = NOT (NOT A)',
		"Q = NOT (A OR B)",
		"Q = NOT (A AND B)",
	],
	
	// Level 2 No Overlap: Designed specifically for Name That mode
	// Reduced commutative duplicates to ensure unique truth tables
	level2NoOverlap: [
		"Q = (A AND B) AND C",
		"Q = (A AND B) OR C",
		"Q = (A AND C) OR B",
		"Q = (A OR B) AND C",
		"Q = (A OR B) OR C",
		"Q = (A OR C) AND B",
		"Q = (A OR C) OR B",
		"Q = (B AND C) OR A",
		"Q = (B OR C) AND A",
		"Q = (B OR C) OR A",
		"Q = A OR (B AND C)",
		"Q = A OR (B OR C)",
		"Q = A OR (C AND D)",
		"Q = A OR (D OR B)",
		"Q = B AND (A OR C)",
		"Q = B OR (A OR A)",
		"Q = C AND (A OR B)",
		"Q = B AND (B OR A)",
		'Q = NOT (NOT A)',
		"Q = NOT (A OR B)",
		"Q = NOT (A AND B)",
	],
	
	// Level 3: Complex expressions with multiple gates and NOT operations
	level3: [
		'Q = (A AND B) OR (C AND D)',
		'Q = (A OR B) AND (C OR D)',
		'Q = (A AND B) AND (C OR D)',
		'Q = (A OR B) OR (C AND D)',
		'Q = (NOT (A AND B)) OR C',
		'Q = (NOT (A OR B)) AND C',
		'Q = A AND (NOT (B OR C))',
		'Q = A OR (NOT (B AND C))',
		'Q = (NOT A) AND (NOT B)',
		'Q = (NOT A) OR (NOT B)',
		'Q = ((NOT A) AND B) OR C',
		'Q = (A AND (NOT B)) OR C',
		'Q = ((NOT A) OR B) AND C',
		'Q = (A OR (NOT B)) AND C',
		'Q = NOT ((NOT A) AND B)',
		'Q = NOT (A AND (NOT B))',
		'Q = (A AND B) OR (NOT C)',
		'Q = (A OR B) AND (NOT C)',
		'Q = (NOT A) AND (B OR C)',
		'Q = (NOT A) OR (B AND C)',
		'Q = ((NOT A) AND (NOT B)) AND C',
		'Q = ((NOT A) OR (NOT B)) OR C',
		'Q = (A AND (NOT B)) AND C',
		'Q = (A OR (NOT B)) OR C',
		'Q = NOT ((A OR B) OR C)',
		'Q = NOT ((A AND B) AND C)',
		'Q = (A AND (NOT B)) OR C',
		'Q = (A OR (NOT B)) AND C'
	],
	
	// Level 4: Advanced expressions with 4-5 variables
	level4: [
		'Q = ((A AND B) OR (C AND D)) OR E',
		'Q = (A AND (B OR C)) AND (D OR E)',
		'Q = ((A OR B) AND (C AND D)) OR E',
		'Q = (A OR (B AND C)) OR (D AND E)',
		'Q = (NOT (A AND B)) OR (C AND D)',
		'Q = (A AND B) AND (NOT (C OR D))',
		'Q = ((NOT A) OR B) AND (C OR (NOT D))',
		'Q = (A AND ((NOT B) OR C)) OR (D AND E)'
	],
	
	// Level 5: A-Level expressions including XOR gates
	level5: [
		'Q = A XOR B',
		'Q = (A AND NOT B) OR (B AND NOT A)',
		'Q = (A OR NOT B) AND C',
		'Q = NOT (A AND B) OR (C AND NOT D)',
		'Q = (A XOR B) AND C',
		'Q = (A AND C) XOR (B AND C)',
		'Q = (A OR B) XOR (B AND C)',
		'Q = (A AND (NOT B)) XOR C',
		'Q = A XOR (B OR C)',
		'Q = A XOR (B AND C)',
		'Q = (A XOR B) OR C',
		'Q = (A XOR B) XOR C',
		'Q = A AND (B XOR C)',
		'Q = A OR (B XOR C)',
		'Q = (A AND B) XOR C',
		'Q = (A OR B) XOR C',
		'Q = NOT (A XOR B)',
		'Q = (NOT A) XOR B',
		'Q = A XOR (NOT B)',
		'Q = (A XOR B) AND (C OR D)',
		'Q = (A XOR B) XOR (C AND D)',
		'Q = (A AND B) XOR (C OR D)',
		'Q = (A OR B) XOR (C AND D)',
		'Q = A XOR (B XOR C)',
		'Q = (A XOR C) AND (B XOR D)',
		'Q = (A XOR C) OR (B AND D)',
		'Q = ((NOT A) XOR B) AND C',
		'Q = A XOR ((NOT B) AND C)',
		'Q = (A AND (NOT B)) XOR (C OR D)',
		'Q = (A OR (NOT B)) XOR (C AND D)',
		'Q = NOT ((A XOR B) AND C)',
		'Q = NOT (A XOR (B OR C))',
		'Q = C XOR (NOT (A OR B))',
		'Q = (A XOR B) XOR C',
		'Q = ((A XOR B) AND C) OR (A AND B)'
	]
}
