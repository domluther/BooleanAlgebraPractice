// truth-table.js

// TODO: (Phase 3) - These should be managed by a central game manager
// and passed as dependencies, not imported directly by each mode module.
import { expressionDatabase } from './data.js';

export class TruthTable {
    /**
     * Constructor for the TruthTable mode.
     * @param {object} circuitGenerator - An instance of the CircuitGenerator class.
     * @param {object} dependencies - Common UI and state management functions.
     */
    constructor(circuitGenerator, dependencies) {
        this.circuitGenerator = circuitGenerator;
        this.ui = dependencies.ui;
        this.state = dependencies.state;

        // State specific to Truth Table mode
        this.currentExpression = '';
        this.currentDifficulty = 1;
        this.currentTruthTableData = [];
        this.inputs = [];
        this.intermediateExpressions = [];

        // Options
        this.showIntermediateColumns = false;
        this.expertMode = false;
    }

    /**
     * Initializes the mode by generating the first question.
     */
    initialize() {
        // Add event listeners for the checkboxes, scoped to this mode
        document.getElementById('showIntermediateColumns').onchange = () => this.toggleIntermediateColumns();
        document.getElementById('expertMode').onchange = () => this.toggleExpertMode();

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
     * Toggles the visibility of intermediate columns in the truth table.
     * Re-renders the current table without generating a new question.
     */
    toggleIntermediateColumns() {
        this.showIntermediateColumns = document.getElementById('showIntermediateColumns').checked;

        if (this.currentExpression) {
            // Re-render the table with the new setting, preserving user input
            this._preserveAndRedrawTable();

        }
    }

    /**
     * Toggles expert mode, which requires the user to fill the entire table.
     * Re-renders the table and resets the UI state.
     */
    toggleExpertMode() {
        this.expertMode = document.getElementById('expertMode').checked;

        if (this.currentExpression) {
            // Re-generate a fresh table as the structure changes significantly
            this._generateTableHTML();

            // Reset any visual feedback from previous attempts
            document.querySelectorAll('.truth-table-select').forEach(select => {
                select.classList.remove('correct', 'incorrect', 'unanswered', 'optional-unanswered');
                select.disabled = false;
            });

            // Reset answered state and show submit button
            this.ui.resetUIState();
        }
    }

    /**
     * Generates a new truth table question.
     * Fetches an expression, generates the circuit, calculates the table data, and renders the HTML.
     */
    generateQuestion() {
        const expressionDisplay = document.getElementById('truthTableExpression');
        const truthTableCircuitContainer = document.getElementById('truthTableLogicDiagramDisplay');

        // Get a random expression for the current difficulty
        const expressions = expressionDatabase[`level${this.currentDifficulty}`];
        this.currentExpression = expressions[Math.floor(Math.random() * expressions.length)];

        // Display the expression and generate the corresponding logic circuit
        expressionDisplay.innerHTML = `<div class="expression-text">${this.currentExpression}</div>`;
        this.circuitGenerator.generateCircuit(this.currentExpression, truthTableCircuitContainer);

        // Parse the expression to get inputs and intermediate steps
        const parsedData = this._parseExpression(this.currentExpression);
        this.inputs = parsedData.inputs;
        this.intermediateExpressions = parsedData.intermediateExpressions;

        // Calculate the correct answers for the entire truth table
        this._calculateTruthTableData();

        // Generate the HTML for the truth table
        this._generateTableHTML();

        // Ensure UI is ready for a new question
        this.ui.resetUIState();
        document.querySelectorAll('.truth-table-select').forEach(select => {
            select.value = '';
            select.disabled = false;
            select.classList.remove('correct', 'incorrect', 'unanswered');
        });
    }

    /**
     * Checks the user's answer against the calculated correct data.
     * Routes to the appropriate checking logic based on whether expert mode is active.
     */
    checkAnswer() {
        if (this.state.getAnswered()) return;

        this.state.setAnswered(true);
        this.state.incrementTotalQuestions();
        this.ui.hideSubmitButton();

        if (this.expertMode) {
            this._checkExpertModeAnswer();
        } else {
            this._checkNormalModeAnswer();
        }

        this.ui.updateScoreDisplay(this.state.getScore(), this.state.getTotalQuestions());
;
        this.ui.showNextButton();
    }
    
    /**
     * Parses a boolean expression to extract input variables and intermediate sub-expressions.
     * @param {string} expression - The boolean expression string (e.g., "Q = A AND (B OR C)").
     * @returns {object} An object containing sorted inputs and intermediate expressions.
     */
    _parseExpression(expression) {
        const rightSide = expression.split(' = ')[1];

        let cleanExpression = rightSide
            .replace(/\bAND\b/g, ' | ')
            .replace(/\bOR\b/g, ' | ')
            .replace(/\bNOT\b/g, ' | ')
            .replace(/[()]/g, ' | ');

        const tokens = cleanExpression.split('|').map(token => token.trim()).filter(token => token.length > 0);

        const inputs = [...new Set(tokens.filter(token =>
            token.length === 1 && token.match(/[A-Z]/)
        ))].sort();

        // TODO - Improve detection. Currently Q = (NOT (A OR B)) AND C only detects (A OR B) as an intermediate expression. 
        // Always generate intermediate expressions - even if not displayed (means available if needed)
        const intermediateExpressions = [];
        const parenthesesMatches = rightSide.match(/\([^()]+\)/g) || [];
        parenthesesMatches.forEach(match => {
            const cleaned = match.slice(1, -1);
            if (!intermediateExpressions.includes(cleaned)) {
                intermediateExpressions.push(cleaned);
            }
        });

        return { inputs, intermediateExpressions };
    }

    /**
     * Generates all possible input combinations for a given set of inputs.
     * @param {string[]} inputs - An array of input variable names.
     * @returns {object[]} An array of objects, each representing a row of input values.
     */
    _generateInputCombinations(inputs) {
        const numInputs = inputs.length;
        const numCombinations = 2 ** numInputs;
        const combinations = [];

        for (let i = 0; i < numCombinations; i++) {
            const combination = {};
            for (let j = 0; j < numInputs; j++) {
                combination[inputs[j]] = Boolean((i >> (numInputs - 1 - j)) & 1);
            }
            combinations.push(combination);
        }
        return combinations;
    }

    /**
     * Evaluates a boolean expression string with a given set of input values.
     * @param {string} expression - The expression part to evaluate.
     * @param {object} values - An object mapping variable names to boolean values.
     * @returns {boolean} The result of the evaluation.
     */
    _evaluateExpression(expression, values) {
        // TODO investigate  'new Function()' instead of 'eval()'
        try {
            let evalExpression = expression;
            Object.keys(values).forEach(variable => {
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                evalExpression = evalExpression.replace(regex, values[variable]);
            });

            evalExpression = evalExpression
                .replace(/\bAND\b/g, '&&')
                .replace(/\bOR\b/g, '||')
                .replace(/\bNOT\b/g, '!');
            
            return eval(evalExpression);
        } catch (error) {
            console.error('Error evaluating expression:', expression, error);
            return false;
        }
    }

    /**
     * Calculates the full data for the current truth table, including intermediate and final outputs.
     */
    _calculateTruthTableData() {
        const inputCombinations = this._generateInputCombinations(this.inputs);
        const expressionBody = this.currentExpression.split(' = ')[1];

        this.currentTruthTableData = inputCombinations.map(combination => {
            const result = { ...combination };
            if (this.showIntermediateColumns && this.intermediateExpressions.length > 0) {
                this.intermediateExpressions.forEach((expr, index) => {
                    result[`intermediate_${index}`] = this._evaluateExpression(expr, combination);
                });
            }
            
            result.Q = this._evaluateExpression(expressionBody, combination);
            return result;
        });
    }

    /**
     * Generates and injects the HTML for the truth table into the DOM.
     */
    _generateTableHTML() {
        const container = document.getElementById('truthTableContainer');
        let tableHTML = '<table class="truth-table"><thead><tr>';

        this.inputs.forEach(input => tableHTML += `<th class="input-header">${input}</th>`);

        if (this.showIntermediateColumns && this.intermediateExpressions.length > 0) {
            this.intermediateExpressions.forEach(expr => {
                const title = expr.length > 10 ? ` title="${expr}"` : '';
                const text = expr.length > 10 ? expr.substring(0, 10) + '...' : expr;
                tableHTML += `<th class="intermediate-header"${title}>${text}</th>`;
            });
        }

        tableHTML += '<th class="output-header">Q</th></tr></thead><tbody>';

        this.currentTruthTableData.forEach((row, rowIndex) => {
            tableHTML += '<tr>';

            this.inputs.forEach(input => {
                if (this.expertMode) {
                    tableHTML += `<td class="input-cell"><select class="truth-table-select input-select expert-input" data-row="${rowIndex}" data-column="${input}"><option value="">?</option><option value="0">0</option><option value="1">1</option></select></td>`;
                } else {
                    tableHTML += `<td class="input-cell">${row[input] ? 1 : 0}</td>`;
                }
            });
            if (this.showIntermediateColumns && this.intermediateExpressions.length > 0) {
                this.intermediateExpressions.forEach((expr, index) => {
                    const selectClass = this.expertMode ? 'expert-intermediate' : '';
                    tableHTML += `<td class="intermediate-cell"><select class="truth-table-select intermediate-select ${selectClass}" data-row="${rowIndex}" data-column="intermediate_${index}"><option value="">?</option><option value="0">0</option><option value="1">1</option></select></td>`;
                });
            }

            const outputSelectClass = this.expertMode ? 'expert-output' : '';
            tableHTML += `<td class="output-cell"><select class="truth-table-select output-select ${outputSelectClass}" data-row="${rowIndex}" data-column="Q"><option value="">?</option><option value="0">0</option><option value="1">1</option></select></td>`;

            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    /**
     * Checks answers for normal (non-expert) mode.
     */
    _checkNormalModeAnswer() {
        const outputSelects = document.querySelectorAll('.output-select');
        let outputCorrect = 0;
        let allOutputAnswered = true;

        outputSelects.forEach((select) => {
            const rowIndex = parseInt(select.dataset.row);
            if (select.value === '') {
                allOutputAnswered = false;
                select.classList.add('unanswered');
                return;
            }

            const correctValue = this.currentTruthTableData[rowIndex].Q ? '1' : '0';
            if (select.value === correctValue) {
                outputCorrect++;
                select.classList.add('correct');
            } else {
                select.classList.add('incorrect');
            }
            select.disabled = true;
        });

        document.querySelectorAll('.intermediate-select').forEach(select => {
            const rowIndex = parseInt(select.dataset.row);
            const columnName = select.dataset.column;
            if (select.value !== '') {
                const correctValue = this.currentTruthTableData[rowIndex][columnName] ? '1' : '0';
                select.classList.add(select.value === correctValue ? 'correct' : 'incorrect');
            } else {
                select.classList.add('optional-unanswered');
            }
            select.disabled = true;
        });

        if (!allOutputAnswered) {
            this.ui.showFeedback('Please answer all rows in the output column (Q).', 'incorrect');
            this.ui.resetUIState();
            document.querySelectorAll('.truth-table-select').forEach(s => {
                s.disabled = false;
                s.classList.remove('unanswered');
            });
            return;
        }

        if (outputCorrect === outputSelects.length) {
            this.state.incrementScore();
            this.ui.showFeedback('Correct! Perfect truth table!', 'correct');
        } else {
            this.ui.showFeedback(`Output column: ${outputCorrect}/${outputSelects.length} correct. Review the highlighted answers.`, 'incorrect');
        }
    }

    /**
     * Checks answers for expert mode.
     */
    _checkExpertModeAnswer() {
        const allSelects = document.querySelectorAll('.truth-table-select');
        const userRows = [];
        const numRows = this.currentTruthTableData.length;
        let allFieldsFilled = true;

        for (let i = 0; i < numRows; i++) {
            const userRowData = {};
            document.querySelectorAll(`[data-row="${i}"]`).forEach(select => {
                if (select.value === '') allFieldsFilled = false;
                const columnName = select.dataset.column;
                // This logic needs to exist here to correctly build the object for comparison.
                if (columnName.startsWith('intermediate_')) {
                     userRowData[columnName] = select.value === '1';
                } else if (columnName === 'Q') {
                     userRowData.Q = select.value === '1';
                } else {
                     userRowData[columnName] = select.value === '1';
                }
            });
            userRows.push({ rowIndex: i, data: userRowData });
        }
        
        if (!allFieldsFilled) {
            this.ui.showFeedback('Expert Mode: All fields must be filled.', 'incorrect');
            this.ui.resetUIState();
            allSelects.forEach(s => s.classList.toggle('unanswered', s.value === ''));
            return;
        }

        const validationResult = this._validateExpertModeAnswers(userRows);
        allSelects.forEach(s => s.disabled = true);

        allSelects.forEach(select => {
            const rowIndex = parseInt(select.dataset.row);
            const columnName = select.dataset.column;
            const matchedCorrectIndex = validationResult.rowMatches[rowIndex];

            if (matchedCorrectIndex !== -1) {
                const correctRow = this.currentTruthTableData[matchedCorrectIndex];
                const userValue = select.value === '1';
                if (userValue === correctRow[columnName]) {
                    select.classList.add('correct');
                } else {
                    select.classList.add('incorrect');
                }
            } else {
                select.classList.add('incorrect');
            }
        });

        if (validationResult.isCorrect) {
            this.state.incrementScore();
            this.ui.showFeedback('Expert Mode: Perfect! All rows are correct!', 'correct');
        } else {
            this.ui.showFeedback(`Expert Mode: ${validationResult.correctRows}/${numRows} rows correct.`, 'incorrect');
        }
    }

    /**
     * Performs order-independent validation for expert mode.
     * @param {object[]} userRows - The rows of data entered by the user.
     * @returns {object} An object indicating if the table is correct and which rows matched.
     */
    _validateExpertModeAnswers(userRows) {
        // TODO: Investigate JSON.stringify instead of property-by-property comparison logic from script.js. Beware of potential bugs from property ordering.
        const correctData = this.currentTruthTableData;
        const numRows = correctData.length;
        const usedCorrectRows = new Set();
        const rowMatches = new Array(numRows).fill(-1);
        let correctRowCount = 0;

        for (const userRow of userRows) {
            for (let j = 0; j < correctData.length; j++) {
                if (usedCorrectRows.has(j)) continue;

                const correctRow = correctData[j];
                let matches = true;
                
                // Check all keys present in the user's data row
                for (const key in userRow.data) {
                    if (userRow.data[key] !== correctRow[key]) {
                        matches = false;
                        break;
                    }
                }

                if (matches) {
                    usedCorrectRows.add(j);
                    rowMatches[userRow.rowIndex] = j;
                    correctRowCount++;
                    break;
                }
            }
        }

        return {
            isCorrect: correctRowCount === numRows,
            correctRows: correctRowCount,
            rowMatches,
        };
    }

    /**
     * A helper to redraw the table when an option is toggled.
     */
    _preserveAndRedrawTable() {
        const currentUserInputs = {};
        document.querySelectorAll('.truth-table-select').forEach(select => {
            const key = `${select.dataset.row}_${select.dataset.column}`;
            currentUserInputs[key] = select.value;
        });
        
        // This implicitly calls _parseExpression with the new setting
        this._calculateTruthTableData(); 
        this._generateTableHTML();

        document.querySelectorAll('.truth-table-select').forEach(select => {
            const key = `${select.dataset.row}_${select.dataset.column}`;
            if (currentUserInputs[key]) {
                select.value = currentUserInputs[key];
            }
        });
    }
}