import { expressionDatabase } from './data.js';
import { shuffleExpression } from './expression-utils.js';
import * as ttUtils from './truth-table-utils.js';

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
     * Initializes the mode by adding event listeners and generating the first question.
     */
    initialize() {
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
     * Generates a new truth table question.
     */
    generateQuestion() {
        // Select a random expression based on difficulty
        const logicDiagramDisplay = document.getElementById('truthTableLogicDiagramDisplay');
        const levelKey = `level${this.currentDifficulty}`;
        const expressions = expressionDatabase[levelKey];
        this.currentExpression = expressions[Math.floor(Math.random() * expressions.length)];

        // Use the utility function to parse the expression
        const parsed = ttUtils.parseExpressionForTable(this.currentExpression);
        this.inputs = parsed.inputs;
        this.intermediateExpressions = parsed.intermediateExpressions;

        // Use utility functions to calculate data and generate HTML
        this._calculateAndRenderTable();

        // Update UI
        this.ui.showExpression('truthTableExpression', this.currentExpression);
        this.circuitGenerator.generateCircuit(this.currentExpression, logicDiagramDisplay);
        this.ui.resetUIState('truthTableMode');
    }

    /**
     * Checks the user's answers against the correct truth table data.
     */
    checkAnswer() {
        if (this.state.getAnswered()) return;

        const containerId = 'truthTableContainer';

        if (this.expertMode) {
            ttUtils.checkExpertModeAnswer(this.currentTruthTableData, this.ui, this.state, containerId);
        } else {
            ttUtils.checkNormalModeAnswer(this.currentExpression, this.currentTruthTableData, this.ui, this.state, containerId);
        }
    }

    /**
     * Toggles the visibility of intermediate columns and redraws the table.
     */
    toggleIntermediateColumns() {
        this.showIntermediateColumns = document.getElementById('showIntermediateColumns').checked;
        this._preserveAndRedrawTable();
    }

    /**
     * Toggles expert mode and redraws the table.
     */
    toggleExpertMode() {
        this.expertMode = document.getElementById('expertMode').checked;
        this._preserveAndRedrawTable();
    }
    
    /**
     * Calculates truth table data and renders the HTML table.
     */
    _calculateAndRenderTable() {
        this.currentTruthTableData = ttUtils.calculateTruthTableData(
            this.currentExpression,
            this.inputs,
            this.intermediateExpressions,
            this.showIntermediateColumns
        );

        const tableHTML = ttUtils.generateTableHTML(
            this.currentTruthTableData,
            this.inputs,
            this.intermediateExpressions,
            this.currentExpression,
            this.showIntermediateColumns,
            this.expertMode
        );

        document.getElementById('truthTableContainer').innerHTML = tableHTML;
    }
    
    /**
     * Redraws the table, preserving any user inputs.
     */
    _preserveAndRedrawTable() {
        const currentUserInputs = {};
        document.querySelectorAll('.truth-table-select').forEach(select => {
            const key = `${select.dataset.row}_${select.dataset.column}`;
            if (select.value) {
                currentUserInputs[key] = select.value;
            }
        });

        // Use the combined helper to recalculate and render the table
        this._calculateAndRenderTable();

        // Restore user inputs
        document.querySelectorAll('.truth-table-select').forEach(select => {
            const key = `${select.dataset.row}_${select.dataset.column}`;
            if (currentUserInputs[key]) {
                select.value = currentUserInputs[key];
            }
        });
    }

    /**
     * Refreshes the display to apply notation changes without generating a new question.
     */
    refreshDisplay() {
        if (this.currentExpression) {
            this.ui.showExpression('truthTableExpression', this.currentExpression);
            this._preserveAndRedrawTable(); // Recalculate table with new notation
        }
    }
}