// js/draw-circuit.js

import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers, shuffleExpression } from './expression-utils.js';
import { CircuitDrawer } from './draw-circuit-utils.js';

export class DrawCircuit {
    constructor(dependencies) {
        this.ui = dependencies.ui;
        this.state = dependencies.state;
        
        // Core state
        this.targetExpression = "";
        this.currentDifficulty = 1;
        this.helpEnabled = false;
        
        // Circuit drawer instance
        this.circuitDrawer = null;
    }

    /**
     * Initializes the mode, sets up the canvas, and generates the first question.
     * This method is called when the user switches to "Draw Circuit" mode.
     */
    initialize() {
        this.generateQuestion();
    }
    
    /**
     * Sets the difficulty level and generates a new question.
     * @param {number} level - The new difficulty level (1-4).
     */
    setDifficulty(level) {
        this.currentDifficulty = level;
        this.generateQuestion();
    }

    /**
     * Generates a new circuit drawing question based on the current difficulty.
     */
    generateQuestion() {
        const levelKey = `level${this.currentDifficulty}`;
        const expressions = expressionDatabase[levelKey];
        
        this.targetExpression = expressions[Math.floor(Math.random() * expressions.length)];

        // If difficulty is 3 or 4, generate different input and output variables.
        if (this.currentDifficulty >= 3) {
            this.targetExpression = shuffleExpression(this.targetExpression);
        }

        // Update the target expression display
        this.ui.showExpression('circuitTargetExpression', this.targetExpression);

        // Clean up any existing circuit drawer
        if (this.circuitDrawer) {
            this.circuitDrawer.destroy();
        }

        // Create new circuit drawer instance
        this.circuitDrawer = new CircuitDrawer('circuitCanvas', this.ui, this.state, 'drawCircuit');
        
        // Start the circuit drawer with the target expression
        this.circuitDrawer.start(
            this.targetExpression, 
            document.getElementById('drawCircuitInterpretedExpression'),
        );

        // Reset UI state
        this.ui.resetUIState('drawCircuit');
        this.updateHelpDisplay();
    }
    
    /**
     * Checks if the user's drawn circuit correctly represents the target expression.
     */
    checkAnswer() {
        if (this.state.getAnswered()) return;

        const userExprText = this.circuitDrawer.getCurrentExpression();

        if (userExprText.includes('?')) {
            this.ui.showFeedback('Your circuit is not complete yet.', 'incorrect');
            return;
        }

        const possibleAnswers = generateAllAcceptedAnswers(this.targetExpression);
        const isCorrect = possibleAnswers.some(acceptedAnswer => userExprText === acceptedAnswer);
        
        this.state.recordResult(isCorrect);
        
        if (isCorrect) {
            this.ui.showFeedback('Correct! The circuit matches the expression.', 'correct');
        } else {
            this.ui.showFeedback(`Incorrect. Your circuit diagram (${userExprText}) does not match the target expression (${this.targetExpression}). Check your gates & wires or move on.`, 'incorrect');
        }
        
        this.ui.showNextButton();
        this.ui.hideSubmitButton();
        this.state.setAnswered(true);
    }
    
    /**
     * Toggles the visibility of the help information panel.
     */
    updateHelpDisplay() {
        const helpCheckbox = document.getElementById('drawCircuitHelpMode');
        this.helpEnabled = helpCheckbox ? helpCheckbox.checked : false;
        
        const helpInfoDiv = document.getElementById('drawCircuitHelpInfo');

        if (helpInfoDiv) {
            helpInfoDiv.style.display = this.helpEnabled ? 'inline-block' : 'none';
        }
    }
}