// expression-writing.js

import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers, normalizeExpression, shuffleExpression } from './expression-utils.js';
import { convertToCurrentNotation, convertToWordNotation, appState } from './config.js';

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
        this.setupSymbolButtons();
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

        // If difficulty is 3, 4, or 5, generate different input and output variables.
        if (this.currentDifficulty >= 3) {
            this.currentExpression = shuffleExpression(this.currentExpression);
        }

        this.circuitGenerator.generateCircuit(this.currentExpression, logicDiagramDisplay);

        this.currentAcceptedAnswers = generateAllAcceptedAnswers(this.currentExpression);

        this.updateHelpDisplay(); // Check and update help display on every new question.
        
        const input = document.getElementById('expressionInput');
        input.value = '';
        this.updatePlaceholder();
        this.updateSymbolButtons();
        this.updateKeyboardShortcuts();
        input.focus();
    }

    /**
     * Sets up event listeners for the symbol input buttons.
     */
    setupSymbolButtons() {
        const symbolButtons = document.querySelectorAll('.symbol-btn');
        symbolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = document.getElementById('expressionInput');
                const symbol = appState.notationType === 'symbol' ? button.dataset.symbol : button.dataset.word;
                
                // Insert the symbol at the current cursor position
                const cursorPos = input.selectionStart;
                const currentValue = input.value;
                const newValue = currentValue.slice(0, cursorPos) + ' ' + symbol + ' ' + currentValue.slice(cursorPos);
                
                input.value = newValue;
                
                // Move cursor after the inserted symbol
                const newCursorPos = cursorPos + symbol.length + 2;
                input.setSelectionRange(newCursorPos, newCursorPos);
                input.focus();
            });
        });
    }

    /**
     * Updates the placeholder text based on the current notation setting.
     */
    updatePlaceholder() {
        const input = document.getElementById('expressionInput');
        const exampleExpression = 'Q = A OR B';
        input.placeholder = `Enter expression (e.g., ${convertToCurrentNotation(exampleExpression)})`;
    }
    
    /**
     * Checks the user's submitted expression against a list of accepted answers.
     */
    checkAnswer() {
        if (this.state.getAnswered()) return;

        const userAnswer = document.getElementById('expressionInput').value.trim().toUpperCase();

        this.state.setAnswered(true);
        this.ui.hideSubmitButton();

        // Check for notation consistency
        const notationError = this.validateNotationConsistency(userAnswer);
        if (notationError) {
            this.ui.showFeedback(notationError, 'incorrect');
            this.ui.showNextButton();
            return;
        }

        // Convert user input from symbols to words if they used symbol notation
        const userAnswerInWords = convertToWordNotation(userAnswer);
        const normalizedUser = normalizeExpression(userAnswerInWords);

        const isCorrect = this.currentAcceptedAnswers.some(acceptedAnswer => {
            const normalizedAccepted = normalizeExpression(acceptedAnswer.toUpperCase());
            return normalizedUser === normalizedAccepted;
        });

        this.state.recordResult(isCorrect)
        if (isCorrect) {
            this.ui.showFeedback('Correct! Excellent work!', 'correct');
        } else {
            this.ui.showFeedback(`Incorrect. The correct answer is: ${convertToCurrentNotation(this.currentExpression)}`, 'incorrect');
        }
        this.ui.showNextButton();
    }
    
    /**
     * Updates the help display with the list of accepted answers if help mode is enabled.
     */
    updateHelpDisplay() {
        // Check the state of the help checkbox for this mode
        const helpCheckbox = document.getElementById('writeExpressionHelpMode');
        this.helpEnabled = helpCheckbox ? helpCheckbox.checked : false;
        
        const acceptedAnswersDiv = document.getElementById('expressionAcceptedAnswers');
        const helpInfoDiv = document.getElementById('writeExpressionHelpInfo');

        if (this.helpEnabled) {
            if (helpInfoDiv) helpInfoDiv.style.display = 'block';
            if (this.currentAcceptedAnswers && this.currentAcceptedAnswers.length > 0) {
                acceptedAnswersDiv.innerHTML = this.currentAcceptedAnswers.map(answer =>
                    `<div>${convertToCurrentNotation(answer)}</div>`
                ).join('');
            } else {
                acceptedAnswersDiv.innerHTML = '<div>No accepted answers generated</div>';
            }
        } else {
             if (helpInfoDiv) helpInfoDiv.style.display = 'none';
        }
    }

    /**
     * Refreshes the display to apply notation changes without generating a new question.
     */
    refreshDisplay() {
        // Update help display in case notation changed
        this.updateHelpDisplay();
        
        // Update placeholder text
        this.updatePlaceholder();
        
        // Update symbol button display based on current notation
        this.updateSymbolButtons();
        
        // Update keyboard shortcuts visibility
        this.updateKeyboardShortcuts();
    }

    /**
     * Updates the symbol buttons to show the appropriate notation and visibility.
     */
    updateSymbolButtons() {
        const symbolButtonsContainer = document.getElementById('symbolInputButtons');
        const symbolButtons = document.querySelectorAll('.symbol-btn');
        
        // Show symbol buttons only in symbol mode
        if (symbolButtonsContainer) {
            symbolButtonsContainer.style.display = appState.notationType === 'symbol' ? 'flex' : 'none';
        }
        
        symbolButtons.forEach(button => {
            if (appState.notationType === 'symbol') {
                button.textContent = button.dataset.symbol;
                button.title = `Insert ${button.dataset.word} (${button.dataset.symbol})`;
            } else {
                button.textContent = button.dataset.word;
                button.title = `Insert ${button.dataset.word}`;
            }
        });
    }

    /**
     * Updates the keyboard shortcuts hint visibility based on notation mode.
     */
    updateKeyboardShortcuts() {
        const shortcutsDiv = document.getElementById('keyboardShortcuts');
        if (shortcutsDiv) {
            // Show keyboard shortcuts only in symbol mode
            shortcutsDiv.style.display = appState.notationType === 'symbol' ? 'block' : 'none';
        }
    }

    /**
     * Validates that the user's input follows the expected notation consistently.
     * @param {string} userInput - The user's input expression
     * @returns {string|null} Error message if validation fails, null if valid
     */
    validateNotationConsistency(userInput) {
        const hasWords = /\b(AND|OR|NOT|XOR)\b/.test(userInput);
        const hasSymbols = /[∧∨¬⊻^vV!]/.test(userInput);
        
        if (appState.notationType === 'symbol') {
            if (hasWords) {
                return `Please use symbol notation (∧, ∨, ¬, ⊻) or keyboard shortcuts (^, v, !) instead of words. Current mode: Symbols`;
            }
        } else {
            if (hasSymbols) {
                return `Please use word notation (AND, OR, NOT, XOR) instead of symbols. Current mode: Words`;
            }
        }
        
        // Check for mixed notation within the same expression
        if (hasWords && hasSymbols) {
            return `Please use consistent notation throughout your expression. Don't mix words and symbols.`;
        }
        
        return null; // Valid
    }
}