import { CircuitGenerator } from './circuit-generator.js';
import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers } from './expression-utils.js';
import { ExpressionWriting } from './expression-writing.js';
import { NameThatGate } from './name-that-gate.js';
import { Scenario } from './scenario.js';
import { TruthTable } from './truth-table.js';

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
let truthTableMode;
// TODO: (Phase 3) Add instances for other modes as they are refactored

// Create the circuit generator instance
const circuitGenerator = new CircuitGenerator();

// Global variables for draw circuit mode
const drawCircuitState = {
    canvas: null,
    ctx: null,
    gates: [],
    wires: [],
    inputs: [],
    output: null,
    selectedGate: null,
    selectedWire: null,
    nextId: 0,
    draggingGate: null,
    draggingOffset: { x: 0, y: 0 },
    wireStartNode: null,
    targetExpression: "",
    parsedTargetExpression: {},
    gateImages: {} // Moved from global scope
};

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
		},
		resetUIState, // only used by truth table mode?
	};
	// Pass the dependencies when creating the instance
	nameThatGateMode = new NameThatGate(circuitGenerator, commonDependencies);
    expressionWritingMode = new ExpressionWriting(circuitGenerator, commonDependencies);
    scenarioMode = new Scenario(circuitGenerator, commonDependencies);
	truthTableMode = new TruthTable(circuitGenerator, commonDependencies); 

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
	} else if (currentMode === 'truthTable') { // ADD THIS BLOCK
		truthTableMode.setDifficulty(level);
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
		truthTableMode.checkAnswer();
	}
}

// Circuit Drawing Mode functionality
// REPLACE the existing functions with this entire updated block

// Circuit Drawing Mode functionality
function initDrawCircuitMode() {
	// Reference state object
	drawCircuitState.canvas = document.getElementById('circuitCanvas');
	if (!drawCircuitState.canvas) {
		console.error("Canvas not found!");
		return;
	}
	// Reference state object
	drawCircuitState.ctx = drawCircuitState.canvas.getContext('2d');

	generateDrawCircuitQuestion();
	enableResetButton();
	disableRemoveSelectedButton();

	addCircuitModeEventListeners();
	draw();
}

function setupCanvas() {
	// Reference state object
	drawCircuitState.gates = [];
	drawCircuitState.wires = [];
	drawCircuitState.nextId = 0;
	drawCircuitState.wireStartNode = null;
	drawCircuitState.selectedGate = null;
	drawCircuitState.selectedWire = null;

	// Hide feedback from previous question
	document.getElementById('feedback').style.display = 'none';
	document.getElementById('nextBtn').style.display = 'none';

	addTerminals();
	updateInterpretedExpression();
}

