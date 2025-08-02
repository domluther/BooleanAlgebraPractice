/**
 * draw-circuit-utils.js
 * * Contains reusable functions for creating, drawing, and interacting with
 * a logic circuit diagram on an HTML canvas. These functions are designed
 * to be mode-agnostic and operate on a provided state `context` object.
 */

/**
 * Preloads the images for the logic gates.
 * @returns {object} An object mapping gate types ('AND', 'OR', 'NOT') to their Image objects.
 */
export function preloadGateImages() {
    const gateImages = {};
    ['AND', 'OR', 'NOT'].forEach(type => {
        const img = new Image();
        img.src = `/img/png/${type.toLowerCase()}.png`;
        gateImages[type] = img;
    });
    return gateImages;
}

/**
 * Resets the canvas to its initial state for a new question.
 * @param {object} context - The state object for the drawing instance.
 */
export function setupCanvas(context) {
    context.gates = [];
    context.wires = [];
    context.nextId = 0;
    context.wireStartNode = null;
    context.selectedGate = null;
    context.selectedWire = null;

    addTerminals(context);
    updateInterpretedExpression(context);
    draw(context);
}

/**
 * Adds the input and output terminals to the canvas based on the target expression.
 * @param {object} context - The state object for the drawing instance.
 */
export function addTerminals(context) {
    const { canvas, parsedTargetExpression } = context;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;
    const terminalWidth = 60;
    const terminalHeight = 40;
    const inputCount = parsedTargetExpression.inputs.length;

    // Adjust vertical spacing of inputs
    const minMarginRatio = 0.10;
    const maxMarginRatio = 0.25;
    const clampedInputCount = Math.min(Math.max(inputCount, 1), 7);
    const t = (clampedInputCount - 1) / 6;
    const marginRatio = maxMarginRatio - (maxMarginRatio - minMarginRatio) * t;

    const startY = canvasHeight * marginRatio;
    const endY = canvasHeight * (1 - marginRatio);
    const availableHeight = endY - startY;
    const spaceBetween = inputCount > 1 ? availableHeight / (inputCount - 1) : 0;

    context.inputs = [];
    for (let i = 0; i < inputCount; i++) {
        const inputName = parsedTargetExpression.inputs[i];
        const centerY = inputCount > 1 ? startY + i * spaceBetween : (startY + endY) / 2;

        context.inputs.push({
            id: `input-${inputName}`, name: inputName, x: 30, y: centerY - terminalHeight / 2,
            width: terminalWidth, height: terminalHeight,
            outputNode: { x: 30 + terminalWidth, y: centerY, gateId: `input-${inputName}`, type: 'output', connectedTo: null }
        });
    }
    
    const outputName = parsedTargetExpression.output;
    const outputCenterY = canvasHeight / 2;

    context.output = {
        id: `output-${outputName}`, name: outputName, x: canvasWidth - 100, y: outputCenterY - terminalHeight / 2,
        width: terminalWidth, height: terminalHeight,
        inputNode: { x: canvasWidth - 100, y: outputCenterY, gateId: `output-${outputName}`, type: 'input', connectedTo: null }
    };
}

/**
 * Sets up all event listeners for the canvas and associated UI elements.
 * @param {object} context - The state object for the drawing instance.
 */
