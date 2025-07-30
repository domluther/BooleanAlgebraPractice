import { CircuitGenerator } from './circuit-generator.js';
import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers } from './expression-utils.js';
import { ExpressionWriting } from './expression-writing.js';
import { NameThatGate } from './name-that-gate.js';
import { Scenario } from './scenario.js';

let score = 0;
let totalQuestions = 0;
let answered = false;
let currentMode = 'nameThatGate';
const modeSettings = {
	nameThatGate: {
		label: 'Name That Gate',
		levels: 0,
		initialize: () => nameThatGateMode.initialize()
	},
	writeExpression: {
		label: 'Expression Writing', // Still used for mode selector buttons
		levels: 4, // Still used for dropdown generation
		// The mode class now manages its own difficulty state.
		// This property is kept for now to generate the dropdown, but the source of truth is the class.
		// TODO: (Phase 3) - The UI generation should ask the mode for its current difficulty.
		currentDifficulty: 1, 
		generateQuestion: () => expressionWritingMode.generateQuestion(), 
		// The class's updateHelpDisplay method now reads the checkbox itself.
		// Used in toggleHelpMode and setGameMode + setDifficultyLevel.
		updateHelp: () => expressionWritingMode.updateHelpDisplay(),
		initialize: () => expressionWritingMode.initialize(),
		help: {
			// The class manages its own help state. This is kept for compatibility with toggleHelpMode.
			// TODO: (Phase 3) - Refactor toggleHelpMode to interact with the class directly.
			enabled: false 
		}
	},
	truthTable: {
		label: 'Truth Tables',
		levels: 3,
		currentDifficulty: 1,
		generateQuestion: generateTruthTableQuestion,
		updateHelp: () => {},
		initialize: generateTruthTableQuestion
	},
	drawCircuit: {
		label: 'Draw Circuit',
		levels: 4,
		currentDifficulty: 1,
		generateQuestion: generateDrawCircuitQuestion,
		updateHelp: () => {},
		initialize: initDrawCircuitMode,
		help: {
			enabled: false
		}
	},
	scenario: {
		label: 'Scenarios',
		levels: 3,
		currentDifficulty: 1,
		generateQuestion: () => scenarioMode.generateQuestion(),
		updateHelp: () => scenarioMode.updateHelpDisplay(),
		initialize: () => scenarioMode.initialize(),
		help: {
			enabled: false
		}
	}
};

// Game Mode Instances
let nameThatGateMode;
let expressionWritingMode;
let scenarioMode;
// TODO: (Phase 3) Add instances for other modes as they are refactored

// Create the circuit generator instance
const circuitGenerator = new CircuitGenerator();

// Global variables for truth table mode
let showIntermediateColumns = false;
let currentTruthTableExpression = '';
let currentTruthTableData = [];
let truthTableInputs = [];
let expertMode = false;

// Global variables for draw circuit mode
let canvas, ctx;
let gates = [];
let wires = [];
let inputs = [];
let output;
let selectedGate = null;
let selectedWire = null;
let nextId = 0;
let draggingGate = null;
let draggingOffset = {
	x: 0,
	y: 0
};
let wireStartNode = null;
let targetExpression = "";
let parsedTargetExpression = {};

const gateImages = {};


// Page generation
function generateModeSelectorButtons() {
	const container = document.getElementById('modeSelector');

	for (const [modeKey, mode] of Object.entries(modeSettings)) {
		const button = document.createElement('button');
		button.className = 'btn btn-select';
		button.onclick = () => setGameMode(modeKey, button);
		button.innerText = mode.label;
		container.appendChild(button);
	}
}

function generateDifficultyDropdown(gameMode) {
	if (gameMode === 'nameThatGate') return; // No difficulty levels for this mode

	const currentDifficulty = modeSettings[gameMode].currentDifficulty || 1;
	const levelLookup = {
		1: 'Easy',
		2: 'Medium',
		3: 'Hard',
		4: 'Expert'
	};

	const container = document.querySelector(`#${gameMode}Mode .difficulty-section`);
	container.innerHTML = ''; // Clear previous content

	const label = document.createElement('label');
	label.className = 'difficulty-heading';
	label.textContent = 'Difficulty:';
	label.setAttribute('for', `${gameMode}-difficulty-select`);

	container.appendChild(label);

	const select = document.createElement('select');
	select.className = 'difficulty-select';
	select.id = `${gameMode}-difficulty-select`;

	// Add difficulty levels as <option> elements
    const maxLevel = modeSettings[gameMode]?.levels || 3;
    for (let i = 1; i <= maxLevel; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = levelLookup[i] || `Level ${i}`;
        if (i === currentDifficulty) {
            option.selected = true;
        }
        select.appendChild(option);
    }

	// Handle change event
	select.addEventListener('change', function() {
		const level = parseInt(this.value);
		setDifficultyLevel(level, this);
	});

	container.appendChild(select);
}

// UI
function handleEnterKey(event) {
	if (event.key === 'Enter') {
		event.preventDefault(); // Do I want this? Stops tabbing + pressing enter on buttons
		if (answered) {
			nextQuestion();
			return;
		} else {
			if (currentMode === 'nameThatGate') {
				return;
			} else {
				submitAnswer();
			}
		}
	}
}

function showFeedback(message, type) {
	const feedbackDiv = document.getElementById('feedback');
	feedbackDiv.textContent = message;
	feedbackDiv.className = `feedback ${type}`;
	feedbackDiv.style.display = 'block';
}

function hideFeedback() {
	// Hide feedback and next button
	document.getElementById('feedback').style.display = 'none';
}

function showNextButton() {
	document.getElementById('nextBtn').style.display = 'inline-block';
}

function hideNextButton() {
	document.getElementById('nextBtn').style.display = 'none';
}

function updateScoreDisplay() {
	document.getElementById('scoreDisplay').textContent = `${score}/${totalQuestions}`;
}

function showSubmitButton() {
    // No submit button in nameThatGate mode
    if (currentMode === 'nameThatGate') {
        return;
    }
	document.getElementById('submitBtn').style.display = 'inline-block';
}

function hideSubmitButton() {
	document.getElementById('submitBtn').style.display = 'none';
}

function toggleHelpMode() {
	const modeConfig = modeSettings[currentMode];
	
	if (!modeConfig?.help) {
		return; // No help configuration for this mode
	}
	
	// Generate IDs based on the gameMode
	const checkboxId = `${currentMode}DebugMode`;
	const helpInfoId = `${currentMode}HelpInfo`;
	
	const { updateHelp } = modeConfig;
	// Update the mode variable based on checkbox state
	modeConfig.help.enabled = document.getElementById(checkboxId).checked;
	const helpInfoElement = document.getElementById(helpInfoId);

	if (modeConfig.help.enabled) {
		helpInfoElement.style.display = 'block';
		// Call update function if it exists
		if (updateHelp) {
			updateHelp();
		}
	} else {
		helpInfoElement.style.display = 'none';
	}
}

