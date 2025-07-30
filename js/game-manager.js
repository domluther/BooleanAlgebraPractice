// game-manager.js

// EFFICIENCY: As the number of modes grows, consider lazy loading them
// dynamically instead of importing all of them at the start.
import { NameThatGate } from './name-that-gate.js';
import { ExpressionWriting } from './expression-writing.js';
import { DrawCircuit } from './draw-circuit.js';
import { Scenario } from './scenario.js';
import { TruthTable } from './truth-table.js';
import { CircuitGenerator } from './circuit-generator.js';

/**
 * Manages the overall game state, mode switching, and coordination
 * between different game modules and the UI manager.
 */
export class GameManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.circuitGenerator = new CircuitGenerator();

        // Centralized State Management
        this.score = 0;
        this.totalQuestions = 0;
        this.answered = false;
        this.currentMode = null; // The string key for the current mode
        this.activeModeInstance = null; // The instance of the current mode class

        // TODO: (Phase 3) - The modeSettings object could be moved into a
        // separate configuration file (e.g., `config.js`) to keep this manager focused on logic.
        this.modeSettings = {
            nameThatGate: {
                label: 'Name That Gate',
                levels: 0,
                class: NameThatGate,
                dependencies: [this.circuitGenerator]
            },
            writeExpression: {
                label: 'Expression Writing',
                levels: 4,
                class: ExpressionWriting,
                dependencies: [this.circuitGenerator]
            },
            truthTable: {
                label: 'Truth Tables',
                levels: 4,
                class: TruthTable,
                dependencies: [this.circuitGenerator]
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
                dependencies: [this.circuitGenerator]
            }
        };

        // Instantiate all game modes, passing dependencies
        this.modeInstances = this.createModeInstances();
    }

    /**
     * Creates instances of all game modes defined in modeSettings.
     * This follows the dependency injection pattern.
     */
    createModeInstances() {
        const instances = {};
        const commonDependencies = {
            ui: this.uiManager,
            state: this.getStateAccessors()
        };

        for (const [key, config] of Object.entries(this.modeSettings)) {
            // The DrawCircuit constructor has a different signature.
            // TODO: (Phase 3) - Standardize constructor signatures for all modes.
            if (key === 'drawCircuit') {
                 instances[key] = new config.class(commonDependencies);
            } else {
                 instances[key] = new config.class(...config.dependencies, commonDependencies);
            }
        }
        return instances;
    }

    /**
     * Provides controlled access to the game state for other modules.
     * This is a "bridge" to allow modes to interact with the central state
     * without giving them direct mutable access.
     */
    getStateAccessors() {
        return {
            getAnswered: () => this.answered,
            setAnswered: (val) => { this.answered = val; },
            incrementScore: () => { this.score++; },
            incrementTotalQuestions: () => { this.totalQuestions++; },
            getScore: () => this.score,
            getTotalQuestions: () => this.totalQuestions,
        };
    }

    /**
     * Sets the current game mode.
     * @param {string} modeKey - The key for the desired mode (e.g., 'writeExpression').
     */
    setGameMode(modeKey) {
        if (!this.modeSettings[modeKey]) {
            console.error(`Unknown mode: ${modeKey}`);
            return;
        }

        this.currentMode = modeKey;
        this.activeModeInstance = this.modeInstances[modeKey];

        this.resetSessionState();

        // Initialize the new mode
        if (this.activeModeInstance.initialize) {
            this.activeModeInstance.initialize();
        } else {
            console.warn(`Mode ${modeKey} does not have an initialize method.`);
        }
        
        this.uiManager.updateScoreDisplay(this.score, this.totalQuestions);
    }

    /**
     * Sets the difficulty for the current mode.
     * @param {number} level - The new difficulty level.
     */
    setDifficulty(level) {
        if (this.activeModeInstance && this.activeModeInstance.setDifficulty) {
            this.activeModeInstance.setDifficulty(level);
            this.resetSessionState();
        }
    }
    
    /**
     * Submits the user's answer and delegates checking to the current mode.
     */
    submitAnswer() {
        if (this.answered) return;

        if (this.activeModeInstance && this.activeModeInstance.checkAnswer) {
            this.activeModeInstance.checkAnswer();
        }
    }

    /**
     * Proceeds to the next question.
     */
    nextQuestion() {
        this.resetSessionState();
        if (this.activeModeInstance && this.activeModeInstance.generateQuestion) {
            this.activeModeInstance.generateQuestion();
        }
    }

    /**
     * Resets the state for a new question (e.g., hides feedback).
     */
    resetSessionState() {
        this.answered = false;
        this.uiManager.resetUIState(this.currentMode);
    }

    /**
     * Toggles the help display for the current mode.
     */
    toggleHelp() {
        if (this.activeModeInstance && this.activeModeInstance.updateHelpDisplay) {
            this.activeModeInstance.updateHelpDisplay();
        }
    }
}