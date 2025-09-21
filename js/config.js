// config.js - Application configuration and settings

import { NameThat } from './name-that.js';
import { ExpressionWriting } from './expression-writing.js';
import { DrawCircuit } from './draw-circuit.js';
import { Scenario } from './scenario.js';
import { TruthTable } from './truth-table.js';

/**
 * Configuration for all game modes.
 * Each mode defines its label, difficulty levels, class, and dependencies.
 */
export const modeSettings = {
    nameThat: {
        label: 'Name That',
        levels: 3,
        class: NameThat,
        dependencies: ['circuitGenerator']
    },
    writeExpression: {
        label: 'Expression Writing',
        levels: 5,
        class: ExpressionWriting,
        dependencies: ['circuitGenerator']
    },
    truthTable: {
        label: 'Truth Tables',
        levels: 5,
        class: TruthTable,
        dependencies: ['circuitGenerator']
    },
    drawCircuit: {
        label: 'Draw Circuit',
        levels: 5,
        class: DrawCircuit,
        dependencies: [] // This mode doesn't need the circuit generator
    },
    scenario: {
        label: 'Scenarios',
        levels: 3,
        class: Scenario,
        dependencies: ['circuitGenerator']
    }
};

/**
 * Difficulty level labels for UI generation.
 */
export const difficultyLabels = {
    1: 'Easy',
    2: 'Medium', 
    3: 'Hard',
    4: 'Expert',
    5: 'A-Level'
};

/**
 * Application-wide settings and constants.
 */
export const appSettings = {
    // Default mode to load on startup
    defaultMode: 'nameThat',
    
    // Default notation setting
    defaultNotation: 'word', // 'word' or 'symbol'
    
    // UI element selectors (centralized for easier maintenance)
    selectors: {
        modeSelector: '#modeSelector',
        feedback: '#feedback',
        nextBtn: '#nextBtn',
        submitBtn: '#submitBtn',
        scoreDisplay: '#scoreDisplay',
        generateRandomBtn: '#generateRandomBtn'
    },
    
    // CSS classes used across the application
    cssClasses: {
        modeButton: 'btn btn-select',
        activeModeButton: 'active mode-active',
        feedbackCorrect: 'feedback correct',
        feedbackIncorrect: 'feedback incorrect',
        difficultySelect: 'difficulty-select',
        difficultyHeading: 'difficulty-heading'
    }
};

/**
 * Boolean operator notation mappings
 */
export const notationMaps = {
    wordToSymbol: {
        'OR': '∨',
        'AND': '∧',
        'NOT': '¬',
        'XOR': '⊻'
    },
    symbolToWord: {
        '∨': 'OR',
        '∧': 'AND', 
        '¬': 'NOT',
        '⊻': 'XOR'
    }
};

/**
 * Current application state
 */
export const appState = {
    notationType: localStorage.getItem('notationType') || appSettings.defaultNotation
};

/**
 * Converts an expression from word notation to symbol notation
 * @param {string} expression - Expression in word notation (e.g., "Q = A AND B")
 * @returns {string} Expression in symbol notation (e.g., "Q = A ∧ B")
 */
export function convertToSymbolNotation(expression) {
    let result = expression;
    for (const [word, symbol] of Object.entries(notationMaps.wordToSymbol)) {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        result = result.replace(regex, symbol);
    }
    return result;
}

/**
 * Converts an expression from symbol notation to word notation
 * @param {string} expression - Expression in symbol notation (e.g., "Q = A ∧ B")
 * @returns {string} Expression in word notation (e.g., "Q = A AND B")
 */
export function convertToWordNotation(expression) {
    let result = expression;
    for (const [symbol, word] of Object.entries(notationMaps.symbolToWord)) {
        const regex = new RegExp(`\\${symbol}`, 'g');
        result = result.replace(regex, word);
    }
    return result;
}

/**
 * Converts an expression to the currently selected notation type
 * @param {string} expression - Expression in word notation (internal format)
 * @returns {string} Expression in the selected notation for display
 */
export function convertToCurrentNotation(expression) {
    if (appState.notationType === 'symbol') {
        return convertToSymbolNotation(expression);
    }
    return expression; // Already in word notation
}

/**
 * Sets the notation type and saves to localStorage
 * @param {string} notationType - 'word' or 'symbol'
 */
export function setNotationType(notationType) {
    appState.notationType = notationType;
    localStorage.setItem('notationType', notationType);
}