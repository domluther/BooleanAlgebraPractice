// game-manager.js

import { modeSettings, appSettings } from './config.js';
import { CircuitGenerator } from './circuit-generator.js';

/**
 * Manages the overall game state, mode switching, and coordination
 * between different game modules and the UI manager.
 */
export class GameManager {
    constructor(uiManager, scoreManager) {
        this.uiManager = uiManager;
        this.scoreManager = scoreManager;
        this.circuitGenerator = new CircuitGenerator();

        // Import configuration
        this.modeSettings = modeSettings;
        this.appSettings = appSettings;

        // Centralized State Management
        this.score = 0;
        this.totalQuestions = 0;
        this.answered = false;
        this.currentMode = null; // The string key for the current mode
        this.activeModeInstance = null; // The instance of the current mode class

        // Instantiate all game modes with standardized dependency injection
        this.modeInstances = this.createModeInstances();
    }

    /**
     * Creates instances of all game modes defined in modeSettings.
     * Uses standardized dependency injection pattern for all modes.
     */
    createModeInstances() {
        const instances = {};
        
        // Available dependencies that can be injected
        const availableDependencies = {
            circuitGenerator: this.circuitGenerator
        };

        // Common dependencies passed to all modes
        const commonDependencies = {
            ui: this.uiManager,
            state: this.getStateAccessors()
        };

        for (const [key, config] of Object.entries(this.modeSettings)) {
            // Resolve required dependencies
            const resolvedDependencies = config.dependencies.map(depName => {
                if (!availableDependencies[depName]) {
                    throw new Error(`Unknown dependency '${depName}' required by mode '${key}'`);
                }
                return availableDependencies[depName];
            });

            // Create instance with standardized constructor signature:
            // new ModeClass(...resolvedDependencies, commonDependencies)
            instances[key] = new config.class(...resolvedDependencies, commonDependencies);
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

            // Simple scoring method - just pass mode result
            recordResult: (isCorrect) => {
                const result = this.scoreManager.recordScore(
                    this.currentMode, 
                    this.getCurrentDifficulty(), 
                    isCorrect
                );
                
                // Update score button display
                this.uiManager.updateScoreButton(this.scoreManager.getStatistics());
                
                return result;
            },

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
    
    getCurrentDifficulty() {
        // Return current difficulty level for the active mode
        return this.activeModeInstance?.currentDifficulty || 1;
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