export function addCircuitModeEventListeners(context) {
    if (context.abortController) {
        context.abortController.abort();
    }
    context.abortController = new AbortController();
    const { signal } = context.abortController;
    const { canvas, state, modePrefix } = context;

    const modeContainer = document.getElementById(`${modePrefix}Mode`);
    const toolbox = modeContainer.querySelector('.circuit-toolbox');

    // Toolbox gate drag listeners
    toolbox.querySelectorAll('.gate[draggable="true"]').forEach(gate => {
        gate.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.currentTarget.id);
            const img = e.currentTarget.querySelector('img');
            if (img) e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
        }, { signal });
    });

    // Canvas listeners
    canvas.addEventListener('dragover', (e) => e.preventDefault(), { signal });
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;
        const type = id.replace('drag-', '');
        const rect = canvas.getBoundingClientRect();
        addGate(context, type, e.clientX - rect.left, e.clientY - rect.top);
    }, { signal });

    canvas.addEventListener('mousedown', (e) => {
        if (state.getAnswered()) return;

        const pos = getMousePos(canvas, e);
        const snappedNode = getClickedNode(context, pos) || getNearbyNode(context, pos);

        if (snappedNode) {
            context.wireStartNode = snappedNode;
            clearSelections(context);
        } else {
            const clickedWire = getClickedWire(context, pos);
            if (clickedWire) {
                clearSelections(context);
                context.selectedWire = clickedWire;
            } else {
                const clickedGate = getClickedGate(context, pos);
                if (clickedGate) {
                    context.draggingGate = clickedGate;
                    context.draggingOffset = { x: pos.x - clickedGate.x, y: pos.y - clickedGate.y };
                    clearSelections(context);
                    context.selectedGate = clickedGate;
                } else {
                    clearSelections(context);
                }
            }
        }
        draw(context);
    }, { signal });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(canvas, e);
        if (context.draggingGate) {
            context.draggingGate.x = pos.x - context.draggingOffset.x;
            context.draggingGate.y = pos.y - context.draggingOffset.y;
            updateGateNodes(context.draggingGate);
            draw(context);
        } else if (context.wireStartNode) {
            const nearbyNode = getNearbyNode(context, pos);
            draw(context); // Redraw canvas first
            
            context.ctx.beginPath();
            context.ctx.moveTo(context.wireStartNode.x, context.wireStartNode.y);
            if (nearbyNode && nearbyNode !== context.wireStartNode && nearbyNode.type !== context.wireStartNode.type) {
                context.ctx.lineTo(nearbyNode.x, nearbyNode.y);
                context.ctx.strokeStyle = '#27ae60'; // Green
                context.ctx.lineWidth = 3;
                context.ctx.stroke();
            } else {
                context.ctx.lineTo(pos.x, pos.y);
                context.ctx.strokeStyle = '#3498db'; // Blue
                context.ctx.lineWidth = 2;
                context.ctx.stroke();
            }
        }
    }, { signal });

    canvas.addEventListener('mouseup', (e) => {
        if (context.wireStartNode) {
            const endNode = getClickedNode(context, getMousePos(canvas, e)) || getNearbyNode(context, getMousePos(canvas, e));
            if (endNode && endNode !== context.wireStartNode && endNode.type !== context.wireStartNode.type) {
                addWire(context, context.wireStartNode, endNode);
            }
            context.wireStartNode = null;
        }
        context.draggingGate = null;
        draw(context);
        updateInterpretedExpression(context);
    }, { signal });

    // Button Listeners
    const removeBtn = toolbox.querySelector('.btn-warning');
    if (removeBtn) removeBtn.addEventListener('click', () => removeSelected(context), { signal });
    
    const resetBtn = toolbox.querySelector('.btn-danger');
    if(resetBtn) resetBtn.addEventListener('click', () => {
        if(state.getAnswered()) return;
        setupCanvas(context);
    }, { signal });
}

/**
 * Main drawing function. Clears and redraws the entire canvas.
 * @param {object} context - The state object for the drawing instance.
 */
export function draw(context) {
    const { ctx, canvas, wires, gates, inputs, output, selectedWire, selectedGate } = context;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wires
    wires.forEach(wire => {
        ctx.beginPath();
        ctx.moveTo(wire.from.x, wire.from.y);
        ctx.lineTo(wire.to.x, wire.to.y);
        ctx.strokeStyle = (selectedWire === wire) ? '#e74c3c' : '#333';
        ctx.lineWidth = (selectedWire === wire) ? 4 : 2;
        ctx.stroke();
    });

    // Draw gates
    gates.forEach(gate => {
        if (gate.image && gate.image.complete) {
            ctx.drawImage(gate.image, gate.x, gate.y, gate.width, gate.height);
            if (selectedGate === gate) {
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 3;
                ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);
            }
        }
        drawNodesForGate(context, gate);
    });

    // Draw terminals
    [...inputs, output].forEach(io => {
        if(!io) return;
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
        if (io.outputNode) drawNode(context, io.outputNode);
        if (io.inputNode) drawNode(context, io.inputNode);
    });
}

/**
 * Adds a new gate to the canvas.
 * @param {object} context - The state object for the drawing instance.
 * @param {string} type - The type of gate to add ('AND', 'OR', 'NOT').
 * @param {number} x - The x-coordinate for the center of the new gate.
 * @param {number} y - The y-coordinate for the center of the new gate.
 */