function resetUIState() {
	hideNextButton();
    hideFeedback();
	showSubmitButton();
	answered = false;
}

function nextQuestion() {
    resetUIState();
	if (currentMode === 'nameThatGate') {
		nameThatGateMode.generateQuestion();
	} else if (currentMode === 'writeExpression') {
        // The class's generateQuestion method now handles all setup, including help display.
		expressionWritingMode.generateQuestion();
	} else if (currentMode === 'scenario') {
		scenarioMode.generateQuestion();
	} else if (currentMode === 'truthTable') {
		generateTruthTableQuestion();
		// Reset all select elements
		document.querySelectorAll('.truth-table-select').forEach(select => {
			select.value = '';
			select.disabled = false;
			select.classList.remove('correct', 'incorrect', 'unanswered');
		});
	} else if (currentMode === 'drawCircuit') {
		initDrawCircuitMode();
	} else {
		console.error('Unknown game mode:', currentMode);
	}
}

function setGameMode(mode, clickedButton) {
	const modeConfig = modeSettings[mode];
	
	if (!modeConfig) {
		console.error(`Unknown mode: ${mode}`);
		return;
	}
	
	currentMode = mode;

	// Update button states
	document.querySelectorAll('.mode-selector .btn-select').forEach(btn => {
		btn.classList.remove('active', 'mode-active');
	});
	clickedButton.classList.add('active', 'mode-active');

	// Hide all game modes
	document.querySelectorAll('.game-mode-container').forEach(el => el.style.display = 'none');

	// Hide all help info
	hideAllHelpInfo();

	generateDifficultyDropdown(mode);

	// Show the selected mode
	const activeContainer = document.getElementById(mode + 'Mode');
	if (activeContainer) {
		activeContainer.style.display = 'block';
	}

	// Reset answered state and hide feedback/buttons
	resetUIState();

	// Initialize the selected mode
	if (modeConfig.initialize) {
		modeConfig.initialize();
	}
	
	// Show help if enabled
	if (modeConfig.help?.enabled) {
		const helpElement = document.getElementById(`${mode}HelpInfo`);
		if (helpElement) {
			helpElement.style.display = 'block';
			// Call update function if it exists
			if (modeConfig.updateHelp) {
				modeConfig.updateHelp();
			}
		}
	}
}

function hideAllHelpInfo() {
	Object.keys(modeSettings).forEach(mode => {
		if (modeSettings[mode].help) {
			const helpElement = document.getElementById(`${mode}HelpInfo`);
			if (helpElement) {
				helpElement.style.display = 'none';
			}
		}
	});
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
	document.addEventListener('keydown', handleEnterKey);

	// Define the dependencies object that the modes need
	const commonDependencies = {
		ui: {
			showFeedback,
			showNextButton,
			hideSubmitButton,
			updateScoreDisplay,
		},
		state: {
			getAnswered: () => answered,
			setAnswered: (val) => { answered = val; },
			incrementScore: () => { score++; },
			incrementTotalQuestions: () => { totalQuestions++; }
		}
	};
	// Pass the dependencies when creating the instance
	nameThatGateMode = new NameThatGate(circuitGenerator, commonDependencies);

    expressionWritingMode = new ExpressionWriting(circuitGenerator, commonDependencies);

    scenarioMode = new Scenario(circuitGenerator, commonDependencies);

	generateModeSelectorButtons();

	// Set the initial active button correctly
	const initialModeButton = document.querySelector('.mode-selector .btn-select');
	if (initialModeButton) {
		setGameMode('nameThatGate', initialModeButton);
	} else {
		generateNameThatGateQuestion();
	}
	updateScoreDisplay();

	preloadGateImages()

});

function setDifficultyLevel(level, clickedButton) {
	const modeConfig = modeSettings[currentMode];
	
	if (!modeConfig) {
		console.error(`Unknown mode: ${currentMode}`);
		return;
	}
	
	// Update difficulty level
	modeSettings[currentMode].currentDifficulty = level;

    // Delegate difficulty change to the class if it's the active mode
	if (currentMode === 'writeExpression') {
        expressionWritingMode.setDifficulty(level);
    } else if (modeConfig.generateQuestion) { // Fallback for unre-factored modes
		modeConfig.generateQuestion();
	}
	
	hideFeedback();
	
	// Update help if needed
	if (modeConfig.updateHelp) {
		modeConfig.updateHelp();
	}
	
	// Reset UI state
	resetUIState();
}

function submitAnswer(answer = '') {
	if (answered) return;

	if (currentMode === 'drawCircuit') {
		checkCircuitAnswer();
	} else if (currentMode === 'writeExpression') {
		expressionWritingMode.checkAnswer(); // Delegate to the class method
	} else if (currentMode === 'scenario') {
		scenarioMode.checkAnswer();
	} else if (currentMode === 'truthTable') {
		checkTruthTableAnswer();
	}
}

// Truth Table Mode functionality
function toggleIntermediateColumns() {
	showIntermediateColumns = document.getElementById('showIntermediateColumns').checked;

	// Don't generate a new question, just update the current table display
	if (currentTruthTableExpression) {
		const truthTableContainer = document.getElementById('truthTableContainer');

		// Re-parse the current expression
		const parsedData = parseExpressionForTruthTable(currentTruthTableExpression);
		const intermediateExpressions = parsedData.intermediateExpressions;

		// Recalculate the truth table data with/without intermediate columns
		const inputCombinations = generateInputCombinations(truthTableInputs);
		currentTruthTableData = inputCombinations.map(combination => {
			const result = {
				...combination
			};

			// Calculate intermediate values if they exist
			if (showIntermediateColumns && intermediateExpressions.length > 0) {
				intermediateExpressions.forEach((expr, index) => {
					result[`intermediate_${index}`] = evaluateExpression(expr, combination);
				});
			}

			// Calculate final output
			result.Q = evaluateExpression(currentTruthTableExpression.split(' = ')[1], combination);

			return result;
		});

		// Regenerate only the table HTML, preserving user inputs
		const currentUserInputs = {};
		document.querySelectorAll('.truth-table-select').forEach(select => {
			const rowIndex = select.dataset.row;
			const columnName = select.dataset.column;
			const inputKey = `${rowIndex}_${columnName}`;
			currentUserInputs[inputKey] = select.value;
		});

		generateTruthTableHTML(truthTableContainer, truthTableInputs, intermediateExpressions);

		// Restore user inputs
		document.querySelectorAll('.truth-table-select').forEach(select => {
			const rowIndex = select.dataset.row;
			const columnName = select.dataset.column;
			const inputKey = `${rowIndex}_${columnName}`;
			if (currentUserInputs[inputKey]) {
				select.value = currentUserInputs[inputKey];
			}
		});
	}
}

