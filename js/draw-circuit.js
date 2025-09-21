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
        this.hasAttemptedCurrentQuestion = false; // Track if user has attempted current question
        this.questionWasAnsweredCorrectly = false; // Track if current question was answered correctly
        
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
     * @param {number} level - The new difficulty level (1-5).
     */
    setDifficulty(level) {
        this.currentDifficulty = level;
        this.generateQuestion();
    }

    /**
     * Generates a new circuit drawing question based on the current difficulty.
     */
    generateQuestion() {
        // If moving to a new question and the previous question was attempted but not answered correctly,
        // record it as an incorrect attempt (only if they never got it right)
        if (this.targetExpression && this.hasAttemptedCurrentQuestion && !this.questionWasAnsweredCorrectly) {
            this.state.recordResult(false);
        }

        const levelKey = `level${this.currentDifficulty}`;
        const expressions = expressionDatabase[levelKey];
        
        this.targetExpression = expressions[Math.floor(Math.random() * expressions.length)];
        this.hasAttemptedCurrentQuestion = false; // Reset attempt flag for new question
        this.questionWasAnsweredCorrectly = false; // Reset correct answer flag for new question

        // Harder modes, generate different input and output variables.
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
            this.currentDifficulty
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

        // Mark that user has attempted this question
        this.hasAttemptedCurrentQuestion = true;

        const possibleAnswers = generateAllAcceptedAnswers(this.targetExpression);
        const isCorrect = possibleAnswers.some(acceptedAnswer => userExprText === acceptedAnswer);
        
        if (isCorrect) {
            // Only record result when correct - this way multiple attempts don't count against score
            this.state.recordResult(isCorrect);
            this.questionWasAnsweredCorrectly = true; // Mark that this question was answered correctly
            this.ui.showFeedback('Correct! The circuit matches the expression.', 'correct');
            this.ui.showNextButton();
            this.ui.hideSubmitButton();
            this.state.setAnswered(true);
        } else {
            this.ui.showFeedback(`Incorrect. Your circuit diagram ${userExprText} does not match the target expression ${this.targetExpression}.<br>You can continue editing your circuit and try again, or move on to the next question.`, 'incorrect');
            this.ui.showNextButton();
            // Keep submit button visible for incorrect answers so users can try again
            // Don't set answered to true, allowing continued editing
            // Don't record result yet - wait until they either get it right or move on
        }
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

    /**
     * Refreshes the display to apply notation changes without generating a new question.
     */
    refreshDisplay() {
        if (this.targetExpression) {
            this.ui.showExpression('circuitTargetExpression', this.targetExpression);
        }
    }
}