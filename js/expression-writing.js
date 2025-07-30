// expression-writing.js

// TODO: (Phase 3) - data and utils should be managed by a central game manager
// and passed as dependencies, not imported directly by each mode module.
import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers } from './expression-utils.js';

export class ExpressionWriting {
    constructor(circuitGenerator, dependencies) {
        this.circuitGenerator = circuitGenerator;
        this.ui = dependencies.ui;
        this.state = dependencies.state;

        this.currentExpression = '';
        this.currentAcceptedAnswers = [];
        this.currentDifficulty = 1;

        // This 'help' object mirrors the structure in script.js's modeSettings.
        // TODO: (Phase 3) - This should be simplified and managed by a central UI manager.
        this.help = { enabled: false };
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
        this.state.incrementTotalQuestions();

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

        if (isCorrect) {
            this.state.incrementScore();
            this.ui.showFeedback('Correct! Excellent work!', 'correct');
        } else {
            this.ui.showFeedback(`Incorrect. The correct answer is: ${this.currentExpression}`, 'incorrect');
        }

        this.ui.updateScoreDisplay();
        this.ui.showNextButton();
    }
    
    /**
     * Updates the help display with the list of accepted answers if help mode is enabled.
     */
    updateHelpDisplay() {
        // The class is responsible for checking the state of its own help checkbox.
        const helpCheckbox = document.getElementById('writeExpressionDebugMode');
        this.help.enabled = helpCheckbox ? helpCheckbox.checked : false;
        
        const acceptedAnswersDiv = document.getElementById('expressionAcceptedAnswers');
        const helpInfoDiv = document.getElementById('writeExpressionHelpInfo');

        if (this.help.enabled) {
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