function toggleExpertMode() {
	expertMode = document.getElementById('expertMode').checked;

	// Regenerate the current question with expert mode settings
	if (currentTruthTableExpression) {
		const truthTableContainer = document.getElementById('truthTableContainer');

		// Re-parse the current expression
		const parsedData = parseExpressionForTruthTable(currentTruthTableExpression);
		const intermediateExpressions = parsedData.intermediateExpressions;

		// Generate fresh table - no state preservation when toggling expert mode
		generateTruthTableHTML(truthTableContainer, truthTableInputs, intermediateExpressions);

		// Reset any visual feedback from previous attempts
		document.querySelectorAll('.truth-table-select').forEach(select => {
			select.classList.remove('correct', 'incorrect', 'unanswered', 'optional-unanswered');
			select.disabled = false;
		});

		// Reset answered state and show submit button
        resetUIState()
        
	}
}

function generateTruthTableQuestion() {
	const expressionDisplay = document.getElementById('truthTableExpression');
	const truthTableContainer = document.getElementById('truthTableContainer');
	const truthTableCircuitContainer = document.getElementById('truthTableLogicDiagramDisplay');

	// Get expressions for current difficulty level
	const expressions = expressionDatabase[`level${modeSettings.truthTable.currentDifficulty}`];

	// Pick a random expression
	currentTruthTableExpression = expressions[Math.floor(Math.random() * expressions.length)];

	// Display the expression
	expressionDisplay.innerHTML = `<div class="expression-text">${currentTruthTableExpression}</div>`;
	circuitGenerator.generateCircuit(currentTruthTableExpression, truthTableCircuitContainer);

	// Parse the expression to get inputs and intermediate expressions
	const parsedData = parseExpressionForTruthTable(currentTruthTableExpression);
	truthTableInputs = parsedData.inputs;
	const intermediateExpressions = parsedData.intermediateExpressions;

	// Generate all possible input combinations
	const inputCombinations = generateInputCombinations(truthTableInputs);

	// Calculate correct outputs for all combinations
	currentTruthTableData = inputCombinations.map(combination => {
		const result = {
			...combination
		};

		// Calculate intermediate values if they exist
		if (showIntermediateColumns && intermediateExpressions.length > 0) {
			intermediateExpressions.forEach((expr, index) => {
				result[`intermediate_${index}`] = evaluateExpression(expr, combination);
			});
		}

		// Calculate final output
		result.Q = evaluateExpression(currentTruthTableExpression.split(' = ')[1], combination);
		return result;
	});

	// Generate the HTML for the truth table
	generateTruthTableHTML(truthTableContainer, truthTableInputs, intermediateExpressions);
}

function parseExpressionForTruthTable(expression) {
	// Remove "Q = " from the beginning
	const rightSide = expression.split(' = ')[1];

	// More robust approach: split by operators and extract variables
	// First, replace operators with separators
	let cleanExpression = rightSide
		.replace(/\bAND\b/g, ' | ')
		.replace(/\bOR\b/g, ' | ')
		.replace(/\bNOT\b/g, ' | ')
		.replace(/[()]/g, ' | ');

	// Split by separators and filter for single letter variables
	const tokens = cleanExpression.split('|').map(token => token.trim()).filter(token => token.length > 0);

	const inputs = [...new Set(tokens.filter(token =>
		token.length === 1 && token.match(/[A-Z]/)
	))].sort();

	// For intermediate expressions, we'll identify sub-expressions in parentheses
	const intermediateExpressions = [];

	if (showIntermediateColumns) {
		// Find expressions in parentheses that aren't negated entire expressions
		const parenthesesMatches = rightSide.match(/\([^()]+\)/g) || [];
		parenthesesMatches.forEach(match => {
			const cleaned = match.slice(1, -1); // Remove outer parentheses
			if (!intermediateExpressions.includes(cleaned)) {
				intermediateExpressions.push(cleaned);
			}
		});
	}

	return {
		inputs,
		intermediateExpressions
	};
}

