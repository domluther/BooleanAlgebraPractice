import { beforeEach, describe, expect, it } from "vitest";
import {
	convertToNotation,
	convertToSymbolNotation,
	convertToWordNotation,
	difficultyLabels,
	getNotationType,
	modeSettings,
	notationMaps,
	setNotationType,
} from "../config";

/**
 * Tests for configuration and notation conversion functions
 */

describe("convertToSymbolNotation", () => {
	it("should convert AND to ∧", () => {
		expect(convertToSymbolNotation("A AND B")).toBe("A ∧ B");
	});

	it("should convert OR to ∨", () => {
		expect(convertToSymbolNotation("A OR B")).toBe("A ∨ B");
	});

	it("should convert NOT to ¬", () => {
		expect(convertToSymbolNotation("NOT A")).toBe("¬ A");
	});

	it("should convert XOR to ⊻", () => {
		expect(convertToSymbolNotation("A XOR B")).toBe("A ⊻ B");
	});

	it("should convert all operators in complex expression", () => {
		expect(convertToSymbolNotation("Q = (A AND B) OR NOT C")).toBe(
			"Q = (A ∧ B) ∨ ¬ C",
		);
	});

	it("should only convert whole words (not partial matches)", () => {
		expect(convertToSymbolNotation("ANDY")).toBe("ANDY"); // Should not convert 'AND' in 'ANDY'
	});

	it("should handle multiple occurrences", () => {
		expect(convertToSymbolNotation("A AND B AND C")).toBe("A ∧ B ∧ C");
	});
});

describe("convertToWordNotation", () => {
	it("should convert ∧ to AND", () => {
		expect(convertToWordNotation("A ∧ B")).toBe("A AND B");
	});

	it("should convert ∨ to OR", () => {
		expect(convertToWordNotation("A ∨ B")).toBe("A OR B");
	});

	it("should convert ¬ to NOT", () => {
		expect(convertToWordNotation("¬ A")).toBe("NOT A");
	});

	it("should convert ⊻ to XOR", () => {
		expect(convertToWordNotation("A ⊻ B")).toBe("A XOR B");
	});

	it("should convert keyboard-friendly alternatives", () => {
		expect(convertToWordNotation("A ^ B")).toBe("A AND B"); // ^ to AND
		expect(convertToWordNotation("A v B")).toBe("A OR B"); // v to OR
		expect(convertToWordNotation("A V B")).toBe("A OR B"); // V to OR
		expect(convertToWordNotation("! A")).toBe("NOT A"); // ! to NOT
	});

	it("should convert complex expressions", () => {
		expect(convertToWordNotation("Q = (A ∧ B) ∨ ¬ C")).toBe(
			"Q = (A AND B) OR NOT C",
		);
	});

	it("should handle mixed keyboard and symbol notation", () => {
		expect(convertToWordNotation("A ^ B v C")).toBe("A AND B OR C");
	});
});

describe("convertToNotation", () => {
	it("should convert to symbols when type is symbol", () => {
		expect(convertToNotation("A AND B", "symbol")).toBe("A ∧ B");
	});

	it("should keep word notation when type is word", () => {
		expect(convertToNotation("A AND B", "word")).toBe("A AND B");
	});

	it("should handle complex expressions in both modes", () => {
		const expr = "Q = (A AND B) OR NOT C";
		expect(convertToNotation(expr, "word")).toBe(expr);
		expect(convertToNotation(expr, "symbol")).toBe("Q = (A ∧ B) ∨ ¬ C");
	});
});

describe("localStorage functions", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	it("should save notation type to localStorage", () => {
		setNotationType("symbol");
		expect(localStorage.getItem("notationType")).toBe("symbol");
	});

	it("should get notation type from localStorage", () => {
		localStorage.setItem("notationType", "symbol");
		expect(getNotationType()).toBe("symbol");
	});

	it("should return default when localStorage is empty", () => {
		expect(getNotationType()).toBe("word");
	});

	it("should handle invalid values in localStorage", () => {
		localStorage.setItem("notationType", "invalid");
		expect(getNotationType()).toBe("word"); // Should return default
	});
});

describe("notationMaps", () => {
	it("should have correct word to symbol mappings", () => {
		expect(notationMaps.wordToSymbol.AND).toBe("∧");
		expect(notationMaps.wordToSymbol.OR).toBe("∨");
		expect(notationMaps.wordToSymbol.NOT).toBe("¬");
		expect(notationMaps.wordToSymbol.XOR).toBe("⊻");
	});

	it("should have correct symbol to word mappings", () => {
		expect(notationMaps.symbolToWord["∧"]).toBe("AND");
		expect(notationMaps.symbolToWord["∨"]).toBe("OR");
		expect(notationMaps.symbolToWord["¬"]).toBe("NOT");
		expect(notationMaps.symbolToWord["⊻"]).toBe("XOR");
	});

	it("should be inverse of each other", () => {
		// Every word should map to a symbol that maps back to the word
		for (const [word, symbol] of Object.entries(notationMaps.wordToSymbol)) {
			expect(notationMaps.symbolToWord[symbol]).toBe(word);
		}
	});
});

describe("difficultyLabels", () => {
	it("should have labels for all 5 levels", () => {
		expect(difficultyLabels[1]).toBe("Easy");
		expect(difficultyLabels[2]).toBe("Medium");
		expect(difficultyLabels[3]).toBe("Hard");
		expect(difficultyLabels[4]).toBe("Expert");
		expect(difficultyLabels[5]).toBe("A-Level");
	});
});

describe("modeSettings", () => {
	it("should have configuration for all 5 modes", () => {
		expect(modeSettings.nameThat).toBeDefined();
		expect(modeSettings.writeExpression).toBeDefined();
		expect(modeSettings.truthTable).toBeDefined();
		expect(modeSettings.drawCircuit).toBeDefined();
		expect(modeSettings.scenario).toBeDefined();
	});

	it("should have correct levels for each mode", () => {
		expect(modeSettings.nameThat.levels).toBe(3);
		expect(modeSettings.writeExpression.levels).toBe(5);
		expect(modeSettings.truthTable.levels).toBe(5);
		expect(modeSettings.drawCircuit.levels).toBe(5);
		expect(modeSettings.scenario.levels).toBe(4);
	});

	it("should have correct labels for each mode", () => {
		expect(modeSettings.nameThat.label).toBe("Name That");
		expect(modeSettings.writeExpression.label).toBe("Expression Writing");
		expect(modeSettings.truthTable.label).toBe("Truth Tables");
		expect(modeSettings.drawCircuit.label).toBe("Draw Circuit");
		expect(modeSettings.scenario.label).toBe("Scenarios");
	});

	it("should specify dependencies correctly", () => {
		expect(modeSettings.nameThat.dependencies).toEqual(["circuitGenerator"]);
		expect(modeSettings.writeExpression.dependencies).toEqual([
			"circuitGenerator",
		]);
		expect(modeSettings.truthTable.dependencies).toEqual(["circuitGenerator"]);
		expect(modeSettings.drawCircuit.dependencies).toEqual([]);
		expect(modeSettings.scenario.dependencies).toEqual(["circuitGenerator"]);
	});
});