function addTerminals() {
	// Reference state object
	const canvasHeight = drawCircuitState.canvas.height;
	const canvasWidth = drawCircuitState.canvas.width;

	const terminalWidth = 60;
	const terminalHeight = 40;

	// Reference state object
	const inputCount = drawCircuitState.parsedTargetExpression.inputs.length;

	const minMarginRatio = 0.10;
	const maxMarginRatio = 0.25;
	const clampedInputCount = Math.min(Math.max(inputCount, 1), 7);
	const t = (clampedInputCount - 1) / 6;
	const marginRatio = maxMarginRatio - (maxMarginRatio - minMarginRatio) * t;

	const startY = canvasHeight * marginRatio;
	const endY = canvasHeight * (1 - marginRatio);
	const availableHeight = endY - startY;

	const spaceBetween = inputCount > 1 ? availableHeight / (inputCount - 1) : 0;

	// Reference state object
	drawCircuitState.inputs = [];

	for (let i = 0; i < inputCount; i++) {
		// Reference state object
		const inputName = drawCircuitState.parsedTargetExpression.inputs[i];
		const centerY = inputCount > 1 ? startY + i * spaceBetween : (startY + endY) / 2;

		// Reference state object
		drawCircuitState.inputs.push({
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
	
	// Reference state object
	const outputName = drawCircuitState.parsedTargetExpression.output;
	const outputCenterY = canvasHeight / 2;

	// Reference state object
	drawCircuitState.output = {
		id: `output-${outputName}`,
		name: outputName,
		x: canvasWidth - 100,
		y: outputCenterY - terminalHeight / 2,
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
	// Use a clone to remove old listeners
	// Reference state object
	const canvasClone = drawCircuitState.canvas.cloneNode(true);
	drawCircuitState.canvas.parentNode.replaceChild(canvasClone, drawCircuitState.canvas);
	drawCircuitState.canvas = canvasClone;
	drawCircuitState.ctx = drawCircuitState.canvas.getContext('2d');

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

	// Reference state object
	drawCircuitState.canvas.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	// Reference state object
	drawCircuitState.canvas.addEventListener('drop', (e) => {
		e.preventDefault();
		const dragData = e.dataTransfer.getData('text/plain');
		if (!dragData) return;

		const id = dragData;
		const type = id.replace('drag-', '');
		// Reference state object
		const rect = drawCircuitState.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		addGate(type, x, y);
	});
	
	// Reference state object
	drawCircuitState.canvas.addEventListener('mousedown', (e) => {
		// Reference state object
		if (drawCircuitState.draggingGate) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		if (answered) return;

		const pos = getMousePos(e);
		const snappedNode = getClickedNode(pos) || getNearbyNode(pos);

		if (snappedNode) {
			// Reference state object
			drawCircuitState.wireStartNode = snappedNode;
			clearSelections();
		} else {
			const clickedWire = getClickedWire(pos);
			if (clickedWire) {
				clearSelections();
				// Reference state object
				drawCircuitState.selectedWire = clickedWire;
				enableRemoveSelectedButton();
				draw();
				return;
			}
			const clickedGate = getClickedGate(pos);
			if (clickedGate) {
				if (e.shiftKey) {
					// Reference state object
					if (drawCircuitState.draggingGate) {
						e.preventDefault();
						e.stopPropagation();
						return;
					}
					// Reference state object
					drawCircuitState.draggingGate = clickedGate;
					drawCircuitState.draggingOffset.x = pos.x - clickedGate.x;
					drawCircuitState.draggingOffset.y = pos.y - clickedGate.y;
					e.preventDefault();
					e.stopPropagation();
				} else {
					clearSelections();
					// Reference state object
					drawCircuitState.selectedGate = clickedGate;
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
	
	// Reference state object
	drawCircuitState.canvas.addEventListener('mousemove', (e) => {
		// Reference state object
		if (drawCircuitState.draggingGate) {
			const pos = getMousePos(e);
			// Reference state object
			drawCircuitState.draggingGate.x = pos.x - drawCircuitState.draggingOffset.x;
			drawCircuitState.draggingGate.y = pos.y - drawCircuitState.draggingOffset.y;
			updateGateNodes(drawCircuitState.draggingGate);
			draw();
		// Reference state object
		} else if (drawCircuitState.wireStartNode) {
			const pos = getMousePos(e);
			const nearbyNode = getNearbyNode(pos);
			draw();
			
			// Reference state object
			drawCircuitState.ctx.beginPath();
			drawCircuitState.ctx.moveTo(drawCircuitState.wireStartNode.x, drawCircuitState.wireStartNode.y);
			
			// Reference state object
			if (nearbyNode && nearbyNode !== drawCircuitState.wireStartNode && nearbyNode.type !== drawCircuitState.wireStartNode.type) {
				drawCircuitState.ctx.lineTo(nearbyNode.x, nearbyNode.y);
				drawCircuitState.ctx.strokeStyle = '#27ae60';
				drawCircuitState.ctx.lineWidth = 3;
				drawCircuitState.ctx.stroke();
				drawCircuitState.ctx.beginPath();
				drawCircuitState.ctx.arc(nearbyNode.x, nearbyNode.y, 10, 0, 2 * Math.PI);
				drawCircuitState.ctx.strokeStyle = '#27ae60';
				drawCircuitState.ctx.lineWidth = 2;
				drawCircuitState.ctx.stroke();
			} else {
				drawCircuitState.ctx.lineTo(pos.x, pos.y);
				drawCircuitState.ctx.strokeStyle = '#3498db';
				drawCircuitState.ctx.lineWidth = 2;
				drawCircuitState.ctx.stroke();
			}
		}
	});

	// Reference state object
	drawCircuitState.canvas.addEventListener('mouseup', (e) => {
		// Reference state object
		if (drawCircuitState.wireStartNode) {
			const pos = getMousePos(e);
			const endNode = getClickedNode(pos) || getNearbyNode(pos);
			// Reference state object
			if (endNode && endNode !== drawCircuitState.wireStartNode && endNode.type !== drawCircuitState.wireStartNode.type) {
				addWire(drawCircuitState.wireStartNode, endNode);
			}
			// Reference state object
			drawCircuitState.wireStartNode = null;
		}
		// Reference state object
		drawCircuitState.draggingGate = null;
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

	document.getElementById('removeSelectedBtn').addEventListener('click', () => {
		removeSelected();
	});
}

function addGate(type, x, y) {
	const gateWidth = 120;
	const gateHeight = 54;
	const newGate = {
		// Reference state object
		id: drawCircuitState.nextId++,
		type: type,
		x: x - gateWidth / 2,
		y: y - gateHeight / 2,
		width: gateWidth,
		height: gateHeight,
		// Reference state object
		image: drawCircuitState.gateImages[type],
		inputNodes: [],
		outputNode: {
			x: x + gateWidth / 2,
			y: y,
			// Reference state object
			gateId: drawCircuitState.nextId - 1,
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
	} else {
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
	// Reference state object
	drawCircuitState.gates.push(newGate);
	clearSelections();
	draw();
}

function addWire(startNode, endNode) {
	let fromNode = startNode.type === 'output' ? startNode : endNode;
	let toNode = startNode.type === 'input' ? startNode : endNode;
	
	// Reference state object
	drawCircuitState.wires = drawCircuitState.wires.filter(w => w.to !== toNode);
	if (toNode.connectedTo) {
		const prevFromNode = findNodeByConnectionInfo(toNode.connectedTo);
		if (prevFromNode) prevFromNode.connectedTo = null;
	}
	
	// Reference state object
	drawCircuitState.wires.push({ from: fromNode, to: toNode });
	fromNode.connectedTo = { gateId: toNode.gateId, nodeIndex: toNode.index, nodeType: 'input' };
	toNode.connectedTo = { gateId: fromNode.gateId, nodeIndex: fromNode.index, nodeType: 'output' };
}

function draw() {
	// Reference state object
	if (!drawCircuitState.ctx) return;
	drawCircuitState.ctx.clearRect(0, 0, drawCircuitState.canvas.width, drawCircuitState.canvas.height);

	// Draw wires
	// Reference state object
	drawCircuitState.wires.forEach(wire => {
		drawCircuitState.ctx.beginPath();
		drawCircuitState.ctx.moveTo(wire.from.x, wire.from.y);
		drawCircuitState.ctx.lineTo(wire.to.x, wire.to.y);
		
		// Reference state object
		if (drawCircuitState.selectedWire === wire) {
			drawCircuitState.ctx.strokeStyle = '#e74c3c';
			drawCircuitState.ctx.lineWidth = 4;
		} else {
			drawCircuitState.ctx.strokeStyle = '#333';
			drawCircuitState.ctx.lineWidth = 2;
		}
		drawCircuitState.ctx.stroke();
	});

	// Draw gates
	// Reference state object
	drawCircuitState.gates.forEach(gate => {
		// Reference state object
		if (gate.image && gate.image.complete) {
			drawCircuitState.ctx.drawImage(gate.image, gate.x, gate.y, gate.width, gate.height);
			// Reference state object
			if (drawCircuitState.selectedGate === gate) {
				drawCircuitState.ctx.strokeStyle = '#3498db';
				drawCircuitState.ctx.lineWidth = 3;
				drawCircuitState.ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);
			}
		} else {
            // Fallback drawing
			// Reference state object
			drawCircuitState.ctx.fillStyle = drawCircuitState.selectedGate === gate ? '#3498db' : '#f0f0f0';
			drawCircuitState.ctx.strokeStyle = drawCircuitState.selectedGate === gate ? '#2980b9' : '#333';
			drawCircuitState.ctx.lineWidth = drawCircuitState.selectedGate === gate ? 3 : 1;
			drawCircuitState.ctx.fillRect(gate.x, gate.y, gate.width, gate.height);
			drawCircuitState.ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);
			drawCircuitState.ctx.fillStyle = drawCircuitState.selectedGate === gate ? '#fff' : '#000';
			drawCircuitState.ctx.textAlign = 'center';
			drawCircuitState.ctx.textBaseline = 'middle';
			drawCircuitState.ctx.font = '16px Arial';
			drawCircuitState.ctx.fillText(gate.type, gate.x + gate.width / 2, gate.y + gate.height / 2);
		}
		drawNodesForGate(gate);
	});

	// Draw input/output terminals
	// Reference state object
	[...drawCircuitState.inputs, drawCircuitState.output].forEach(io => {
		// Reference state object
		drawCircuitState.ctx.fillStyle = '#d1e7dd';
		drawCircuitState.ctx.strokeStyle = '#0f5132';
		drawCircuitState.ctx.lineWidth = 1;
		drawCircuitState.ctx.fillRect(io.x, io.y, io.width, io.height);
		drawCircuitState.ctx.strokeRect(io.x, io.y, io.width, io.height);
		drawCircuitState.ctx.fillStyle = '#000';
		drawCircuitState.ctx.textAlign = 'center';
		drawCircuitState.ctx.textBaseline = 'middle';
		drawCircuitState.ctx.font = '16px Arial';
		drawCircuitState.ctx.fillText(io.name, io.x + io.width / 2, io.y + io.height / 2);

		if (io.outputNode) drawNode(io.outputNode);
		if (io.inputNode) drawNode(io.inputNode);
	});
}

// NOTE: This function's name in the original script.js was `preloadGateImages`.
// It should be updated to ensure the images are stored in the new state object.
function preloadGateImages() {
	['AND', 'OR', 'NOT'].forEach(type => {
		const img = new Image();
		img.src = `/img/png/${type.toLowerCase()}.png`;
		// Reference state object
		drawCircuitState.gateImages[type] = img;
	});
}

function drawNodesForGate(gate) {
	gate.inputNodes.forEach(drawNode);
	drawNode(gate.outputNode);
}

function drawNode(node) {
	// Reference state object
	drawCircuitState.ctx.beginPath();
	drawCircuitState.ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
	drawCircuitState.ctx.fillStyle = node.connectedTo ? '#3498db' : '#fff';
	drawCircuitState.ctx.strokeStyle = '#333';
	drawCircuitState.ctx.lineWidth = 1;
	drawCircuitState.ctx.fill();
	drawCircuitState.ctx.stroke();
}

function clearSelections() {
	disableRemoveSelectedButton();
	// Reference state object
	drawCircuitState.selectedGate = null;
	drawCircuitState.selectedWire = null;
}

function getClickedWire(pos) {
	const tolerance = 5;
	// Reference state object
	for (const wire of drawCircuitState.wires) {
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
	if (lenSq === 0) return Math.sqrt(A * A + B * B);
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
	// Reference state object
	if (drawCircuitState.selectedGate) {
		removeGate(drawCircuitState.selectedGate);
		drawCircuitState.selectedGate = null;
		disableRemoveSelectedButton();
	// Reference state object
	} else if (drawCircuitState.selectedWire) {
		removeWire(drawCircuitState.selectedWire);
		drawCircuitState.selectedWire = null;
		disableRemoveSelectedButton();
	}
	draw();
	updateInterpretedExpression();
}

function removeGate(gateToRemove) {
	// Reference state object
	drawCircuitState.wires = drawCircuitState.wires.filter(wire => {
		const isConnectedToGate = wire.from.gateId === gateToRemove.id || wire.to.gateId === gateToRemove.id;
		if (isConnectedToGate) {
			if (wire.from.connectedTo && wire.from.gateId === gateToRemove.id) {
				const connectedNode = findNodeByConnectionInfo(wire.from.connectedTo);
				if (connectedNode) connectedNode.connectedTo = null;
			}
			if (wire.to.connectedTo && wire.to.gateId === gateToRemove.id) {
				const connectedNode = findNodeByConnectionInfo(wire.to.connectedTo);
				if (connectedNode) connectedNode.connectedTo = null;
			}
			gateToRemove.inputNodes.forEach(node => node.connectedTo = null);
			gateToRemove.outputNode.connectedTo = null;
		}
		return !isConnectedToGate;
	});
	// Reference state object
	drawCircuitState.gates = drawCircuitState.gates.filter(gate => gate.id !== gateToRemove.id);
}

function removeWire(wireToRemove) {
	if (wireToRemove.from.connectedTo) wireToRemove.from.connectedTo = null;
	if (wireToRemove.to.connectedTo) wireToRemove.to.connectedTo = null;
	// Reference state object
	drawCircuitState.wires = drawCircuitState.wires.filter(wire => wire !== wireToRemove);
}

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
	// Reference state object
	if (userExprParts.length < 2 || userExprParts[0].trim() !== drawCircuitState.parsedTargetExpression.output) {
		// Reference state object
		feedback.textContent = `Incorrect. Your circuit outputs to ${userExprParts[0].trim()} but it should output to ${drawCircuitState.parsedTargetExpression.output}.`;
		feedback.className = 'feedback incorrect';
		feedback.style.display = 'block';
		return;
	}

	// Reference state object
	const possibleAnswers = generateAllAcceptedAnswers(drawCircuitState.targetExpression);
	const isCorrect = possibleAnswers.some(acceptedAnswer => userExprText === acceptedAnswer);

	if (isCorrect) {
		feedback.textContent = 'Correct! The circuit matches the expression.';
		feedback.className = 'feedback correct';
		document.getElementById('nextBtn').style.display = 'inline-block';
		document.getElementById('submitBtn').style.display = 'none';
		answered = true;
		disableResetButton();
	} else {
		// Reference state object
		feedback.textContent = `Incorrect. Your circuit diagram (${userExprText}) does not match the target diagram (${drawCircuitState.targetExpression}).`;
		feedback.className = 'feedback incorrect';
	}
	feedback.style.display = 'block';
}

function parseExpression(expression) {
	const parts = expression.split('=');
	if (parts.length !== 2) return { output: 'Q', inputs: ['A', 'B'] };

	const outputVar = parts[0].trim();
	const rightSide = parts[1].trim();
	const tokens = rightSide.split(/[^A-Z0-9_]/).filter(Boolean);
	const booleanOperators = new Set(['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR']);
	const variables = tokens.filter(token => !booleanOperators.has(token));
	const uniqueVariables = [...new Set(variables)].sort();

	return { output: outputVar, inputs: uniqueVariables };
}

function getMousePos(evt) {
	// Reference state object
	const rect = drawCircuitState.canvas.getBoundingClientRect();
	return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

function getClickedGate(pos) {
	// Reference state object
	for (let i = drawCircuitState.gates.length - 1; i >= 0; i--) {
		const gate = drawCircuitState.gates[i];
		if (pos.x > gate.x && pos.x < gate.x + gate.width && pos.y > gate.y && pos.y < gate.y + gate.height) {
			return gate;
		}
	}
	return null;
}

function getClickedNode(pos) {
	const allNodes = [];
	// Reference state object
	drawCircuitState.gates.forEach(g => allNodes.push(...g.inputNodes, g.outputNode));
	drawCircuitState.inputs.forEach(i => allNodes.push(i.outputNode));
	allNodes.push(drawCircuitState.output.inputNode);

	for (const node of allNodes) {
		const dist = Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2);
		if (dist < 6) return node;
	}
	return null;
}

function getNearbyNode(pos) {
	const snapDistance = 20;
	const allNodes = [];
	// Reference state object
	drawCircuitState.gates.forEach(g => allNodes.push(...g.inputNodes, g.outputNode));
	drawCircuitState.inputs.forEach(i => allNodes.push(i.outputNode));
	allNodes.push(drawCircuitState.output.inputNode);

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
	const { gateId, nodeIndex, nodeType } = connection;
	if (String(gateId).startsWith('input-')) {
		// Reference state object
		const input = drawCircuitState.inputs.find(i => i.id === gateId);
		return input ? input.outputNode : null;
	}
	if (String(gateId).startsWith('output-')) {
		// Reference state object
		return drawCircuitState.output.inputNode;
	}
	// Reference state object
	const gate = drawCircuitState.gates.find(g => g.id === gateId);
	if (!gate) return null;
	return nodeType === 'input' ? gate.inputNodes[nodeIndex] : gate.outputNode;
}

function updateInterpretedExpression() {
	const expressionElement = document.getElementById('interpretedExpression');
	
	// Reference state object
	if (drawCircuitState.output?.inputNode?.connectedTo) {
		const expression = buildExpression(drawCircuitState.output.inputNode);
		const outputName = drawCircuitState.output.name || '?';
		expressionElement.textContent = `${outputName} = ${expression}`;
		return;
	}

	// Reference state object
	const gate = drawCircuitState.gates.find(gate =>
		gate.outputNode &&
		gate.outputNode.connectedTo == null &&
		gate.inputNodes.length > 0 &&
		gate.inputNodes.every(node => node.connectedTo)
	);

	if (gate) {
		const expression = buildExpressionFromGate(gate);
		expressionElement.textContent = expression;
	} else {
		expressionElement.textContent = '';
	}
}

function buildExpression(node) {
	if (!node) return '?';

	if (node.type === 'output') {
		// Reference state object
		const gate = drawCircuitState.gates.find(g => g.id === node.gateId);
		if (!gate) return '?';
		return buildExpressionFromGate(gate);
	}

	if (!node.connectedTo) return '?';

	const sourceGateId = node.connectedTo.gateId;
	if (String(sourceGateId).startsWith('input-')) {
		// Reference state object
		const input = drawCircuitState.inputs.find(i => i.id === sourceGateId);
		return input ? input.name : '?';
	}

	// Reference state object
	const sourceGate = drawCircuitState.gates.find(g => g.id === sourceGateId);
	if (!sourceGate) return '?';
	return buildExpressionFromGate(sourceGate);
}

function buildExpressionFromGate(gate) {
	const inputsExpr = gate.inputNodes.map(inputNode => {
		let expr = buildExpression(inputNode);
		if (expr.includes(' AND ') || expr.includes(' OR ') || expr.includes(' XOR ')) {
			expr = `(${expr})`;
		}
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
	const levelKey = `level${modeSettings.drawCircuit.currentDifficulty}`;
	const expressions = expressionDatabase[levelKey];
	
	// Reference state object
	drawCircuitState.targetExpression = expressions[Math.floor(Math.random() * expressions.length)];
	document.getElementById('circuitTargetExpression').innerHTML = `<div class="expression-text">${drawCircuitState.targetExpression}</div>`;
	drawCircuitState.parsedTargetExpression = parseExpression(drawCircuitState.targetExpression);

	setupCanvas();
	draw();
}
// End of Draw Circuit functions

// Functions exposed to global scope for HTML onclick handlers. Temporary fix before refactoring to use event listeners?
window.nextQuestion = nextQuestion;
window.submitAnswer = submitAnswer;
window.toggleHelpMode = toggleHelpMode;
window.setGameMode = setGameMode;
window.setDifficultyLevel = setDifficultyLevel;