function generateInputCombinations(inputs) {
	const numInputs = inputs.length;
	const numCombinations = Math.pow(2, numInputs);
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

function evaluateExpression(expression, values) {
	try {
		// Replace variable names with their boolean values
		let evalExpression = expression;

		// Replace variables with their values
		Object.keys(values).forEach(variable => {
			const regex = new RegExp(`\\b${variable}\\b`, 'g');
			evalExpression = evalExpression.replace(regex, values[variable]);
		});

		// Replace boolean operators with JavaScript equivalents
		evalExpression = evalExpression
			.replace(/\bAND\b/g, '&&')
			.replace(/\bOR\b/g, '||')
			.replace(/\bNOT\b/g, '!');

		// Evaluate the expression
		return eval(evalExpression);
	} catch (error) {
		console.error('Error evaluating expression:', expression, error);
		return false;
	}
}

function generateTruthTableHTML(container, inputs, intermediateExpressions) {
	let tableHTML = '<table class="truth-table"><thead><tr>';

	// Input column headers
	inputs.forEach(input => {
		tableHTML += `<th class="input-header">${input}</th>`;
	});

	// Intermediate column headers (if enabled)
	if (showIntermediateColumns && intermediateExpressions.length > 0) {
		intermediateExpressions.forEach((expr, index) => {
			tableHTML += `<th class="intermediate-header" title="${expr}">${expr.length > 10 ? expr.substring(0, 10) + '...' : expr}</th>`;
		});
	}

	// Output column header
	tableHTML += '<th class="output-header">Q</th>';
	tableHTML += '</tr></thead><tbody>';

	// Generate table rows
	currentTruthTableData.forEach((row, rowIndex) => {
		tableHTML += '<tr>';

		// Input columns
		inputs.forEach(input => {
			if (expertMode) {
				// In expert mode, input columns are editable dropdowns
				tableHTML += `<td class="input-cell">
                    <select class="truth-table-select input-select expert-input" data-row="${rowIndex}" data-column="${input}">
                        <option value="">?</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select>
                </td>`;
			} else {
				// In normal mode, input columns are read-only
				const value = row[input] ? 1 : 0;
				tableHTML += `<td class="input-cell">${value}</td>`;
			}
		});

		// Intermediate columns (user input - optional in normal mode, required in expert mode)
		if (showIntermediateColumns && intermediateExpressions.length > 0) {
			intermediateExpressions.forEach((expr, index) => {
				const selectClass = expertMode ? 'expert-intermediate' : '';
				tableHTML += `<td class="intermediate-cell">
                    <select class="truth-table-select intermediate-select ${selectClass}" data-row="${rowIndex}" data-column="intermediate_${index}">
                        <option value="">?</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select>
                </td>`;
			});
		}

		// Output column (user input - required)
		const outputSelectClass = expertMode ? 'expert-output' : '';
		tableHTML += `<td class="output-cell">
            <select class="truth-table-select output-select ${outputSelectClass}" data-row="${rowIndex}" data-column="Q">
                <option value="">?</option>
                <option value="0">0</option>
                <option value="1">1</option>
            </select>
        </td>`;

		tableHTML += '</tr>';
	});

	tableHTML += '</tbody></table>';
	container.innerHTML = tableHTML;
}

function checkTruthTableAnswer() {
	if (answered) return;

	answered = true;
	totalQuestions++;

	hideSubmitButton();

	if (expertMode) {
		checkTruthTableExpertModeAnswer();
	} else {
		checkTruthTableNormalModeAnswer();
	}

	updateScoreDisplay();
	showNextButton();
}

function checkTruthTableNormalModeAnswer() {
	// Get all user inputs - both output and intermediate columns
	const outputSelects = document.querySelectorAll('.output-select');
	const intermediateSelects = document.querySelectorAll('.intermediate-select');

	let outputCorrect = 0;
	let outputTotal = 0;
	let allOutputAnswered = true;

	// Check output column (Q) - this is what counts for scoring
	outputSelects.forEach(select => {
		const rowIndex = parseInt(select.dataset.row);
		const userValue = select.value;

		if (userValue === '') {
			allOutputAnswered = false;
			select.classList.add('unanswered');
			return;
		}

		outputTotal++;
		const correctValue = currentTruthTableData[rowIndex].Q ? '1' : '0';
		if (userValue === correctValue) {
			outputCorrect++;
			select.classList.add('correct');
		} else {
			select.classList.add('incorrect');
		}

		// Disable the select to prevent further changes
		select.disabled = true;
	});

	// Check intermediate columns (optional - for feedback only, not scoring)
	intermediateSelects.forEach(select => {
		const rowIndex = parseInt(select.dataset.row);
		const columnName = select.dataset.column;
		const userValue = select.value;

		// Only check if user provided an answer
		if (userValue !== '') {
			const correctValue = currentTruthTableData[rowIndex][columnName] ? '1' : '0';

			if (userValue === correctValue) {
				select.classList.add('correct');
			} else {
				select.classList.add('incorrect');
			}
		} else {
			// If not answered, just mark as optional (no highlighting)
			select.classList.add('optional-unanswered');
		}

		// Disable the select to prevent further changes
		select.disabled = true;
	});

	if (!allOutputAnswered) {
		showFeedback('Please answer all rows in the output column (Q). Try again or move on.', 'incorrect');
        resetUIState();

		// Re-enable all selects
		document.querySelectorAll('.truth-table-select').forEach(select => {
			select.disabled = false;
			select.classList.remove('unanswered');
		});
		return;
	}

	// Score is based only on output column (Q)
	if (outputCorrect === outputTotal) {
		score++;
		showFeedback('Correct! Perfect truth table!', 'correct');
	} else {
		showFeedback(`Output column: ${outputCorrect}/${outputTotal} correct. Review the highlighted answers.`, 'incorrect');
	}
}

function checkTruthTableExpertModeAnswer() {
	// In expert mode, all fields must be filled and the entire table must be correct
	const allSelects = document.querySelectorAll('.truth-table-select');
	const userRows = [];
	const numRows = currentTruthTableData.length;

	// Collect user answers row by row
	for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
		const userRow = {};
		let allFieldsFilled = true;

		// Get input values
		truthTableInputs.forEach(input => {
			const select = document.querySelector(`[data-row="${rowIndex}"][data-column="${input}"]`);
			if (select && select.value !== '') {
				userRow[input] = select.value === '1';
			} else {
				allFieldsFilled = false;
			}
		});

		// Get intermediate values if they exist
		if (showIntermediateColumns) {
			const parsedData = parseExpressionForTruthTable(currentTruthTableExpression);
			const intermediateExpressions = parsedData.intermediateExpressions;

			intermediateExpressions.forEach((expr, index) => {
				const select = document.querySelector(`[data-row="${rowIndex}"][data-column="intermediate_${index}"]`);
				if (select && select.value !== '') {
					userRow[`intermediate_${index}`] = select.value === '1';
				} else {
					allFieldsFilled = false;
				}
			});
		}

		// Get output value
		const outputSelect = document.querySelector(`[data-row="${rowIndex}"][data-column="Q"]`);
		if (outputSelect && outputSelect.value !== '') {
			userRow.Q = outputSelect.value === '1';
		} else {
			allFieldsFilled = false;
		}

		if (!allFieldsFilled) {
			showFeedback('Expert Mode: All fields in the truth table must be filled. Continue or move on.', 'incorrect');
            resetUIState();
            

			// Highlight unfilled fields
			allSelects.forEach(select => {
				if (select.value === '') {
					select.classList.add('unanswered');
				} else {
					select.classList.remove('unanswered');
				}
			});
			return;
		}

		userRows.push({
			rowIndex,
			data: userRow
		});
	}

	// Use order-independent validation
	const validationResult = validateExpertModeAnswers(userRows, currentTruthTableData);

	// Disable all selects
	allSelects.forEach(select => {
		select.disabled = true;
	});

	// Apply visual feedback
	allSelects.forEach(select => {
		const rowIndex = parseInt(select.dataset.row);
		const columnName = select.dataset.column;

		const matchedCorrectIndex = validationResult.rowMatches[rowIndex];
		if (matchedCorrectIndex !== -1) {
			// This user row matched a correct row
			const correctRow = currentTruthTableData[matchedCorrectIndex];
			let correctValue;

			if (columnName.startsWith('intermediate_')) {
				correctValue = correctRow[columnName];
			} else {
				correctValue = correctRow[columnName];
			}

			const userValue = select.value === '1';
			if (userValue === correctValue) {
				select.classList.add('correct');
			} else {
				select.classList.add('incorrect');
			}
		} else {
			// This user row didn't match any correct row
			select.classList.add('incorrect');
		}
	});

	if (validationResult.isCorrect) {
		score++;
		showFeedback('Expert Mode: Perfect! All rows are correct!', 'correct');
	} else {
		showFeedback(`Expert Mode: ${validationResult.correctRows}/${numRows} rows correct. Each row must match the inputs and outputs exactly.`, 'incorrect');
	}
}

