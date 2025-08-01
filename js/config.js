// config.js - Application configuration and settings

import { NameThatGate } from './name-that-gate.js';
import { ExpressionWriting } from './expression-writing.js';
import { DrawCircuit } from './draw-circuit.js';
import { Scenario } from './scenario.js';
import { TruthTable } from './truth-table.js';

/**
 * Configuration for all game modes.
 * Each mode defines its label, difficulty levels, class, and dependencies.
 */
export const modeSettings = {
    nameThatGate: {
        label: 'Name That Gate',
        levels: 2,
        class: NameThatGate,
        dependencies: ['circuitGenerator']
    },
    writeExpression: {
        label: 'Expression Writing',
        levels: 4,
        class: ExpressionWriting,
        dependencies: ['circuitGenerator']
    },
    truthTable: {
        label: 'Truth Tables',
        levels: 4,
        class: TruthTable,
        dependencies: ['circuitGenerator']
    },
    drawCircuit: {
        label: 'Draw Circuit',
        levels: 4,
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
    4: 'Expert'
};

/**
 * Application-wide settings and constants.
 */
export const appSettings = {
    // Default mode to load on startup
    defaultMode: 'writeExpression',
    
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