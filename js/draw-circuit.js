// js/draw-circuit.js

import { expressionDatabase } from './data.js';
import { generateAllAcceptedAnswers } from './expression-utils.js';

export class DrawCircuit {
    constructor(dependencies) {
        this.ui = dependencies.ui;
        this.state = dependencies.state;
        // State properties formerly in the global 'drawCircuitState' object
        this.canvas = null;
        this.ctx = null;
        this.gates = [];
        this.wires = [];
        this.inputs = [];
        this.output = null;
        this.selectedGate = null;
        this.selectedWire = null;
        this.nextId = 0;
        this.draggingGate = null;
        this.draggingOffset = { x: 0, y: 0 };
        this.wireStartNode = null;
        this.targetExpression = "";
        this.parsedTargetExpression = {};
        this.gateImages = {};
        this.currentDifficulty = 1;

        // Used instead of cloning canvas to clear event listeners
        this.abortController = null;

        // Help mode state
        this.help = { enabled: false };
        
        // Preload images once on instantiation
        this._preloadGateImages();
    }

    /**
     * Initializes the mode, sets up the canvas, and generates the first question.
     * This method is called when the user switches to "Draw Circuit" mode.
     */
    initialize() {
        this.canvas = document.getElementById('circuitCanvas');
        if (!this.canvas) {
            console.error("Canvas not found!");
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        this.generateQuestion();
        this._enableResetButton();
        this._disableRemoveSelectedButton();

        // Add event listeners specific to this mode
        this._addCircuitModeEventListeners();
        this._draw();
    }
    
    /**
     * Sets the difficulty level and generates a new question.
     * @param {number} level - The new difficulty level (1-4).
     */
    setDifficulty(level) {
        this.currentDifficulty = level;
        this.generateQuestion();
    }

    /**
     * Generates a new circuit drawing question based on the current difficulty.
     */
    generateQuestion() {
        const levelKey = `level${this.currentDifficulty}`;
        const expressions = expressionDatabase[levelKey];
        
        this.targetExpression = expressions[Math.floor(Math.random() * expressions.length)];
        document.getElementById('circuitTargetExpression').innerHTML = `<div class="expression-text">${this.targetExpression}</div>`;
        this.parsedTargetExpression = this._parseExpression(this.targetExpression);

        this._setupCanvas();
        this._addCircuitModeEventListeners();
        this._draw();
        this.updateHelpDisplay(); // Ensure help is updated for new question
    }
    
    /**
     * Checks if the user's drawn circuit correctly represents the target expression.
     */
    checkAnswer() {
        const userExprText = document.getElementById('interpretedExpression').textContent;

        if (userExprText.includes('?')) {
            this.ui.showFeedback('Your circuit is not complete yet.', 'incorrect');
            return;
        }

        // EFFICIENCY: (Phase 3) Does this ever get triggered? Can it be removed?
        // const userExprParts = userExprText.split('=');
        // if (userExprParts.length < 2 || userExprParts[0].trim() !== this.parsedTargetExpression.output) {
        //     this.ui.showFeedback(`Incorrect. Your circuit outputs to ${userExprParts[0].trim()} but it should output to ${this.parsedTargetExpression.output}.`, 'incorrect');
        //     return;
        // }

        const possibleAnswers = generateAllAcceptedAnswers(this.targetExpression);
        const isCorrect = possibleAnswers.some(acceptedAnswer => userExprText === acceptedAnswer);
        
        this.state.recordResult(isCorrect)
        if (isCorrect) {
            this.ui.showFeedback('Correct! The circuit matches the expression.', 'correct');
            this.ui.showNextButton();
            this.ui.hideSubmitButton();
            this.state.setAnswered(true);
            this._disableResetButton();
        } else {
            this.ui.showFeedback(`Incorrect. Your circuit diagram (${userExprText}) does not match the target diagram (${this.targetExpression}).`, 'incorrect');
        }
    }
    
    /**
     * Toggles the visibility of the help information panel.
     */
    updateHelpDisplay() {
        const helpCheckbox = document.getElementById('drawCircuitDebugMode');
        this.help.enabled = helpCheckbox ? helpCheckbox.checked : false;
        
        const helpInfoDiv = document.getElementById('drawCircuitHelpInfo');
        if (helpInfoDiv) {
            helpInfoDiv.style.display = this.help.enabled ? 'block' : 'none';
        }
        
        // Update the content of the help display if it's enabled
        if (this.help.enabled) {
            this._updateInterpretedExpression();
        }
    }

    /**
     * Resets the canvas to its initial state for the current question.
     */
    _setupCanvas() {
        this.gates = [];
        this.wires = [];
        this.nextId = 0;
        this.wireStartNode = null;
        this.selectedGate = null;
        this.selectedWire = null;

        // Hide feedback from previous question
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';

        this._addTerminals();
        this._updateInterpretedExpression();
    }

    /**
     * Adds the input and output terminals (A, B, Q, etc.) to the canvas.
     */
    _addTerminals() {
        const canvasHeight = this.canvas.height;
        const canvasWidth = this.canvas.width;
        const terminalWidth = 60;
        const terminalHeight = 40;
        const inputCount = this.parsedTargetExpression.inputs.length;

        // Adjust vertical spacing of inputs based on how many there are
        const minMarginRatio = 0.10;
        const maxMarginRatio = 0.25;
        const clampedInputCount = Math.min(Math.max(inputCount, 1), 7);
        const t = (clampedInputCount - 1) / 6;
        const marginRatio = maxMarginRatio - (maxMarginRatio - minMarginRatio) * t;

        const startY = canvasHeight * marginRatio;
        const endY = canvasHeight * (1 - marginRatio);
        const availableHeight = endY - startY;
        const spaceBetween = inputCount > 1 ? availableHeight / (inputCount - 1) : 0;

        this.inputs = [];
        for (let i = 0; i < inputCount; i++) {
            const inputName = this.parsedTargetExpression.inputs[i];
            const centerY = inputCount > 1 ? startY + i * spaceBetween : (startY + endY) / 2;

            this.inputs.push({
                id: `input-${inputName}`, name: inputName, x: 30, y: centerY - terminalHeight / 2,
                width: terminalWidth, height: terminalHeight,
                outputNode: { x: 30 + terminalWidth, y: centerY, gateId: `input-${inputName}`, type: 'output', connectedTo: null }
            });
        }
        
        const outputName = this.parsedTargetExpression.output;
        const outputCenterY = canvasHeight / 2;

        this.output = {
            id: `output-${outputName}`, name: outputName, x: canvasWidth - 100, y: outputCenterY - terminalHeight / 2,
            width: terminalWidth, height: terminalHeight,
            inputNode: { x: canvasWidth - 100, y: outputCenterY, gateId: `output-${outputName}`, type: 'input', connectedTo: null }
        };
    }
    
    /**
     * Sets up all the event listeners for the canvas (drag/drop, mouse events).
     */
    _addCircuitModeEventListeners() {
        // Clean up any existing listeners
        if (this.abortController) {
            this.abortController.abort();
        }
        
        // Create new AbortController
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        // Toolbox gate drag listeners
        document.querySelectorAll('.gate[draggable="true"]').forEach(gate => {
            gate.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.currentTarget.id);
                const svg = e.currentTarget.querySelector('img');
                if (svg) e.dataTransfer.setDragImage(svg, svg.width / 2, svg.height / 2);
            }, { signal });
        });

        // Canvas drop listener
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            if (!id) return;
            const type = id.replace('drag-', '');
            const rect = this.canvas.getBoundingClientRect();
            this._addGate(type, e.clientX - rect.left, e.clientY - rect.top);
        }, { signal });
        
        // Canvas mouse listeners for interaction (wiring, moving, selecting)
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.draggingGate || this.state.getAnswered()) return;

            const pos = this._getMousePos(e);
            const snappedNode = this._getClickedNode(pos) || this._getNearbyNode(pos);

            if (snappedNode) {
                this.wireStartNode = snappedNode;
                this._clearSelections();
            } else {
                const clickedWire = this._getClickedWire(pos);
                if (clickedWire) {
                    this._clearSelections();
                    this.selectedWire = clickedWire;
                    this._enableRemoveSelectedButton();
                } else {
                    const clickedGate = this._getClickedGate(pos);
                    if (clickedGate) {
                        if (e.shiftKey) { // Dragging gate
                            this.draggingGate = clickedGate;
                            this.draggingOffset = { x: pos.x - clickedGate.x, y: pos.y - clickedGate.y };
                        } else { // Selecting gate
                            this._clearSelections();
                            this.selectedGate = clickedGate;
                            this._enableRemoveSelectedButton();
                        }
                    } else {
                        this._clearSelections(); // Clicked on empty space
                    }
                }
            }
            this._draw();
        }, { signal });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.draggingGate) {
                const pos = this._getMousePos(e);
                this.draggingGate.x = pos.x - this.draggingOffset.x;
                this.draggingGate.y = pos.y - this.draggingOffset.y;
                this._updateGateNodes(this.draggingGate);
                this._draw();
            } else if (this.wireStartNode) {
                const pos = this._getMousePos(e);
                const nearbyNode = this._getNearbyNode(pos);
                this._draw(); // Redraw canvas first
                
                // Then draw the "live" wire on top
                this.ctx.beginPath();
                this.ctx.moveTo(this.wireStartNode.x, this.wireStartNode.y);
                if (nearbyNode && nearbyNode !== this.wireStartNode && nearbyNode.type !== this.wireStartNode.type) {
                    this.ctx.lineTo(nearbyNode.x, nearbyNode.y);
                    this.ctx.strokeStyle = '#27ae60'; // Green for valid connection
                    this.ctx.lineWidth = 3;
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.arc(nearbyNode.x, nearbyNode.y, 10, 0, 2 * Math.PI);
                    this.ctx.stroke();
                } else {
                    this.ctx.lineTo(pos.x, pos.y);
                    this.ctx.strokeStyle = '#3498db'; // Blue for dragging
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
            }
        }, { signal });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.wireStartNode) {
                const endNode = this._getClickedNode(this._getMousePos(e)) || this._getNearbyNode(this._getMousePos(e));
                if (endNode && endNode !== this.wireStartNode && endNode.type !== this.wireStartNode.type) {
                    this._addWire(this.wireStartNode, endNode);
                }
                this.wireStartNode = null;
            }
            this.draggingGate = null;
            this._draw();
            this._updateInterpretedExpression();
        }, { signal });

        // Button listeners
        document.getElementById('resetCircuitBtn').addEventListener('click', () => {
            if (this.state.getAnswered()) return;
            this.ui.resetUIState();
            this._disableRemoveSelectedButton();
            this._setupCanvas();
            this._draw();
        }, {signal});

        document.getElementById('removeSelectedBtn').addEventListener('click', () => {
            this._removeSelected();
        }, { signal });
    }
    
    /**
     * Main drawing function. Clears and redraws the entire canvas based on the current state.
     */
    _draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw wires
        this.wires.forEach(wire => {
            this.ctx.beginPath();
            this.ctx.moveTo(wire.from.x, wire.from.y);
            this.ctx.lineTo(wire.to.x, wire.to.y);
            this.ctx.strokeStyle = (this.selectedWire === wire) ? '#e74c3c' : '#333';
            this.ctx.lineWidth = (this.selectedWire === wire) ? 4 : 2;
            this.ctx.stroke();
        });

        // Draw gates
        this.gates.forEach(gate => {
            if (gate.image && gate.image.complete) {
                this.ctx.drawImage(gate.image, gate.x, gate.y, gate.width, gate.height);
                if (this.selectedGate === gate) {
                    this.ctx.strokeStyle = '#3498db';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);
                }
            }
            this._drawNodesForGate(gate);
        });

        // Draw terminals
        [...this.inputs, this.output].forEach(io => {
            this.ctx.fillStyle = '#d1e7dd';
            this.ctx.strokeStyle = '#0f5132';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(io.x, io.y, io.width, io.height);
            this.ctx.strokeRect(io.x, io.y, io.width, io.height);
            this.ctx.fillStyle = '#000';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(io.name, io.x + io.width / 2, io.y + io.height / 2);
            if (io.outputNode) this._drawNode(io.outputNode);
            if (io.inputNode) this._drawNode(io.inputNode);
        });
    }

    // HELPER METHODS (Internal logic for the class)

    _preloadGateImages() {
        ['AND', 'OR', 'NOT'].forEach(type => {
            const img = new Image();
            img.src = `/img/png/${type.toLowerCase()}.png`;
            this.gateImages[type] = img;
        });
    }

    _addGate(type, x, y) {
        const gateWidth = 120, gateHeight = 54;
        const newGate = {
            id: this.nextId++, type: type, x: x - gateWidth / 2, y: y - gateHeight / 2,
            width: gateWidth, height: gateHeight, image: this.gateImages[type],
            inputNodes: [],
            outputNode: { x: x + gateWidth / 2, y: y, gateId: this.nextId - 1, type: 'output', connectedTo: null }
        };

        if (type === 'NOT') {
            newGate.inputNodes.push({ x: x - gateWidth / 2, y: y, gateId: newGate.id, type: 'input', index: 0, connectedTo: null });
        } else {
            newGate.inputNodes.push({ x: x - gateWidth / 2, y: y - 10, gateId: newGate.id, type: 'input', index: 0, connectedTo: null });
            newGate.inputNodes.push({ x: x - gateWidth / 2, y: y + 10, gateId: newGate.id, type: 'input', index: 1, connectedTo: null });
        }
        this.gates.push(newGate);
        this._clearSelections();
        this._draw();
    }

    _addWire(startNode, endNode) {
        let fromNode = startNode.type === 'output' ? startNode : endNode;
        let toNode = startNode.type === 'input' ? startNode : endNode;
        
        // Remove any existing wire connected to the destination input node
        this.wires = this.wires.filter(w => w.to !== toNode);
        if (toNode.connectedTo) {
            const prevFromNode = this._findNodeByConnectionInfo(toNode.connectedTo);
            if (prevFromNode) prevFromNode.connectedTo = null;
        }
        
        this.wires.push({ from: fromNode, to: toNode });
        fromNode.connectedTo = { gateId: toNode.gateId, nodeIndex: toNode.index, nodeType: 'input' };
        toNode.connectedTo = { gateId: fromNode.gateId, nodeIndex: fromNode.index, nodeType: 'output' };
    }

    _removeSelected() {
        if (this.selectedGate) {
            this._removeGate(this.selectedGate);
            this.selectedGate = null;
        } else if (this.selectedWire) {
            this._removeWire(this.selectedWire);
            this.selectedWire = null;
        }
        this._disableRemoveSelectedButton();
        this._draw();
        this._updateInterpretedExpression();
    }
    
    _removeGate(gateToRemove) {
        this.wires = this.wires.filter(wire => {
            const isConnected = wire.from.gateId === gateToRemove.id || wire.to.gateId === gateToRemove.id;
            if (isConnected) { // Disconnect nodes on the other side of the wire
                if (wire.to.connectedTo) this._findNodeByConnectionInfo(wire.to.connectedTo).connectedTo = null;
                if (wire.from.connectedTo) this._findNodeByConnectionInfo(wire.from.connectedTo).connectedTo = null;
            }
            return !isConnected;
        });
        this.gates = this.gates.filter(gate => gate.id !== gateToRemove.id);
    }
    
    _removeWire(wireToRemove) {
        if (wireToRemove.from.connectedTo) wireToRemove.from.connectedTo = null;
        if (wireToRemove.to.connectedTo) wireToRemove.to.connectedTo = null;
        this.wires = this.wires.filter(wire => wire !== wireToRemove);
    }

    _updateInterpretedExpression() {
        const expressionElement = document.getElementById('interpretedExpression');
        if (!expressionElement) return;

        let expression = '?';
        if (this.output?.inputNode?.connectedTo) {
            expression = this._buildExpression(this.output.inputNode);
        }
        const outputName = this.output?.name || '?';
        expressionElement.textContent = `${outputName} = ${expression}`;
    }

    _buildExpression(node) {
        if (!node || !node.connectedTo) return '?';

        const sourceGateId = node.connectedTo.gateId;
        if (String(sourceGateId).startsWith('input-')) {
            const input = this.inputs.find(i => i.id === sourceGateId);
            return input ? input.name : '?';
        }

        const sourceGate = this.gates.find(g => g.id === sourceGateId);
        if (!sourceGate) return '?';

        // Recurse from the gate's output node
        return this._buildExpressionFromGate(sourceGate);
    }

    _buildExpressionFromGate(gate) {
        const inputsExpr = gate.inputNodes.map(inputNode => {
            let expr = this._buildExpression(inputNode);
            // Add parentheses for correct order of operations
            if (expr.includes(' AND ') || expr.includes(' OR ') || expr.includes(' XOR ') || expr.startsWith('NOT ')) {
                expr = `(${expr})`;
            }
            return expr;
        });
        return (gate.type === 'NOT') ? `NOT ${inputsExpr[0]}` : `${inputsExpr[0]} ${gate.type} ${inputsExpr[1]}`;
    }

    _parseExpression(expression) {
        const parts = expression.split('=');
        if (parts.length !== 2) return { output: 'Q', inputs: ['A', 'B'] }; // Default fallback
        const outputVar = parts[0].trim();
        const rightSide = parts[1].trim();
        const tokens = rightSide.split(/[^A-Z0-9_]/).filter(Boolean);
        const operators = new Set(['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR']);
        const variables = tokens.filter(token => !operators.has(token));
        return { output: outputVar, inputs: [...new Set(variables)].sort() };
    }

    _getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
    
    _getClickedGate(pos) {
        // Iterate backwards to select the top-most gate
        return this.gates.slice().reverse().find(gate => 
            pos.x > gate.x && pos.x < gate.x + gate.width && pos.y > gate.y && pos.y < gate.y + gate.height
        );
    }

    _getAllNodes() {
        const allNodes = [];
        this.gates.forEach(g => allNodes.push(...g.inputNodes, g.outputNode));
        this.inputs.forEach(i => allNodes.push(i.outputNode));
        if (this.output) allNodes.push(this.output.inputNode);
        return allNodes;
    }

    _getClickedNode(pos) {
        return this._getAllNodes().find(node => Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2) < 6);
    }

    _getNearbyNode(pos) {
        let closestNode = null;
        let closestDistance = 20; // Snap distance

        for (const node of this._getAllNodes()) {
            const dist = Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2);
            if (dist < closestDistance) {
                closestNode = node;
                closestDistance = dist;
            }
        }
        return closestNode;
    }
    
    _getClickedWire(pos) {
        const tolerance = 5;
        return this.wires.find(wire => this._distanceToLine(pos, wire.from, wire.to) <= tolerance);
    }
    
    _distanceToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        let param = Math.max(0, Math.min(1, dot / lenSq));
        const xx = lineStart.x + param * C;
        const yy = lineStart.y + param * D;
        return Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2);
    }
    
    _updateGateNodes(gate) {
        const centerX = gate.x + gate.width / 2;
        const centerY = gate.y + gate.height / 2;
        gate.outputNode.x = gate.x + gate.width;
        gate.outputNode.y = centerY;

        if (gate.type === 'NOT') {
            gate.inputNodes[0].x = gate.x;
            gate.inputNodes[0].y = centerY;
        } else {
            gate.inputNodes[0].x = gate.x;
            gate.inputNodes[0].y = centerY - 10;
            gate.inputNodes[1].x = gate.x;
            gate.inputNodes[1].y = centerY + 10;
        }
    }
    
    _findNodeByConnectionInfo(connection) {
        const { gateId, nodeIndex, nodeType } = connection;
        if (String(gateId).startsWith('input-')) {
            const input = this.inputs.find(i => i.id === gateId);
            return input ? input.outputNode : null;
        }
        if (String(gateId).startsWith('output-')) {
            return this.output.inputNode;
        }
        const gate = this.gates.find(g => g.id === gateId);
        if (!gate) return null;
        return nodeType === 'input' ? gate.inputNodes[nodeIndex] : gate.outputNode;
    }

    _drawNode(node) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = node.connectedTo ? '#3498db' : '#fff';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    _drawNodesForGate(gate) {
        gate.inputNodes.forEach(node => this._drawNode(node));
        this._drawNode(gate.outputNode);
    }
    
    _clearSelections() {
        this.selectedGate = null;
        this.selectedWire = null;
        this._disableRemoveSelectedButton();
    }

    _enableButton(buttonId) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('disabled');
        }
    }
    
    _disableButton(buttonId) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
    }
    
    _enableResetButton() { this._enableButton('resetCircuitBtn'); }
    _disableResetButton() { this._disableButton('resetCircuitBtn'); }
    _enableRemoveSelectedButton() { this._enableButton('removeSelectedBtn'); }
    _disableRemoveSelectedButton() { this._disableButton('removeSelectedBtn'); }
}