function validateExpertModeAnswers(userRows, correctData) {
	const numRows = correctData.length;
	const usedCorrectRows = new Set();
	const rowMatches = new Array(numRows).fill(-1);
	let correctRows = 0;

	// Try to match each user row to a unique correct row
	for (let i = 0; i < userRows.length; i++) {
		const userRow = userRows[i];

		// Find a matching correct row that hasn't been used yet
		for (let j = 0; j < correctData.length; j++) {
			if (usedCorrectRows.has(j)) continue;

			const correctRow = correctData[j];

			// Check if this user row matches this correct row
			let matches = true;

			// Check input columns
			for (const input of truthTableInputs) {
				if (userRow.data[input] !== correctRow[input]) {
					matches = false;
					break;
				}
			}

			// Check intermediate columns if they exist
			if (matches && showIntermediateColumns) {
				const parsedData = parseExpressionForTruthTable(currentTruthTableExpression);
				const intermediateExpressions = parsedData.intermediateExpressions;

				for (let idx = 0; idx < intermediateExpressions.length; idx++) {
					const columnName = `intermediate_${idx}`;
					if (userRow.data[columnName] !== correctRow[columnName]) {
						matches = false;
						break;
					}
				}
			}

			// Check output column
			if (matches && userRow.data.Q !== correctRow.Q) {
				matches = false;
			}

			if (matches) {
				// Found a match!
				usedCorrectRows.add(j);
				rowMatches[userRow.rowIndex] = j;
				correctRows++;
				break;
			}
		}
	}

	return {
		isCorrect: correctRows === numRows,
		correctRows: correctRows,
		rowMatches: rowMatches
	};
}

// Circuit Drawing Mode functionality
function initDrawCircuitMode() {
	canvas = document.getElementById('circuitCanvas');
	if (!canvas) {
		console.error("Canvas not found!");
		return;
	}
	ctx = canvas.getContext('2d');

	generateDrawCircuitQuestion();
	enableResetButton();
	disableRemoveSelectedButton();

	addCircuitModeEventListeners();
	draw();
}

function setupCanvas() {
	gates = [];
	wires = [];
	nextId = 0;
	wireStartNode = null;
	selectedGate = null;
	selectedWire = null;

	// Hide feedback from previous question
	document.getElementById('feedback').style.display = 'none';
	document.getElementById('nextBtn').style.display = 'none';

	addTerminals();

	updateInterpretedExpression();
}

function addTerminals() {
	const canvasHeight = canvas.height;
	const canvasWidth = canvas.width;

	const terminalWidth = 60;
	const terminalHeight = 40;

	const inputCount = parsedTargetExpression.inputs.length;

	// Adaptive margins based on number of inputs
	// At 1 input: 25% margin → startY = 25% of canvas
	// At 7 inputs: 10% margin → startY = 10% of canvas
	const minMarginRatio = 0.10;
	const maxMarginRatio = 0.25;
	const clampedInputCount = Math.min(Math.max(inputCount, 1), 7); // clamp to [1, 7]
	const t = (clampedInputCount - 1) / 6; // normalised between 0 (1 input) to 1 (7 inputs)
	const marginRatio = maxMarginRatio - (maxMarginRatio - minMarginRatio) * t;

	const startY = canvasHeight * marginRatio;
	const endY = canvasHeight * (1 - marginRatio);
	const availableHeight = endY - startY;

	const spaceBetween = inputCount > 1 ? availableHeight / (inputCount - 1) : 0;

	inputs = [];

	for (let i = 0; i < inputCount; i++) {
		const inputName = parsedTargetExpression.inputs[i];

		const centerY = inputCount > 1 ?
			startY + i * spaceBetween :
			(startY + endY) / 2;

		inputs.push({
			id: `input-${inputName}`,
			name: inputName,
			x: 30,
			y: centerY - terminalHeight / 2,
			width: terminalWidth,
			height: terminalHeight,
			outputNode: {
				x: 30 + terminalWidth,
				y: centerY,
				gateId: `input-${inputName}`,
				type: 'output',
				connectedTo: null
			}
		});
	}

	const outputName = parsedTargetExpression.output;
	const outputCenterY = canvasHeight / 2;

	output = {
		id: `output-${outputName}`,
		name: outputName,
		x: canvasWidth - 100,
		y: outputCenterY - terminalHeight / 2, // top-left corner
		width: terminalWidth,
		height: terminalHeight,
		inputNode: {
			x: canvasWidth - 100,
			y: outputCenterY,
			gateId: `output-${outputName}`,
			type: 'input',
			connectedTo: null
		}
	};

}

