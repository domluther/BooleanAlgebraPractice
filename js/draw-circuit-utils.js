// js/draw-circuit-utils.js

/**
 * Manages an interactive circuit drawing canvas.
 * This utility can be attached to any canvas element to provide circuit drawing functionality.
 */
export class CircuitDrawer {
    constructor(canvasId, ui, state, mode) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with ID '${canvasId}' not found!`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.ui = ui; // For showing feedback
        this.state = state; // For recording results

        // State properties
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
        this.gateImages = {};
        this.mode = mode
        
        // Touch-friendly gate placement state
        this.selectedGateType = null; // Type of gate selected from toolbox
        this.placementMode = false; // Whether we're in gate placement mode

        // Abort controller for cleaning up event listeners
        this.abortController = new AbortController();

        this._preloadGateImages();
    }

    /**
     * Initializes the drawer for a specific expression.
     * @param {string} expression - The target Boolean expression (e.g., "Q = A AND B").
     * @param {HTMLElement} interpretedExprElement - The HTML element to display the current circuit's expression.
     */
    start(expression, interpretedExprElement) {
        this.targetExpression = expression;
        this.parsedTargetExpression = this._parseExpression(this.targetExpression);
        this.interpretedExprElement = interpretedExprElement;
        this.interpretedExpression = '';

        this._setupCanvas();
        this._addCircuitModeEventListeners();
        this._draw();
        this._updateInterpretedExpression();
    }
    
    /**
     * Resets the canvas for the current expression.
     */
    reset() {
        this._setupCanvas();
        this._draw();
        this._updateInterpretedExpression();
    }

    /**
     * Cleans up all event listeners associated with this instance.
     */
    destroy() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Returns the Boolean expression represented by the user's current drawing.
     */
    getCurrentExpression() {
        return this.interpretedExpression;
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

        // Clear gate selection state for touch devices
        this._clearGateSelection();

        // Hide feedback from previous question
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';

        this._addTerminals();
        this._updateInterpretedExpression();
        this._disableRemoveSelectedButton();
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

        // Toolbox gate click listeners (touch-friendly replacement for drag-and-drop)
        document.querySelectorAll('.gate[data-gate-type]').forEach(gate => {
            gate.addEventListener('click', (e) => {
                e.preventDefault();
                this._selectGateType(gate.dataset.gateType || gate.id.replace('drag-', ''));
            }, { signal });
            
            // Also support touch events for gates
            gate.addEventListener('touchend', (e) => {
                e.preventDefault();
                this._selectGateType(gate.dataset.gateType || gate.id.replace('drag-', ''));
            }, { signal });
        });

        // Keep original drag-and-drop for desktop compatibility
        document.querySelectorAll('.gate[draggable="true"]').forEach(gate => {
            gate.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.currentTarget.id);
                const svg = e.currentTarget.querySelector('img');
                if (svg) e.dataTransfer.setDragImage(svg, svg.width / 2, svg.height / 2);
            }, { signal });
        });

        // Canvas drop listener (for desktop drag-and-drop)
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            if (!id) return;
            const type = id.replace('drag-', '');
            const rect = this.canvas.getBoundingClientRect();
            this._addGate(type, e.clientX - rect.left, e.clientY - rect.top);
            this._clearGateSelection();
        }, { signal });
        
        // Canvas mouse listeners for interaction (wiring, moving, selecting)
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state.getAnswered()) return;

            const pos = this._getMousePos(e);
            
            // If we're in gate placement mode, place the selected gate
            if (this.placementMode && this.selectedGateType) {
                this._addGate(this.selectedGateType, pos.x, pos.y);
                this._clearGateSelection();
                this._draw();
                return;
            }
            
            const snappedNode = this._getClickedNode(pos) || this._getNearbyNode(pos);

            if (snappedNode) {
                // Starting a wire connection
                this.wireStartNode = snappedNode;
                this._clearSelections();
            } else {
                const clickedWire = this._getClickedWire(pos);
                if (clickedWire) {
                    // Clicked on a wire - toggle selection
                    if (this.selectedWire === clickedWire) {
                        // Already selected - deselect it
                        this._clearSelections();
                    } else {
                        // Not selected - select it
                        this._clearSelections();
                        this.selectedWire = clickedWire;
                        this._enableRemoveSelectedButton();
                    }
                } else {
                    const clickedGate = this._getClickedGate(pos);
                    // Clicked on a gate - prepare for dragging
                if (clickedGate) {
                    // Clicked on a gate
                    if (this.selectedGate === clickedGate) {
                        // Already selected - deselect it
                        this._clearSelections();
                    } else {
                        // Not selected - select it and prepare for dragging
                        this.draggingGate = clickedGate;
                        this.draggingOffset = { x: pos.x - clickedGate.x, y: pos.y - clickedGate.y };
                        this.dragStartPosition = { x: pos.x, y: pos.y };
                        this._clearSelections();
                        this.selectedGate = clickedGate;
                        this._enableRemoveSelectedButton();
                    }
                } else {
                    // Clicked on empty space - clear selections
                    this._clearSelections();
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
            if (this.draggingGate && this.dragStartPosition) {
                const currentPos = this._getMousePos(e);
                const dragDistance = Math.sqrt(
                    (currentPos.x - this.dragStartPosition.x) ** 2 + 
                    (currentPos.y - this.dragStartPosition.y) ** 2
                );
        
                // If we dragged more than a few pixels, deselect
                if (dragDistance > 5) {
                    this._clearSelections();
                }
                
                this.dragStartPosition = null;
            }
            this.draggingGate = null;
            this._draw();
            this._updateInterpretedExpression();
        }, { signal });

        // Touch event handlers (for tablet/mobile compatibility)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behaviors
            if (this.state.getAnswered()) return;
            
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { signal, passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            if (e.touches.length === 1) { // Only handle single touch
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            }
        }, { signal, passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {
                clientX: e.changedTouches[0].clientX,
                clientY: e.changedTouches[0].clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { signal, passive: false });

        // Button listeners
        document.getElementById(`${this.mode}ResetCircuitBtn`).addEventListener('click', () => {
            if (this.state.getAnswered()) return;
            this.ui.resetUIState('drawCircuit');
            this._disableRemoveSelectedButton();
            this._setupCanvas();
            this._draw();
        }, {signal});

        document.getElementById(`${this.mode}RemoveSelectedBtn`).addEventListener('click', () => {
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

    _preloadGateImages() {
        ['AND', 'OR', 'NOT'].forEach(type => {
            const img = new Image();
            img.src = `/img/png/${type.toLowerCase()}.png`;
            this.gateImages[type] = img;
        });
    }

    _addGate(type, x, y) {
        const cleanType = type.replace(/-.*$/, '');
    
        const gateWidth = 120, gateHeight = 54;
        const newGate = {
            id: this.nextId++, 
            type: cleanType, // Use cleaned type
            x: x - gateWidth / 2, 
            y: y - gateHeight / 2,
            width: gateWidth, 
            height: gateHeight, 
            image: this.gateImages[cleanType], // Use cleaned type for image lookup
            inputNodes: [],
            outputNode: { x: x + gateWidth / 2, y: y, gateId: this.nextId - 1, type: 'output', connectedTo: null }
        };

        if (cleanType === 'NOT') {
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
        if (!this.interpretedExprElement) return;

        let expression = '?';
        if (this.output?.inputNode?.connectedTo) {
            expression = this._buildExpression(this.output.inputNode);
        }
        
        const outputName = this.output?.name || '?';
        this.interpretedExpression = `${outputName} = ${expression}`;
        this.interpretedExprElement.textContent = this.interpretedExpression;
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

    _enableResetButton() { this._enableButton(`${this.mode}ResetCircuitBtn`); }
    _disableResetButton() { this._disableButton(`${this.mode}ResetCircuitBtn`); }
    _enableRemoveSelectedButton() { this._enableButton(`${this.mode}RemoveSelectedBtn`); }
    _disableRemoveSelectedButton() { this._disableButton(`${this.mode}RemoveSelectedBtn`); }

    /**
     * Select a gate type for placement (touch-friendly gate selection)
     */
    _selectGateType(gateType) {
        // Clear any existing gate selection visual state
        document.querySelectorAll('.gate').forEach(gate => {
            gate.classList.remove('selected');
        });
        
        if (this.selectedGateType === gateType) {
            // If same gate type is selected, deselect it
            this._clearGateSelection();
        } else {
            // Select new gate type
            this.selectedGateType = gateType;
            this.placementMode = true;
            
            // Add visual feedback to selected gate
            const gateElement = document.getElementById(`drag-${gateType}`) || 
                                document.getElementById(`drag-${gateType}-scenario`);
            if (gateElement) {
                gateElement.classList.add('selected');
            }
            
            // Update canvas cursor and visual state to indicate placement mode
            this.canvas.style.cursor = 'copy';
            this.canvas.classList.add('placement-mode');
            
            // Show feedback to user
            if (this.ui && this.ui.showFeedback) {
                this.ui.showFeedback(`${gateType.toUpperCase()} gate selected. Tap on the canvas to place it.`, 'info');
            }
        }
    }

    /**
     * Clear gate selection and exit placement mode
     */
    _clearGateSelection() {
        const wasInPlacementMode = this.placementMode;
        
        this.selectedGateType = null;
        this.placementMode = false;
        this.canvas.style.cursor = 'crosshair';
        this.canvas.classList.remove('placement-mode');
        
        // Remove visual feedback from all gates
        document.querySelectorAll('.gate').forEach(gate => {
            gate.classList.remove('selected');
        });
        
        // Hide feedback only if we were in placement mode
        // Don't hide other important feedback messages
        if (wasInPlacementMode && this.ui && this.ui.hideFeedback) {
            this.ui.hideFeedback();
        }
    }
}