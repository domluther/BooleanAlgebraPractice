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
		"Q = A AND B",
		"Q = A OR B",
		"Q = NOT A AND B",
		"Q = A AND NOT B",
		"Q = NOT A OR NOT B",
		"Q = NOT A AND NOT B",
		"Q = NOT A OR B",
		"Q = A OR NOT B",
	],

	// Level 2: 3-variable expressions (2×4 K-Map, variables A, B, C)
	level2: [
		"Q = A AND B AND C",
		"Q = A OR B OR C",
		"Q = (A AND B) OR C",
		"Q = A AND (B OR C)",
		"Q = NOT A AND B AND C",
		"Q = (A AND B) OR (NOT A AND C)",
		"Q = A OR (NOT B AND C)",
		"Q = (NOT A AND B) OR (A AND NOT C)",
		"Q = NOT A AND NOT B AND NOT C",
		"Q = (A OR B) AND NOT C",
		"Q = NOT A AND (B OR C)",
		"Q = (A AND NOT B AND C) OR (NOT A AND B AND NOT C)",
	],

	// Level 3: 4-variable expressions (4×4 K-Map, variables A, B, C, D)
	level3: [
		"Q = (A AND B) OR (NOT A AND B) OR (NOT C AND NOT D)",
		"Q = A AND B AND C AND D",
		"Q = (A AND B) OR (C AND D)",
		"Q = A OR (B AND C AND D)",
		"Q = (A AND NOT B AND C) OR (NOT A AND B AND NOT D)",
		"Q = NOT A AND NOT B AND NOT C AND NOT D",
		"Q = (A AND B AND C AND D) OR (NOT A AND NOT B AND NOT C AND NOT D)",
		"Q = (A AND NOT C) OR (B AND NOT D)",
		"Q = (A AND B) OR (NOT C AND NOT D)",
		"Q = (A OR B) AND NOT C AND NOT D",
	],

	// Level 4: More complex 4-variable expressions (4×4 K-Map)
	level4: [
		"Q = (A AND B AND NOT C AND D) OR (NOT A AND B AND C AND NOT D) OR (A AND NOT B AND C AND D)",
		"Q = (A OR B) AND (C OR D)",
		"Q = (A AND NOT B) OR (NOT A AND B) OR (C AND D)",
		"Q = (NOT A AND NOT B AND C AND D) OR (A AND B AND NOT C AND D) OR (A AND NOT B AND NOT C AND NOT D)",
		"Q = (A AND C) OR (B AND D) OR (NOT A AND NOT B)",
		"Q = (A AND NOT C) OR (NOT B AND D) OR (A AND B AND C)",
		"Q = NOT A AND (B OR C OR D)",
		"Q = (A AND B) OR (NOT A AND NOT B AND C AND D)",
	],
};