function addCircuitModeEventListeners() {

	// Remove any existing listeners to prevent duplicates
	const canvasClone = canvas.cloneNode(true);
	canvas.parentNode.replaceChild(canvasClone, canvas);
	canvas = canvasClone;
	ctx = canvas.getContext('2d');


	const toolboxGates = document.querySelectorAll('.gate[draggable="true"]');
	toolboxGates.forEach(gate => {
		gate.addEventListener('dragstart', (e) => {
			const targetGate = e.currentTarget;
			e.dataTransfer.setData('text/plain', targetGate.id);

			const svg = targetGate.querySelector('img');
			if (svg) {
				e.dataTransfer.setDragImage(svg, svg.width / 2, svg.height / 2);
			}
		});
	});

	canvas.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	canvas.addEventListener('drop', (e) => {
		e.preventDefault();

		// Guard clause to ensure drag originated from toolbox
		const dragData = e.dataTransfer.getData('text/plain');

		if (!dragData) {
			return;
		}

		const id = dragData;
		const type = id.replace('drag-', '');
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		addGate(type, x, y);
	});

	canvas.addEventListener('mousedown', (e) => {
		// Prevent multiple rapid-fire events
		if (draggingGate) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		if (answered) {
			return;
		}

		const pos = getMousePos(e);

		// Try to snap to a nearby node first
		const snappedNode = getClickedNode(pos) || getNearbyNode(pos);

		if (snappedNode) {
			wireStartNode = snappedNode;
			clearSelections();
		} else {
			// Check if clicking on a wire first
			const clickedWire = getClickedWire(pos);
			if (clickedWire) {
				clearSelections();
				selectedWire = clickedWire;
				enableRemoveSelectedButton();
				draw();
				return;
			}

			// Check if clicking on a gate
			const clickedGate = getClickedGate(pos);
			if (clickedGate) {

				// If shift key is held, start dragging; otherwise, select
				if (e.shiftKey) {
					// Additional safety check
					if (draggingGate) {
						e.preventDefault();
						e.stopPropagation();
						return;
					}

					draggingGate = clickedGate;
					draggingOffset.x = pos.x - clickedGate.x;
					draggingOffset.y = pos.y - clickedGate.y;
					e.preventDefault();
					e.stopPropagation();
				} else {
					clearSelections();
					selectedGate = clickedGate;
					enableRemoveSelectedButton();
					draw();
				}
			} else {
				disableRemoveSelectedButton();
				clearSelections();
				draw();
			}
		}
	});

	canvas.addEventListener('mousemove', (e) => {
		if (draggingGate) {
			const pos = getMousePos(e);
			draggingGate.x = pos.x - draggingOffset.x;
			draggingGate.y = pos.y - draggingOffset.y;
			updateGateNodes(draggingGate);
			draw();
		} else if (wireStartNode) {
			const pos = getMousePos(e);
			const nearbyNode = getNearbyNode(pos);

			draw();

			// Draw the wire being created
			ctx.beginPath();
			ctx.moveTo(wireStartNode.x, wireStartNode.y);

			if (nearbyNode && nearbyNode !== wireStartNode && nearbyNode.type !== wireStartNode.type) {
				// Snap to nearby compatible node
				ctx.lineTo(nearbyNode.x, nearbyNode.y);
				ctx.strokeStyle = '#27ae60'; // Green when snapping
				ctx.lineWidth = 3;
				ctx.stroke();

				// Draw snap indicator around the target node (separate path)
				ctx.beginPath();
				ctx.arc(nearbyNode.x, nearbyNode.y, 10, 0, 2 * Math.PI);
				ctx.strokeStyle = '#27ae60';
				ctx.lineWidth = 2;
				ctx.stroke();
			} else {
				// Normal wire preview
				ctx.lineTo(pos.x, pos.y);
				ctx.strokeStyle = '#3498db';
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}
	});

	canvas.addEventListener('mouseup', (e) => {
		if (wireStartNode) {
			const pos = getMousePos(e);
			const endNode = getClickedNode(pos) || getNearbyNode(pos);
			if (endNode && endNode !== wireStartNode && endNode.type !== wireStartNode.type) {
				addWire(wireStartNode, endNode);
			}
			wireStartNode = null;
		}

		draggingGate = null;
		draw();
		updateInterpretedExpression();

	});

	document.getElementById('resetCircuitBtn').addEventListener('click', () => {
		if (answered) return;
		resetUIState();
		disableRemoveSelectedButton();
		setupCanvas();
		draw();
	});

	// Add event listener for remove selected button
	document.getElementById('removeSelectedBtn').addEventListener('click', () => {
		removeSelected();
	});
}

function addGate(type, x, y) {
	const gateWidth = 120;
	const gateHeight = 54;
	const newGate = {
		id: nextId++,
		type: type,
		x: x - gateWidth / 2,
		y: y - gateHeight / 2,
		width: gateWidth,
		height: gateHeight,
		image: gateImages[type],
		inputNodes: [],
		outputNode: {
			x: x + gateWidth / 2,
			y: y,
			gateId: nextId - 1,
			type: 'output',
			connectedTo: null
		}
	};

	if (type === 'NOT') {
		newGate.inputNodes.push({
			x: x - gateWidth / 2,
			y: y,
			gateId: newGate.id,
			type: 'input',
			index: 0,
			connectedTo: null
		});
	} else { // AND, OR
		newGate.inputNodes.push({
			x: x - gateWidth / 2,
			y: y - 10,
			gateId: newGate.id,
			type: 'input',
			index: 0,
			connectedTo: null
		});
		newGate.inputNodes.push({
			x: x - gateWidth / 2,
			y: y + 10,
			gateId: newGate.id,
			type: 'input',
			index: 1,
			connectedTo: null
		});
	}

	gates.push(newGate);

	clearSelections();
	draw();
}

function addWire(startNode, endNode) {
	let fromNode = startNode.type === 'output' ? startNode : endNode;
	let toNode = startNode.type === 'input' ? startNode : endNode;

	wires = wires.filter(w => w.to !== toNode);
	if (toNode.connectedTo) {
		const prevFromNode = findNodeByConnectionInfo(toNode.connectedTo);
		if (prevFromNode) prevFromNode.connectedTo = null;
	}

	wires.push({
		from: fromNode,
		to: toNode
	});
	fromNode.connectedTo = {
		gateId: toNode.gateId,
		nodeIndex: toNode.index,
		nodeType: 'input'
	};
	toNode.connectedTo = {
		gateId: fromNode.gateId,
		nodeIndex: fromNode.index,
		nodeType: 'output'
	};
}

function draw() {
	if (!ctx) return;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw wires
	wires.forEach(wire => {
		ctx.beginPath();
		ctx.moveTo(wire.from.x, wire.from.y);
		ctx.lineTo(wire.to.x, wire.to.y);

		// Highlight selected wire
		if (selectedWire === wire) {
			ctx.strokeStyle = '#e74c3c';
			ctx.lineWidth = 4;
		} else {
			ctx.strokeStyle = '#333';
			ctx.lineWidth = 2;
		}

		ctx.stroke();
	});

	// Draw gates
	gates.forEach(gate => {
		// Highlight selected gate
		if (gate.image && gate.image.complete) {
			ctx.drawImage(gate.image, gate.x, gate.y, gate.width, gate.height);

			// Optional: highlight border if selected
			if (selectedGate === gate) {
				ctx.strokeStyle = '#3498db';
				ctx.lineWidth = 3;
				ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);
			}
		} else {
			// Fallback while image is loading
			ctx.fillStyle = selectedGate === gate ? '#3498db' : '#f0f0f0';
			ctx.strokeStyle = selectedGate === gate ? '#2980b9' : '#333';
			ctx.lineWidth = selectedGate === gate ? 3 : 1;
			ctx.fillRect(gate.x, gate.y, gate.width, gate.height);
			ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);

			ctx.fillStyle = selectedGate === gate ? '#fff' : '#000';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = '16px Arial';
			ctx.fillText(gate.type, gate.x + gate.width / 2, gate.y + gate.height / 2);
		}

		drawNodesForGate(gate);
	});

	// Draw input/output terminals
	[...inputs, output].forEach(io => {
		ctx.fillStyle = '#d1e7dd';
		ctx.strokeStyle = '#0f5132';
		ctx.lineWidth = 1;
		ctx.fillRect(io.x, io.y, io.width, io.height);
		ctx.strokeRect(io.x, io.y, io.width, io.height);

		ctx.fillStyle = '#000';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = '16px Arial';
		ctx.fillText(io.name, io.x + io.width / 2, io.y + io.height / 2);

		if (io.outputNode) drawNode(io.outputNode);
		if (io.inputNode) drawNode(io.inputNode);
	});
}

