/**
 * K-Map Expression Database
 * Contains expressions organised by number of variables (difficulty level)
 *
 * Level 1: 2-variable expressions → 2×2 K-Map
 * Level 2: 3-variable expressions → 2×4 K-Map
 * Level 3: 4-variable expressions → 4×4 K-Map
 * Level 4: 4-variable expressions, more complex → 4×4 K-Map
 *
 * All expressions use word notation internally (AND/OR/NOT).
 */

export interface KMapDatabase {
	level1: string[];
	level2: string[];
	level3: string[];
	level4: string[];
}

export const kmapDatabase: KMapDatabase = {
	// Level 1: 2-variable expressions (2×2 K-Map, variables A and B)
	level1: [
		// Simplifies to Q = A
		"Q = (A AND B) OR (A AND NOT B)",
		// Simplifies to Q = B
		"Q = (A AND B) OR (NOT A AND B)",
		// Simplifies to Q = NOT A
		"Q = (NOT A AND B) OR (NOT A AND NOT B)",
		// Simplifies to Q = NOT B
		"Q = (A AND NOT B) OR (NOT A AND NOT B)",
		// Simplifies to Q = A OR B
		"Q = A OR (A AND B)",
		// Simplifies to Q = A OR B
		"Q = (A AND B) OR A OR B",
		// Simplifies to Q = NOT A OR NOT B
		"Q = (NOT A) OR (NOT A AND NOT B)",
		// Simplifies to Q = B (redundant term)
		"Q = (A AND B) OR (NOT A AND B) OR B",
		// Simplifies to Q = A OR B
		"Q = (A AND B) OR (A AND NOT B) OR (NOT A AND B)",
		// Simplifies to Q = NOT A OR B
		"Q = (NOT A AND NOT B) OR B",
	],

	// Level 2: 3-variable expressions (2×4 K-Map, variables A, B, C)
	level2: [
		// Simplifies to Q = A (A absorbs all)
		"Q = A OR (A AND B) OR (A AND C)",
		// Simplifies to Q = A OR C
		"Q = A OR (B AND C) OR (NOT B AND C)",
		// Simplifies to Q = A OR (B AND C)
		"Q = (A AND B) OR (A AND NOT B) OR (B AND C)",
		// Simplifies to Q = B
		"Q = (A AND B) OR (NOT A AND B) OR (A AND B AND C)",
		// Simplifies to Q = NOT C
		"Q = (A AND NOT C) OR (NOT A AND NOT C) OR (A AND B AND NOT C)",
		// Simplifies to Q = A OR B
		"Q = (A AND B) OR (A AND NOT B) OR (NOT A AND B) OR (A AND B AND C)",
		// Simplifies to Q = (A AND B) OR (NOT A AND NOT B)
		"Q = (A AND B) OR (NOT A AND NOT B AND C) OR (NOT A AND NOT B AND NOT C)",
		// Simplifies to Q = A AND NOT B
		"Q = (A AND NOT B AND C) OR (A AND NOT B AND NOT C)",
		// Simplifies to Q = B AND C
		"Q = (A AND B AND C) OR (NOT A AND B AND C)",
		// Simplifies to Q = (NOT A AND C) OR (A AND NOT C)
		"Q = (NOT A AND B AND C) OR (NOT A AND NOT B AND C) OR (A AND B AND NOT C) OR (A AND NOT B AND NOT C)",
		// Simplifies to Q = C OR (A AND B)
		"Q = C OR (A AND B AND C) OR (A AND B AND NOT C)",
		// Simplifies to Q = NOT A OR C
		"Q = (NOT A) OR (A AND C) OR (NOT A AND B)",
		// Simplifies to Q = B OR C
		"Q = (A AND B AND C) OR (B AND NOT C) OR (NOT B AND C)",
		// Simplifies to Q = NOT B OR A
		"Q = (NOT B) OR (A AND B) OR (NOT B AND C)",
		// Simplifies to Q = (A AND C) OR NOT B
		"Q = (A AND C) OR (NOT B) OR (A AND NOT B AND C)",
		// Simplifies to Q = A OR NOT C
		"Q = A OR (NOT A AND NOT C) OR (A AND B AND NOT C)",
		// Simplifies to Q = (A AND NOT C) OR (NOT A AND B)
		"Q = (A AND B AND NOT C) OR (A AND NOT B AND NOT C) OR (NOT A AND B)",
		// Simplifies to Q = NOT A AND (B OR C)
		"Q = (NOT A AND B AND C) OR (NOT A AND B AND NOT C) OR (NOT A AND NOT B AND C)",
	],

	// Level 3: 4-variable expressions (4×4 K-Map, variables A, B, C, D)
	level3: [
		// Simplifies to Q = A OR (C AND D)
		"Q = A OR (B AND C AND D) OR (NOT B AND C AND D)",
		// Simplifies to Q = B
		"Q = B OR (A AND B) OR (B AND C) OR (B AND D)",
		// Simplifies to Q = A AND B
		"Q = (A AND B AND C) OR (A AND B AND NOT C) OR (A AND B AND D) OR (A AND B AND NOT D)",
		// Simplifies to Q = (A AND B) OR (C AND D)
		"Q = (A AND B) OR (C AND D) OR (A AND B AND C AND D)",
		// Simplifies to Q = A AND C
		"Q = (A AND B AND C) OR (A AND NOT B AND C) OR (A AND C AND D) OR (A AND C AND NOT D)",
		// Simplifies to Q = NOT A AND NOT C
		"Q = (NOT A AND NOT C) OR (NOT A AND B AND NOT C) OR (NOT A AND NOT B AND NOT C AND D)",
		// Simplifies to Q = D OR (A AND B)
		"Q = D OR (A AND B AND NOT D) OR (A AND B AND C AND D)",
		// Simplifies to Q = (A AND B) OR NOT C
		"Q = (A AND B) OR (NOT C) OR (A AND B AND NOT C AND D)",
		// Simplifies to Q = (A AND D) OR (NOT A AND NOT D)
		"Q = (A AND B AND C AND D) OR (A AND NOT B AND C AND D) OR (A AND B AND NOT C AND D) OR (A AND NOT B AND NOT C AND D) OR (NOT A AND B AND NOT D) OR (NOT A AND NOT B AND NOT D)",
		// Simplifies to Q = B AND NOT D
		"Q = (A AND B AND NOT D) OR (NOT A AND B AND NOT D) OR (B AND C AND NOT D) OR (B AND NOT C AND NOT D)",
		// Simplifies to Q = A OR B
		"Q = A OR B OR (A AND B AND C AND D)",
		// Simplifies to Q = C OR D
		"Q = (C AND D) OR (C AND NOT D) OR (NOT C AND D) OR (A AND B AND C AND D)",
		// Simplifies to Q = NOT A OR (B AND D)
		"Q = (NOT A) OR (A AND B AND D) OR (NOT A AND C AND D)",
		// Simplifies to Q = (A AND NOT B) OR (C AND D)
		"Q = (A AND NOT B) OR (C AND D) OR (A AND NOT B AND C AND D)",
		// Simplifies to Q = (NOT C AND NOT D) OR (A AND B)
		"Q = (NOT C AND NOT D) OR (A AND B) OR (A AND B AND NOT C AND NOT D)",
		// Simplifies to Q = B OR (NOT A AND D)
		"Q = B OR (NOT A AND NOT B AND D) OR (A AND B AND C)",
	],

	// Level 4: More complex 4-variable expressions (4×4 K-Map)
	level4: [
		// Simplifies to Q = (A AND B) OR (NOT A AND NOT B AND C AND D)
		"Q = (A AND B) OR (NOT A AND NOT B AND C AND D) OR (A AND B AND C)",
		// Simplifies to Q = (NOT B AND D) OR (A AND B AND NOT D)
		"Q = (NOT B AND D) OR (A AND B AND NOT D) OR (A AND NOT B AND C AND D)",
		// Simplifies to Q = A OR (NOT B AND NOT C AND NOT D)
		"Q = A OR (NOT A AND NOT B AND NOT C AND NOT D) OR (A AND B AND C)",
		// Simplifies to Q = (B AND C) OR (NOT B AND NOT C)
		"Q = (B AND C) OR (NOT B AND NOT C) OR (A AND B AND C AND D) OR (NOT A AND NOT B AND NOT C AND NOT D)",
		// Simplifies to Q = C OR (A AND NOT D)
		"Q = C OR (A AND B AND NOT C AND NOT D) OR (A AND NOT B AND NOT C AND NOT D)",
		// Simplifies to Q = (NOT A AND B) OR (A AND NOT B)
		"Q = (NOT A AND B) OR (A AND NOT B) OR (A AND NOT B AND C AND D)",
		// Simplifies to Q = (A AND C) OR (B AND D) OR (NOT A AND NOT B)
		"Q = (A AND C) OR (B AND D) OR (NOT A AND NOT B) OR (A AND B AND C AND D)",
		// Simplifies to Q = (A AND NOT D) OR (B AND C AND D)
		"Q = (A AND NOT D) OR (B AND C AND D) OR (A AND B AND NOT D) OR (A AND NOT B AND NOT D)",
		// Simplifies to Q = NOT D OR (B AND C)
		"Q = (NOT D) OR (B AND C AND D) OR (A AND NOT C AND NOT D)",
		// Simplifies to Q = (A AND B) OR (C AND NOT D) OR (NOT A AND D)
		"Q = (A AND B) OR (C AND NOT D) OR (NOT A AND D) OR (A AND B AND C AND NOT D)",
		// Simplifies to Q = (NOT A AND C) OR (A AND NOT C AND D)
		"Q = (NOT A AND C) OR (A AND NOT C AND D) OR (NOT A AND B AND C AND D)",
		// Simplifies to Q = NOT B OR (A AND C)
		"Q = (NOT B) OR (A AND B AND C) OR (NOT B AND NOT C AND NOT D)",
		// Simplifies to Q = (A AND D) OR (NOT A AND B AND C)
		"Q = (A AND D) OR (NOT A AND B AND C) OR (A AND B AND C AND D)",
	],
};
