import { CircuitGenerator } from './circuit-generator.js';
import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers } from './expression-utils.js';
import { ExpressionWriting } from './expression-writing.js';
import { NameThatGate } from './name-that-gate.js';
import { Scenario } from './scenario.js';
import { TruthTable } from './truth-table.js';
import { DrawCircuit } from './draw-circuit.js';
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
		levels: 4, // But level 4 is very hard
		// The class now manages its own difficulty state.
		// This property is kept for now to generate the dropdown.
		currentDifficulty: 1,
		// Delegate initialization and question generation to the class instance
		initialize: () => truthTableMode.initialize(),
		generateQuestion: () => truthTableMode.generateQuestion(),
		// The class now handles its own internal state, so no updateHelp needed here.
		updateHelp: () => {}, 
	},
	drawCircuit: { // V-- REPLACE THIS ENTIRE BLOCK --V
		label: 'Draw Circuit',
		levels: 4,
		currentDifficulty: 1, // Kept for dropdown generation for now
		initialize: () => drawCircuitMode.initialize(),
		generateQuestion: () => drawCircuitMode.generateQuestion(),
		updateHelp: () => drawCircuitMode.updateHelpDisplay(),
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
let truthTableMode;
let drawCircuitMode;
// TODO: (Phase 3) Add instances for other modes as they are refactored

// Create the circuit generator instance
const circuitGenerator = new CircuitGenerator();


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
	    truthTableMode.generateQuestion();
	} else if (currentMode === 'drawCircuit') {
		drawCircuitMode.generateQuestion();
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
			resetUIState, // only used by truth table mode + draw circuit mode
		},
		state: {
			getAnswered: () => answered,
			setAnswered: (val) => { answered = val; },
			incrementScore: () => { score++; },
			incrementTotalQuestions: () => { totalQuestions++; }
		},
	};
	// Pass the dependencies when creating the instance
	nameThatGateMode = new NameThatGate(circuitGenerator, commonDependencies);
    expressionWritingMode = new ExpressionWriting(circuitGenerator, commonDependencies);
    scenarioMode = new Scenario(circuitGenerator, commonDependencies);
	truthTableMode = new TruthTable(circuitGenerator, commonDependencies); 
	drawCircuitMode = new DrawCircuit(commonDependencies);

	generateModeSelectorButtons();

	// Set the initial active button correctly
	const initialModeButton = document.querySelector('.mode-selector .btn-select');
	if (initialModeButton) {
		setGameMode('nameThatGate', initialModeButton);
	} else {
		generateNameThatGateQuestion();
	}
	updateScoreDisplay();

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
	} else if (currentMode === 'truthTable') {
		truthTableMode.setDifficulty(level);
	} else if (currentMode === 'drawCircuit') {
		drawCircuitMode.setDifficulty(level);
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
		drawCircuitMode.checkAnswer(); // Delegate to the class method
	} else if (currentMode === 'writeExpression') {
		expressionWritingMode.checkAnswer(); // Delegate to the class method
	} else if (currentMode === 'scenario') {
		scenarioMode.checkAnswer();
	} else if (currentMode === 'truthTable') {
		truthTableMode.checkAnswer();
	}
}

// Functions exposed to global scope for HTML onclick handlers. Temporary fix before refactoring to use event listeners?
window.nextQuestion = nextQuestion;
window.submitAnswer = submitAnswer;
window.toggleHelpMode = toggleHelpMode;
window.setGameMode = setGameMode;
window.setDifficultyLevel = setDifficultyLevel;