// js/truth-table-utils.js

import { evaluateExpression, getInputVariables } from './expression-utils.js';

/**
 * Parses a boolean expression to extract input variables and intermediate sub-expressions for the table.
 * @param {string} expression - The boolean expression string (e.g., "Q = A AND (B OR C)").
 * @returns {object} An object containing sorted inputs and intermediate expressions.
 */
export function parseExpressionForTable(expression) {
    const rightSide = expression.split(' = ')[1];
    const inputs = getInputVariables(expression);

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
export function generateInputCombinations(inputs) {
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
 * Calculates the full data for a truth table, including intermediate and final outputs.
 * @param {string} expression - The full expression string, e.g., "Q = A AND B".
 * @param {string[]} inputs - Array of input variable names.
 * @param {string[]} intermediateExpressions - Array of intermediate expression strings.
 * @param {boolean} showIntermediateColumns - Flag to control calculation of intermediate values.
 * @returns {object[]} An array of objects, where each object represents a row in the truth table.
 */
export function calculateTruthTableData(expression, inputs, intermediateExpressions, showIntermediateColumns) {
    const inputCombinations = generateInputCombinations(inputs);
    const expressionBody = expression.split(' = ')[1];
    const outputVar = expression.split(' = ')[0].trim();

    const truthTableData = inputCombinations.map(combination => {
        const result = { ...combination };
        if (showIntermediateColumns && intermediateExpressions.length > 0) {
            intermediateExpressions.forEach((expr, index) => {
                result[`intermediate_${index}`] = evaluateExpression(expr, combination);
            });
        }
        result[outputVar] = evaluateExpression(expressionBody, combination);
        return result;
    });
    return truthTableData;
}

/**
 * Generates the HTML string for the truth table.
 * @param {object[]} truthTableData - The pre-calculated data for the table.
 * @param {string[]} inputs - Array of input variable names.
 * @param {string[]} intermediateExpressions - Array of intermediate expression strings.
 * @param {string} expression - The full expression string.
 * @param {boolean} showIntermediateColumns - Whether to show intermediate columns.
 * @param {boolean} expertMode - Whether to enable expert mode (all fields editable).
 * @returns {string} The HTML string for the table.
 */
export function generateTableHTML(truthTableData, inputs, intermediateExpressions, expression, showIntermediateColumns, expertMode) {
    let tableHTML = '<table class="truth-table"><thead><tr>';
    const outputVariable = expression.split(' = ')[0].trim();

    inputs.forEach(input => tableHTML += `<th class="input-header">${input}</th>`);

    if (showIntermediateColumns && intermediateExpressions.length > 0) {
        intermediateExpressions.forEach(expr => {
            const title = expr.length > 10 ? ` title="${expr}"` : '';
            const text = expr.length > 10 ? expr.substring(0, 10) + '...' : expr;
            tableHTML += `<th class="intermediate-header"${title}>${text}</th>`;
        });
    }

    tableHTML += `<th class="output-header">${outputVariable}</th></tr></thead><tbody>`;

    truthTableData.forEach((row, rowIndex) => {
        tableHTML += '<tr>';

        inputs.forEach(input => {
            if (expertMode) {
                tableHTML += `<td class="input-cell"><select class="truth-table-select input-select expert-input" data-row="${rowIndex}" data-column="${input}"><option value="">?</option><option value="0">0</option><option value="1">1</option></select></td>`;
            } else {
                tableHTML += `<td class="input-cell">${row[input] ? 1 : 0}</td>`;
            }
        });

        if (showIntermediateColumns && intermediateExpressions.length > 0) {
            intermediateExpressions.forEach((expr, index) => {
                const selectClass = expertMode ? 'expert-intermediate' : '';
                tableHTML += `<td class="intermediate-cell"><select class="truth-table-select intermediate-select ${selectClass}" data-row="${rowIndex}" data-column="intermediate_${index}"><option value="">?</option><option value="0">0</option><option value="1">1</option></select></td>`;
            });
        }

        const outputSelectClass = expertMode ? 'expert-output' : '';
        tableHTML += `<td class="output-cell"><select class="truth-table-select output-select ${outputSelectClass}" data-row="${rowIndex}" data-column="${outputVariable}"><option value="">?</option><option value="0">0</option><option value="1">1</option></select></td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    return tableHTML;
}

/**
 * Performs order-independent validation for expert mode.
 * @param {object[]} userRows - The rows of data entered by the user.
 * @param {object[]} correctData - The correct, pre-calculated truth table data.
 * @returns {object} An object indicating if the table is correct and which rows matched.
 */
function _validateExpertModeAnswers(userRows, correctData) {
    const numRows = correctData.length;
    const usedCorrectRows = new Set();
    const rowMatches = new Array(numRows).fill(-1);
    let correctRowCount = 0;

    for (const userRow of userRows) {
        for (let j = 0; j < correctData.length; j++) {
            if (usedCorrectRows.has(j)) continue;

            const correctRow = correctData[j];
            let matches = true;
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
    return { isCorrect: correctRowCount === numRows, correctRows: correctRowCount, rowMatches };
}

/**
 * Checks answers for normal (non-expert) mode.
 * @param {string} expression - The full expression string.
 * @param {object[]} truthTableData - The correct, pre-calculated truth table data.
 * @param {object} ui - The UI dependency for showing feedback.
 * @param {object} state - The state dependency for recording results.
 * @param {string} containerId - The ID of the parent container holding the table.
 */
export function checkNormalModeAnswer(expression, truthTableData, ui, state, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const outputVariable = expression.split(' = ')[0].trim();
    const outputSelects = container.querySelectorAll('.output-select');
    let outputCorrect = 0;
    let allOutputAnswered = true;


    outputSelects.forEach((select) => {
        const rowIndex = parseInt(select.dataset.row);
        if (select.value === '') {
            allOutputAnswered = false;
            select.classList.add('unanswered');
            return;
        }
        const correctValue = truthTableData[rowIndex][outputVariable] ? '1' : '0';
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
            const correctValue = truthTableData[rowIndex][columnName] ? '1' : '0';
            select.classList.add(select.value === correctValue ? 'correct' : 'incorrect');
        } else {
            select.classList.add('optional-unanswered');
        }
        select.disabled = true;
    });

    if (!allOutputAnswered) {
        ui.showFeedback(`Please answer all rows in the output column (${outputVariable}).`, 'incorrect');
        ui.showSubmitButton();
        // Not all answered? Enable unanswered selects
        document.querySelectorAll('.truth-table-select.unanswered').forEach(s => {
            s.disabled = false;
            s.classList.remove('unanswered');
        });
        return;
    }

    // Can't skip the question until you at least try to answer every dropdown
    ui.showNextButton();

    const isCorrect = outputCorrect === outputSelects.length;
    state.recordResult(isCorrect);
    if (isCorrect) {
        ui.showFeedback('Correct! Perfect truth table!', 'correct');
        state.setAnswered(true);
        ui.hideSubmitButton();
    } else {
        // Lets them try again
        ui.showSubmitButton();
        ui.showFeedback(`Output column: ${outputCorrect}/${outputSelects.length} correct. Review the highlighted answers.`, 'incorrect');
                document.querySelectorAll('.truth-table-select.incorrect').forEach(s => {
            s.disabled = false;
            // s.classList.remove('incorrect');
        });

    }
}

/**
 * Checks answers for expert mode.
 * @param {object[]} truthTableData - The correct, pre-calculated truth table data.
 * @param {object} ui - The UI dependency for showing feedback.
 * @param {object} state - The state dependency for recording results.
 * @param {string} containerId - The ID of the parent container holding the table.
 */
export function checkExpertModeAnswer(truthTableData, ui, state, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const allSelects = container.querySelectorAll('.truth-table-select');
    const userRows = [];
    const numRows = truthTableData.length;
    let allFieldsFilled = true;

    state.setAnswered(true);

    for (let i = 0; i < numRows; i++) {
        const userRowData = {};
        container.querySelectorAll(`[data-row="${i}"]`).forEach(select => {
            if (select.value === '') allFieldsFilled = false;
            const columnName = select.dataset.column;
            userRowData[columnName] = select.value === '1';
        });
        userRows.push({ rowIndex: i, data: userRowData });
    }

    if (!allFieldsFilled) {
        ui.showFeedback('Expert Mode: All fields must be filled.', 'incorrect');
        allSelects.forEach(s => s.classList.toggle('unanswered', s.value === ''));
        state.setAnswered(false);
        ui.showSubmitButton();
        return;
    }

    const validationResult = _validateExpertModeAnswers(userRows, truthTableData);
    allSelects.forEach(s => s.disabled = true);

    allSelects.forEach(select => {
        const rowIndex = parseInt(select.dataset.row);
        const columnName = select.dataset.column;
        const matchedCorrectIndex = validationResult.rowMatches[rowIndex];

        if (matchedCorrectIndex !== -1) {
            const correctRow = truthTableData[matchedCorrectIndex];
            const userValue = select.value === '1';
            select.classList.add(userValue === correctRow[columnName] ? 'correct' : 'incorrect');
        } else {
            select.classList.add('incorrect');
        }
    });

    state.recordResult(validationResult.isCorrect);
    if (validationResult.isCorrect) {
        ui.showFeedback('Expert Mode: Perfect! All rows are correct!', 'correct');
    } else {
        ui.showFeedback(`Expert Mode: ${validationResult.correctRows}/${numRows} rows correct.`, 'incorrect');
    }
    ui.showNextButton();
}