// Stores PNG images for the canvas
function preloadGateImages() {
	['AND', 'OR', 'NOT'].forEach(type => {
		const img = new Image();
		img.src = `/img/png/${type.toLowerCase()}.png`;
		gateImages[type] = img;
	});
}

function drawNodesForGate(gate) {
	gate.inputNodes.forEach(drawNode);
	drawNode(gate.outputNode);
}

function drawNode(node) {
	ctx.beginPath();
	ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
	ctx.fillStyle = node.connectedTo ? '#3498db' : '#fff';
	ctx.strokeStyle = '#333';
	ctx.lineWidth = 1;
	ctx.fill();
	ctx.stroke();
}

// --- SELECTION AND REMOVAL FUNCTIONS ---
function clearSelections() {
	disableRemoveSelectedButton();
	selectedGate = null;
	selectedWire = null;
}

function getClickedWire(pos) {
	const tolerance = 5; // Distance tolerance for clicking on a wire

	for (const wire of wires) {
		const dist = distanceToLine(pos, wire.from, wire.to);
		if (dist <= tolerance) {
			return wire;
		}
	}
	return null;
}

function distanceToLine(point, lineStart, lineEnd) {
	const A = point.x - lineStart.x;
	const B = point.y - lineStart.y;
	const C = lineEnd.x - lineStart.x;
	const D = lineEnd.y - lineStart.y;

	const dot = A * C + B * D;
	const lenSq = C * C + D * D;

	if (lenSq === 0) {
		// Line is a point
		return Math.sqrt(A * A + B * B);
	}

	let param = dot / lenSq;

	let xx, yy;

	if (param < 0) {
		xx = lineStart.x;
		yy = lineStart.y;
	} else if (param > 1) {
		xx = lineEnd.x;
		yy = lineEnd.y;
	} else {
		xx = lineStart.x + param * C;
		yy = lineStart.y + param * D;
	}

	const dx = point.x - xx;
	const dy = point.y - yy;
	return Math.sqrt(dx * dx + dy * dy);
}

function removeSelected() {
	if (selectedGate) {
		removeGate(selectedGate);
		selectedGate = null;
		disableRemoveSelectedButton();
	} else if (selectedWire) {
		removeWire(selectedWire);
		selectedWire = null;
		disableRemoveSelectedButton();
	}
	draw();
	updateInterpretedExpression();
}

function removeGate(gateToRemove) {
	// Remove all wires connected to this gate
	wires = wires.filter(wire => {
		const isConnectedToGate = wire.from.gateId === gateToRemove.id || wire.to.gateId === gateToRemove.id;

		if (isConnectedToGate) {
			// Clear connection references
			if (wire.from.connectedTo && wire.from.gateId === gateToRemove.id) {
				const connectedNode = findNodeByConnectionInfo(wire.from.connectedTo);
				if (connectedNode) connectedNode.connectedTo = null;
			}
			if (wire.to.connectedTo && wire.to.gateId === gateToRemove.id) {
				const connectedNode = findNodeByConnectionInfo(wire.to.connectedTo);
				if (connectedNode) connectedNode.connectedTo = null;
			}

			// Clear the gate's node connections
			gateToRemove.inputNodes.forEach(node => node.connectedTo = null);
			gateToRemove.outputNode.connectedTo = null;
		}

		return !isConnectedToGate;
	});

	// Remove the gate itself
	gates = gates.filter(gate => gate.id !== gateToRemove.id);
}

function removeWire(wireToRemove) {
	// Clear connection references
	if (wireToRemove.from.connectedTo) {
		wireToRemove.from.connectedTo = null;
	}
	if (wireToRemove.to.connectedTo) {
		wireToRemove.to.connectedTo = null;
	}

	// Remove the wire
	wires = wires.filter(wire => wire !== wireToRemove);
}

/**
 * Checks if the user's circuit is logically equivalent to the target expression.
 * It does this by comparing the truth table of both expressions.
 */
function checkCircuitAnswer() {
	const userExprText = document.getElementById('interpretedExpression').textContent;
	const feedback = document.getElementById('feedback');

	if (userExprText.includes('?')) {
		feedback.textContent = 'Your circuit is not complete yet.';
		feedback.className = 'feedback incorrect';
		feedback.style.display = 'block';
		return;
	}

	const userExprParts = userExprText.split('=');
	if (userExprParts.length < 2 || userExprParts[0].trim() !== parsedTargetExpression.output) {
		feedback.textContent = `Incorrect. Your circuit outputs to ${userExprParts[0].trim()} but it should output to ${parsedTargetExpression.output}.`;
		feedback.className = 'feedback incorrect';
		feedback.style.display = 'block';
		return;
	}

	const possibleAnswers = generateAllAcceptedAnswers(targetExpression);

	const isCorrect = possibleAnswers.some(acceptedAnswer => {
		return userExprText === acceptedAnswer;
	});

	if (isCorrect) {
		feedback.textContent = 'Correct! The circuit matches the expression.';
		feedback.className = 'feedback correct';
		document.getElementById('nextBtn').style.display = 'inline-block';
		document.getElementById('submitBtn').style.display = 'none';
		answered = true;
		disableResetButton();
	} else {
		feedback.textContent = `Incorrect. Your circuit diagram (${userExprText}) does not match the target diagram (${targetExpression}).`;
		feedback.className = 'feedback incorrect';
	}
	feedback.style.display = 'block';
}

// --- UTILITY AND LOGIC FUNCTIONS ---
function parseExpression(expression) {
	const parts = expression.split('=');
	if (parts.length !== 2) return {
		output: 'Q',
		inputs: ['A', 'B']
	}; // Default fallback

	const outputVar = parts[0].trim();
	const rightSide = parts[1].trim();

	const tokens = rightSide.split(/[^A-Z0-9_]/).filter(Boolean);
	const booleanOperators = new Set(['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR']);

	const variables = tokens.filter(token => !booleanOperators.has(token));
	const uniqueVariables = [...new Set(variables)].sort();

	return {
		output: outputVar,
		inputs: uniqueVariables
	};
}