export function addGate(context, type, x, y) {
    const gateWidth = 120, gateHeight = 54;
    const newGate = {
        id: context.nextId++, type: type, x: x - gateWidth / 2, y: y - gateHeight / 2,
        width: gateWidth, height: gateHeight, image: context.gateImages[type],
        inputNodes: [],
        outputNode: { x: x + gateWidth / 2, y: y, gateId: context.nextId - 1, type: 'output', connectedTo: null }
    };

    if (type === 'NOT') {
        newGate.inputNodes.push({ x: x - gateWidth / 2, y: y, gateId: newGate.id, type: 'input', index: 0, connectedTo: null });
    } else {
        newGate.inputNodes.push({ x: x - gateWidth / 2, y: y - 10, gateId: newGate.id, type: 'input', index: 0, connectedTo: null });
        newGate.inputNodes.push({ x: x - gateWidth / 2, y: y + 10, gateId: newGate.id, type: 'input', index: 1, connectedTo: null });
    }
    context.gates.push(newGate);
    clearSelections(context);
    draw(context);
}

/**
 * Adds a wire between two connection nodes.
 * @param {object} context - The state object for the drawing instance.
 * @param {object} startNode - The node where the wire starts.
 * @param {object} endNode - The node where the wire ends.
 */
export function addWire(context, startNode, endNode) {
    let fromNode = startNode.type === 'output' ? startNode : endNode;
    let toNode = startNode.type === 'input' ? startNode : endNode;
    
    // Remove existing wire to the input node
    context.wires = context.wires.filter(w => w.to !== toNode);
    if (toNode.connectedTo) {
        const prevFromNode = findNodeByConnectionInfo(context, toNode.connectedTo);
        if (prevFromNode) prevFromNode.connectedTo = null;
    }
    
    context.wires.push({ from: fromNode, to: toNode });
    fromNode.connectedTo = { gateId: toNode.gateId, nodeIndex: toNode.index, nodeType: 'input' };
    toNode.connectedTo = { gateId: fromNode.gateId, nodeIndex: fromNode.index, nodeType: 'output' };
}

/**
 * Removes the currently selected gate or wire from the canvas.
 * @param {object} context - The state object for the drawing instance.
 */
export function removeSelected(context) {
    if (context.selectedGate) {
        removeGate(context, context.selectedGate);
        context.selectedGate = null;
    } else if (context.selectedWire) {
        removeWire(context, context.selectedWire);
        context.selectedWire = null;
    }
    draw(context);
    updateInterpretedExpression(context);
}

/**
 * Removes a specific gate and any connected wires.
 * @param {object} context - The state object for the drawing instance.
 * @param {object} gateToRemove - The gate object to remove.
 */
export function removeGate(context, gateToRemove) {
    context.wires = context.wires.filter(wire => {
        const isConnected = wire.from.gateId === gateToRemove.id || wire.to.gateId === gateToRemove.id;
        if (isConnected) {
            if (wire.from.connectedTo) wire.from.connectedTo = null;
            if (wire.to.connectedTo) wire.to.connectedTo = null;
        }
        return !isConnected;
    });
    context.gates = context.gates.filter(gate => gate.id !== gateToRemove.id);
}

/**
 * Removes a specific wire.
 * @param {object} context - The state object for the drawing instance.
 * @param {object} wireToRemove - The wire object to remove.
 */
export function removeWire(context, wireToRemove) {
    if (wireToRemove.from.connectedTo) wireToRemove.from.connectedTo = null;
    if (wireToRemove.to.connectedTo) wireToRemove.to.connectedTo = null;
    context.wires = context.wires.filter(wire => wire !== wireToRemove);
}

/**
 * Analyzes the circuit and updates the displayed Boolean expression.
 * @param {object} context - The state object for the drawing instance.
 */
export function updateInterpretedExpression(context) {
    const { modePrefix, output } = context;
    const expressionElement = document.getElementById(modePrefix === 'drawCircuit' ? 'interpretedExpression' : `${modePrefix}InterpretedExpression`);
    if (!expressionElement) return;

    let expression = '?';
    if (output?.inputNode?.connectedTo) {
        expression = buildExpression(context, output.inputNode);
    }
    const outputName = output?.name || '?';
    expressionElement.textContent = `${outputName} = ${expression}`;
}

