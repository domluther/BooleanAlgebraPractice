// expression-writing.js

import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers, shuffleExpression } from './expression-utils.js';

export class ExpressionWriting {
    constructor(circuitGenerator, dependencies) {
        this.circuitGenerator = circuitGenerator;
        this.ui = dependencies.ui;
        this.state = dependencies.state;

        this.currentExpression = '';
        this.currentAcceptedAnswers = [];
        this.currentDifficulty = 1;

        // Help mode state
        this.helpEnabled = false;
    }

    /**
     * Initializes the mode by generating the first question.
     */
    initialize() {
        this.generateQuestion();
    }
    
    /**
     * Handles difficulty level changes.
     * @param {number} level - The new difficulty level.
     */
    setDifficulty(level) {
        this.currentDifficulty = level;
        this.generateQuestion();
    }

    /**
     * Generates a new expression, draws the corresponding circuit, and resets the input field.
     */
    generateQuestion() {
        const logicDiagramDisplay = document.getElementById('logicDiagramDisplay');
        const levelKey = `level${this.currentDifficulty}`;
        const expressions = expressionDatabase[levelKey];

        this.currentExpression = expressions[Math.floor(Math.random() * expressions.length)];

        // If difficulty is 3 or 4, generate different input and output variables.
        if (this.currentDifficulty >= 3) {
            this.currentExpression = shuffleExpression(this.currentExpression);
        }

        this.circuitGenerator.generateCircuit(this.currentExpression, logicDiagramDisplay);

        this.currentAcceptedAnswers = generateAllAcceptedAnswers(this.currentExpression);

        this.updateHelpDisplay(); // Check and update help display on every new question.
        
        const input = document.getElementById('expressionInput');
        input.value = '';
        input.focus();
    }
    
    /**
     * Checks the user's submitted expression against a list of accepted answers.
     */
    checkAnswer() {
        if (this.state.getAnswered()) return;

        const userAnswer = document.getElementById('expressionInput').value.trim().toUpperCase();

        this.state.setAnswered(true);
        this.ui.hideSubmitButton();

        const normalizeExpression = (expr) => {
            return expr
                .replace(/\s+/g, ' ')
                .replace(/\s*\(\s*/g, '(')
                .replace(/\s*\)\s*/g, ')')
                .replace(/\s*(AND|OR|NOT)\s*/g, ' $1 ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const normalizedUser = normalizeExpression(userAnswer);

        const isCorrect = this.currentAcceptedAnswers.some(acceptedAnswer => {
            const normalizedAccepted = normalizeExpression(acceptedAnswer.toUpperCase());
            return normalizedUser === normalizedAccepted;
        });

        this.state.recordResult(isCorrect)
        if (isCorrect) {
            this.ui.showFeedback('Correct! Excellent work!', 'correct');
        } else {
            this.ui.showFeedback(`Incorrect. The correct answer is: ${this.currentExpression}`, 'incorrect');
        }
        this.ui.showNextButton();
    }
    
    /**
     * Updates the help display with the list of accepted answers if help mode is enabled.
     */
    updateHelpDisplay() {
        // Check the state of the help checkbox for this mode
        const helpCheckbox = document.getElementById('writeExpressionDebugMode');
        this.helpEnabled = helpCheckbox ? helpCheckbox.checked : false;
        
        const acceptedAnswersDiv = document.getElementById('expressionAcceptedAnswers');
        const helpInfoDiv = document.getElementById('writeExpressionHelpInfo');

        if (this.helpEnabled) {
            if (helpInfoDiv) helpInfoDiv.style.display = 'block';
            if (this.currentAcceptedAnswers && this.currentAcceptedAnswers.length > 0) {
                acceptedAnswersDiv.innerHTML = this.currentAcceptedAnswers.map(answer =>
                    `<div>${answer}</div>`
                ).join('');
            } else {
                acceptedAnswersDiv.innerHTML = '<div>No accepted answers generated</div>';
            }
        } else {
             if (helpInfoDiv) helpInfoDiv.style.display = 'none';
        }
    }
}