function getMousePos(evt) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function getClickedGate(pos) {
	for (let i = gates.length - 1; i >= 0; i--) {
		const gate = gates[i];
		if (pos.x > gate.x && pos.x < gate.x + gate.width && pos.y > gate.y && pos.y < gate.y + gate.height) {
			return gate;
		}
	}
	return null;
}

function getClickedNode(pos) {
	const allNodes = [];
	gates.forEach(g => allNodes.push(...g.inputNodes, g.outputNode));
	inputs.forEach(i => allNodes.push(i.outputNode));
	allNodes.push(output.inputNode);

	for (const node of allNodes) {
		const dist = Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2);
		if (dist < 6) return node;
	}
	return null;
}

function getNearbyNode(pos) {
	const snapDistance = 20; // Distance within which to snap
	const allNodes = [];
	gates.forEach(g => allNodes.push(...g.inputNodes, g.outputNode));
	inputs.forEach(i => allNodes.push(i.outputNode));
	allNodes.push(output.inputNode);

	let closestNode = null;
	let closestDistance = snapDistance;

	for (const node of allNodes) {
		const dist = Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2);
		if (dist < closestDistance) {
			closestNode = node;
			closestDistance = dist;
		}
	}

	return closestNode;
}

function updateGateNodes(gate) {
	gate.outputNode.x = gate.x + gate.width;
	gate.outputNode.y = gate.y + gate.height / 2;
	if (gate.type === 'NOT') {
		gate.inputNodes[0].x = gate.x;
		gate.inputNodes[0].y = gate.y + gate.height / 2;
	} else {
		gate.inputNodes[0].x = gate.x;
		gate.inputNodes[0].y = gate.y + gate.height / 2 - 10;
		gate.inputNodes[1].x = gate.x;
		gate.inputNodes[1].y = gate.y + gate.height / 2 + 10;
	}
}

function findNodeByConnectionInfo(connection) {
	const {
		gateId,
		nodeIndex,
		nodeType
	} = connection;
	if (String(gateId).startsWith('input-')) {
		const input = inputs.find(i => i.id === gateId);
		return input ? input.outputNode : null;
	}
	if (String(gateId).startsWith('output-')) {
		return output.inputNode;
	}
	const gate = gates.find(g => g.id === gateId);
	if (!gate) return null;
	return nodeType === 'input' ? gate.inputNodes[nodeIndex] : gate.outputNode;
}

function updateInterpretedExpression() {
	const expressionElement = document.getElementById('interpretedExpression');

	if (output?.inputNode?.connectedTo) {
		// ✅ Q is connected → build expression from Q
		const expression = buildExpression(output.inputNode);
		const outputName = output.name || '?';
		expressionElement.textContent = `${outputName} = ${expression}`;
		return;
	}

	// ❌ Q is not connected → look for a fully connected gate
	const gate = gates.find(gate =>
		gate.outputNode &&
		gate.outputNode.connectedTo == null &&
		gate.inputNodes.length > 0 &&
		gate.inputNodes.every(node => node.connectedTo)
	);

	if (gate) {
		const expression = buildExpression(gate.outputNode);
		expressionElement.textContent = expression;
	} else {
		expressionElement.textContent = '';
	}
}

function buildExpression(node) {
	if (!node) {
		return '?';
	}

	// 🔁 If it's an output node, find its gate and recurse
	if (node.type === 'output') {
		const gate = gates.find(g => g.id === node.gateId);
		if (!gate) {
			return '?';
		}

		return buildExpressionFromGate(gate);
	}

	// 🔁 If it's an input node, follow its connection
	if (!node.connectedTo) {
		return '?';
	}

	const sourceGateId = node.connectedTo.gateId;

	if (String(sourceGateId).startsWith('input-')) {
		const input = inputs.find(i => i.id === sourceGateId);
		const inputName = input ? input.name : '?';
		return inputName;
	}

	const sourceGate = gates.find(g => g.id === sourceGateId);
	if (!sourceGate) {
		return '?';
	}

	return buildExpressionFromGate(sourceGate);
}

function buildExpressionFromGate(gate) {

	const inputsExpr = gate.inputNodes.map(inputNode => {
		let expr = buildExpression(inputNode);

		// Wrap if it contains any binary operator
		if (expr.includes(' AND ') || expr.includes(' OR ') || expr.includes(' XOR ')) {
			expr = `(${expr})`;
		}

		// Wrap NOT expressions as well (we'll identify them as starting with "NOT ")
		if (expr.startsWith('NOT ')) {
			expr = `(${expr})`;
		}

		return expr;
	});

	let finalExpr;
	if (gate.type === 'NOT') {
		finalExpr = `NOT ${inputsExpr[0]}`;
	} else {
		finalExpr = `${inputsExpr[0]} ${gate.type} ${inputsExpr[1]}`;
	}

	return finalExpr;
}

function enableResetButton() {
	const resetBtn = document.getElementById('resetCircuitBtn');
	if (resetBtn) {
		resetBtn.disabled = false;
		resetBtn.classList.remove('disabled');
	}
}

function disableResetButton() {
	const resetBtn = document.getElementById('resetCircuitBtn');
	if (resetBtn) {
		resetBtn.disabled = true;
		resetBtn.classList.add('disabled');
	}
}

function enableRemoveSelectedButton() {
	const removeBtn = document.getElementById('removeSelectedBtn');
	if (removeBtn) {
		removeBtn.disabled = false;
		removeBtn.classList.remove('disabled');
	}
}

function disableRemoveSelectedButton() {
	const removeBtn = document.getElementById('removeSelectedBtn');
	if (removeBtn) {
		removeBtn.disabled = true;
		removeBtn.classList.add('disabled');
	}
}

function generateDrawCircuitQuestion() {
	// Generate a random expression based on the selected difficulty level
	const levelKey = `level${modeSettings.drawCircuit.currentDifficulty}`;
	const expressions = expressionDatabase[levelKey];

	targetExpression = expressions[Math.floor(Math.random() * expressions.length)];
	document.getElementById('circuitTargetExpression').innerHTML = `<div class="expression-text">${targetExpression}</div>`;

	parsedTargetExpression = parseExpression(targetExpression);

	setupCanvas()
	draw();

}

// Functions exposed to global scope for HTML onclick handlers. Temporary fix before refactoring to use event listeners?
window.nextQuestion = nextQuestion;
window.submitAnswer = submitAnswer;
window.toggleHelpMode = toggleHelpMode;
window.toggleIntermediateColumns = toggleIntermediateColumns;
window.toggleExpertMode = toggleExpertMode;
window.setGameMode = setGameMode;
window.setDifficultyLevel = setDifficultyLevel;