/**
 * Recursively builds an expression string starting from a given node.
 * @param {object} context - The state object for the drawing instance.
 * @param {object} node - The node to start building the expression from.
 * @returns {string} The resulting expression string.
 */
export function buildExpression(context, node) {
    if (!node || !node.connectedTo) return '?';

    const sourceGateId = node.connectedTo.gateId;
    if (String(sourceGateId).startsWith('input-')) {
        const input = context.inputs.find(i => i.id === sourceGateId);
        return input ? input.name : '?';
    }

    const sourceGate = context.gates.find(g => g.id === sourceGateId);
    if (!sourceGate) return '?';

    return buildExpressionFromGate(context, sourceGate);
}

/**
 * Builds an expression string for a specific gate by evaluating its inputs.
 * @param {object} context - The state object for the drawing instance.
 * @param {object} gate - The gate to build the expression for.
 * @returns {string} The expression string for the gate.
 */
export function buildExpressionFromGate(context, gate) {
    const inputsExpr = gate.inputNodes.map(inputNode => {
        let expr = buildExpression(context, inputNode);
        if (expr.includes(' AND ') || expr.includes(' OR ')) {
            expr = `(${expr})`;
        }
        return expr;
    });
    return (gate.type === 'NOT') ? `NOT ${inputsExpr[0]}` : `${inputsExpr[0]} ${gate.type} ${inputsExpr[1]}`;
}

/**
 * Parses an expression string to find the output and input variables.
 * @param {string} expression - The Boolean expression string.
 * @returns {object} An object with 'output' and 'inputs' properties.
 */
export function parseExpression(expression) {
    const parts = expression.split('=');
    if (parts.length !== 2) return { output: 'Q', inputs: ['A', 'B'] }; // Fallback
    const outputVar = parts[0].trim();
    const rightSide = parts[1].trim();
    const tokens = rightSide.split(/[^A-Z0-9_]/).filter(Boolean);
    const operators = new Set(['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR']);
    const variables = tokens.filter(token => !operators.has(token));
    return { output: outputVar, inputs: [...new Set(variables)].sort() };
}

// --- GEOMETRY & UTILITY HELPERS ---

export function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

export function getClickedGate(context, pos) {
    return context.gates.slice().reverse().find(gate => 
        pos.x > gate.x && pos.x < gate.x + gate.width && pos.y > gate.y && pos.y < gate.y + gate.height
    );
}

export function getAllNodes(context) {
    const allNodes = [];
    context.gates.forEach(g => allNodes.push(...g.inputNodes, g.outputNode));
    context.inputs.forEach(i => allNodes.push(i.outputNode));
    if (context.output) allNodes.push(context.output.inputNode);
    return allNodes;
}

export function getClickedNode(context, pos) {
    return getAllNodes(context).find(node => Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2) < 6);
}

export function getNearbyNode(context, pos) {
    return getAllNodes(context).find(node => Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2) < 20);
}

export function getClickedWire(context, pos) {
    const tolerance = 5;
    return context.wires.find(wire => distanceToLine(pos, wire.from, wire.to) <= tolerance);
}

export function distanceToLine(point, lineStart, lineEnd) {
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

export function updateGateNodes(gate) {
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

export function findNodeByConnectionInfo(context, connection) {
    const { gateId, nodeIndex, nodeType } = connection;
    if (String(gateId).startsWith('input-')) {
        const input = context.inputs.find(i => i.id === gateId);
        return input ? input.outputNode : null;
    }
    if (String(gateId).startsWith('output-')) {
        return context.output.inputNode;
    }
    const gate = context.gates.find(g => g.id === gateId);
    if (!gate) return null;
    return nodeType === 'input' ? gate.inputNodes[nodeIndex] : gate.outputNode;
}

export function drawNode(context, node) {
    const { ctx } = context;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = node.connectedTo ? '#3498db' : '#fff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
}

export function drawNodesForGate(context, gate) {
    gate.inputNodes.forEach(node => drawNode(context, node));
    drawNode(context, gate.outputNode);
}

export function clearSelections(context) {
    context.selectedGate = null;
    context.selectedWire = null;
}