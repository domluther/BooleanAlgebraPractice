/**
 * Application Configuration and Settings
 * Contains notation mappings, mode settings, and app-wide constants
 * 
 * Ported from legacy/js/config.js
 */

export type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NONE'
export type NotationType = 'word' | 'symbol'
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export interface ModeConfig {
	label: string
	levels: number
	dependencies: string[]
}

export interface ModeSettings {
	nameThat: ModeConfig
	writeExpression: ModeConfig
	truthTable: ModeConfig
	drawCircuit: ModeConfig
	scenario: ModeConfig
}

/**
 * Configuration for all game modes
 * Each mode defines its label, difficulty levels, and dependencies
 */
export const modeSettings: ModeSettings = {
	nameThat: {
		label: 'Name That',
		levels: 3,
		dependencies: ['circuitGenerator']
	},
	writeExpression: {
		label: 'Expression Writing',
		levels: 5,
		dependencies: ['circuitGenerator']
	},
	truthTable: {
		label: 'Truth Tables',
		levels: 5,
		dependencies: ['circuitGenerator']
	},
	drawCircuit: {
		label: 'Draw Circuit',
		levels: 5,
		dependencies: [] // This mode doesn't need the circuit generator
	},
	scenario: {
		label: 'Scenarios',
		levels: 4, // Level 4 is called A-Level in the UI
		dependencies: ['circuitGenerator']
	}
}

/**
 * Difficulty level labels for UI generation
 */
export const difficultyLabels: Record<DifficultyLevel, string> = {
	1: 'Easy',
	2: 'Medium',
	3: 'Hard',
	4: 'Expert',
	5: 'A-Level'
}

/**
 * Application-wide settings and constants
 */
export const appSettings = {
	// Default mode to load on startup
	defaultMode: 'nameThat' as const,
	
	// Default notation setting
	defaultNotation: 'word' as NotationType,
	
	// CSS classes used across the application
	cssClasses: {
		modeButton: 'btn btn-select',
		activeModeButton: 'active mode-active',
		feedbackCorrect: 'feedback correct',
		feedbackIncorrect: 'feedback incorrect',
		difficultySelect: 'difficulty-select',
		difficultyHeading: 'difficulty-heading'
	}
}

/**
 * Boolean operator notation mappings
 */
export const notationMaps = {
	wordToSymbol: {
		'OR': '∨',
		'AND': '∧',
		'NOT': '¬',
		'XOR': '⊻'
	} as const,
	symbolToWord: {
		'∨': 'OR',
		'∧': 'AND',
		'¬': 'NOT',
		'⊻': 'XOR'
	} as const
}

/**
 * Converts an expression from word notation to symbol notation
 * @param expression - Expression in word notation (e.g., "Q = A AND B")
 * @returns Expression in symbol notation (e.g., "Q = A ∧ B")
 */
export function convertToSymbolNotation(expression: string): string {
	let result = expression
	for (const [word, symbol] of Object.entries(notationMaps.wordToSymbol)) {
		const regex = new RegExp(`\\b${word}\\b`, 'g')
		result = result.replace(regex, symbol)
	}
	return result
}

/**
 * Converts an expression from symbol notation to word notation
 * @param expression - Expression in symbol notation (e.g., "Q = A ∧ B")
 * @returns Expression in word notation (e.g., "Q = A AND B")
 */
export function convertToWordNotation(expression: string): string {
	let result = expression
	
	// First handle keyboard-friendly symbol alternatives
	result = result.replace(/\^/g, 'AND')      // ^ → AND
	result = result.replace(/[vV]/g, 'OR')     // v or V → OR  
	result = result.replace(/!/g, 'NOT')       // ! → NOT
	
	// Then handle the proper mathematical symbols
	for (const [symbol, word] of Object.entries(notationMaps.symbolToWord)) {
		const regex = new RegExp(`\\${symbol}`, 'g')
		result = result.replace(regex, word)
	}
	return result
}

/**
 * Converts an expression to the currently selected notation type
 * @param expression - Expression in word notation (internal format)
 * @param notationType - The notation type to convert to
 * @returns Expression in the selected notation for display
 */
export function convertToNotation(expression: string, notationType: NotationType): string {
	if (notationType === 'symbol') {
		return convertToSymbolNotation(expression)
	}
	return expression // Already in word notation
}

/**
 * Gets the notation type from localStorage or returns default
 */
export function getNotationType(): NotationType {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('notationType')
		if (stored === 'word' || stored === 'symbol') {
			return stored
		}
	}
	return appSettings.defaultNotation
}

/**
 * Sets the notation type and saves to localStorage
 * @param notationType - 'word' or 'symbol'
 */
export function setNotationType(notationType: NotationType): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem('notationType', notationType)
	}
}
