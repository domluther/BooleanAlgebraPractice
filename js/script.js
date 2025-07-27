let currentMode = 'nameThatGate';
let expressionModeDifficultyLevel = 1;
let currentGate = '';
let currentExpression = '';
let currentAcceptedAnswers = [];
let score = 0;
let totalQuestions = 0;
let answered = false;
let debugMode = false;

function setGameMode(mode, button) {
    currentMode = mode;
    
    // Update button states - changed from 'mode-btn' to 'btn-select'
    document.querySelectorAll('.btn-select').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Show/hide appropriate sections
    if (mode === 'nameThatGate') {
        document.getElementById('nameThatGateMode').style.display = 'block';
        document.getElementById('writeExpressionMode').style.display = 'none';
        document.getElementById('debugInfo').style.display = 'none';
        generateNameThatGateQuestion();
    } else {
        document.getElementById('nameThatGateMode').style.display = 'none';
        document.getElementById('writeExpressionMode').style.display = 'block';
        generateExpressionQuestion();
        if (debugMode) {
            document.getElementById('debugInfo').style.display = 'block';
            updateDebugDisplayForExpressionMode();
        }
    }
    
    hideFeedback();
}


// Name That Gate functionality
function generateNameThatGateQuestion() {
    const gates = ['AND', 'OR', 'NOT', 'NONE'];
    currentGate = gates[Math.floor(Math.random() * gates.length)];

    // currentGate = 'NONE'
    const svgCanvas = document.getElementById('nameThatGateCanvas');

    switch(currentGate) {
        case 'AND':
            svgCanvas.innerHTML = drawANDGate();
            break;
        case 'OR':
            svgCanvas.innerHTML = drawORGate();
            break;
        case 'NOT':
            svgCanvas.innerHTML = drawNOTGate();
            break;
        case 'NONE':
            svgCanvas.innerHTML = drawNONEGate();
            break;
    }
    
    // Reset option buttons - changed from 'option-btn' to 'btn'
    document.querySelectorAll('.options .btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
    });
}

function drawANDGate() {
    return `
        <path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
    `;
}

function drawORGate() {
    return `
        <path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
    `;
}

function drawNOTGate() {
    return `
        <path d="M 60 30 L 60 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="115" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="60" x2="60" y2="60" stroke="#333" stroke-width="2"/>
        <line x1="120" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
    `;
}

function drawNONEGate() {
    const incorrectGates = [
        {
            // NOT gate with inversion bubble before the triangle (backwards NOT)
            svg: `
                <circle cx="55" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 60 30 L 60 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="60" x2="50" y2="60" stroke="#333" stroke-width="2"/>
                <line x1="108" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
            `,
            reason: "The bubble is on the wrong side. It should be at the output."
        },
        {
            // AND gate rotated 180 degrees (curved side on left, straight on right)
            svg: `
                <path d="M 83 35 A 25 25 0 0 0 83 85 L 108 85 L 108 35 Z" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
                <line x1="108" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
            `,
            reason: "This AND gate is backwards. The curved side should be on the right."
        },
        {
            // NAND gate (AND with inversion bubble)
            svg: `
                <path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
                <circle cx="120" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
                <line x1="125" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
            `,
            reason: "AND gates don't have a bubble. This is a NAND gate, used at A-Level."
        },
        {
            // XOR gate (OR with extra curved line at input)
            svg: `
                <path d="M 55 35 Q 70 60 55 85" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
                <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>
            `,
            reason: "OR gates have one curved line. This is an XOR gate, used at A-Level."
        }
    ];
    
    // Select a random incorrect gate
    const randomIndex = Math.floor(Math.random() * incorrectGates.length);
    const selectedGate = incorrectGates[randomIndex];
    
    // Return both the SVG and the reason (you might want to handle the reason separately in your application)
    console.log("Incorrect gate reason:", selectedGate.reason);
    
    // return selectedGate.svg;
    return {
        svg: selectedGate.svg,
        reason: selectedGate.reason
    };
}
function checkNameThatGateAnswer(answer) {
    if (answered) return;
    
    answered = true;
    // TODO - Scoring manager 
    totalQuestions++;

    const nameThatGateButtons = document.querySelectorAll('#nameThatGateMode .options .btn');
    
    if (answer === currentGate) {
        // TODO - Scoring manager 
        score++;
        nameThatGateButtons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add('correct');
            }
        });
        showFeedback('Correct! Well done!', 'correct');
    } else {
        nameThatGateButtons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add('incorrect');
            } else if (btn.textContent === currentGate) {
                btn.classList.add('correct');
            }
        });
        showFeedback(`Incorrect. The correct answer is ${currentGate}.`, 'incorrect');
    }
    
    updateScoreDisplay();
    showNextButton();
}

// Debug mode for expression writing
function toggleDebugExpressionMode() {
    debugMode = document.getElementById('debugMode').checked;
    const debugInfo = document.getElementById('debugInfo');
    
    if (debugMode && currentMode === 'writeExpression') {
        debugInfo.style.display = 'block';
        updateDebugDisplayForExpressionMode();
    } else {
        debugInfo.style.display = 'none';
    }
}

function updateDebugDisplayForExpressionMode() {
    if (debugMode) {
        const acceptedAnswersDiv = document.getElementById('acceptedAnswers');
        if (currentAcceptedAnswers && currentAcceptedAnswers.length > 0) {
            acceptedAnswersDiv.innerHTML = currentAcceptedAnswers.map(answer => 
                `<div>${answer}</div>`
            ).join('');
        } else {
            acceptedAnswersDiv.innerHTML = '<div>No accepted answers generated</div>';
        }
    }
}

// Expression Mode functionality
function setExpressionModeDifficulty(level, clickedButton) {
    expressionModeDifficultyLevel = level;
    
    // Update button states
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    generateExpressionQuestion();
    hideFeedback();
    
    if (debugMode) {
        updateDebugDisplayForExpressionMode();
    }
}

function generateExpressionQuestion() {
    const circuitDisplay = document.getElementById('circuitDisplay');
    
    switch(expressionModeDifficultyLevel) {
        case 1:
            // Hardcoded SVGs for level 1
            generateLevel1ExpressionModeCircuit(circuitDisplay);
            break;
        case 2:
            generateLevel2ExpressionModeCircuit(circuitDisplay);
            break;
        case 3:
            generateLevel3ExpressionModeCircuit(circuitDisplay);
            break;
        case 4:
            generateLevel4ExpressionModeCircuit(circuitDisplay);
            break;
    }
    
    document.getElementById('expressionInput').value = '';
}

function generateAllAcceptedExpressionModeAnswers(baseExpression) {
    const answers = new Set([baseExpression]);
    
    const parts = baseExpression.split(' = ');
    if (parts.length !== 2) return [baseExpression];
    
    // Output on left, expression on right
    const leftSide = parts[0];
    const rightSide = parts[1];
    
    // Generate all possible variations
    const variations = generateExpressionVariations(rightSide);
    
    variations.forEach(variation => {
        answers.add(`${leftSide} = ${variation}`);
    });
    
    // Convert to array and sort for consistent display
    const result = [...answers].sort();
    console.log('Generated accepted answers for:', baseExpression, result);
    return result;
}

// Generates possible options using commutative but not associative (eg no removal of brackets)
function generateExpressionVariations(expression) {
    // Parse the expression into an abstract syntax tree
    function parseExpression(expr) {
        expr = expr.trim();
        
        // Handle NOT operations
        if (expr.startsWith('NOT ')) {
            const operand = expr.substring(4).trim();
            return {
                type: 'NOT',
                operand: parseExpression(operand),
                hasParens: false // Track if this NOT was originally in parentheses
            };
        }
        
        // Handle parentheses
        if (expr.startsWith('(') && expr.endsWith(')')) {
            // Check if these are the outermost parentheses
            let depth = 0;
            let isOutermost = true;
            for (let i = 0; i < expr.length; i++) {
                if (expr[i] === '(') depth++;
                else if (expr[i] === ')') depth--;
                
                if (depth === 0 && i < expr.length - 1) {
                    isOutermost = false;
                    break;
                }
            }
            
            if (isOutermost) {
                const inner = parseExpression(expr.substring(1, expr.length - 1));
                // Mark if this was a NOT expression that had explicit parentheses
                if (inner.type === 'NOT') {
                    inner.hasParens = true;
                }
                return inner;
            }
        }
        
        // Find the main operator (AND/OR) at the lowest depth
        let depth = 0;
        let mainOpIndex = -1;
        let mainOp = null;
        
        // Look for OR first (lower precedence)
        for (let i = expr.length - 1; i >= 0; i--) {
            if (expr[i] === ')') depth++;
            else if (expr[i] === '(') depth--;
            else if (depth === 0) {
                if (expr.substring(i, i + 3) === ' OR') {
                    mainOpIndex = i;
                    mainOp = 'OR';
                    break;
                } else if (expr.substring(i, i + 4) === ' AND' && mainOp === null) {
                    mainOpIndex = i;
                    mainOp = 'AND';
                }
            }
        }
        
        if (mainOpIndex !== -1) {
            const left = expr.substring(0, mainOpIndex).trim();
            const right = expr.substring(mainOpIndex + (mainOp === 'OR' ? 3 : 4)).trim();
            
            return {
                type: mainOp,
                left: parseExpression(left),
                right: parseExpression(right)
            };
        }
        
        // If no operator found, it's a variable
        return {
            type: 'VAR',
            name: expr
        };
    }
    
    // Generate all variations of an AST
    function generateASTVariations(ast) {
        if (ast.type === 'VAR') {
            return [ast];
        }
        
        if (ast.type === 'NOT') {
            const operandVariations = generateASTVariations(ast.operand);
            return operandVariations.map(operand => ({
                type: 'NOT',
                operand: operand,
                hasParens: ast.hasParens || false // Preserve parentheses flag
            }));
        }
        
        if (ast.type === 'AND' || ast.type === 'OR') {
            const leftVariations = generateASTVariations(ast.left);
            const rightVariations = generateASTVariations(ast.right);
            
            const variations = [];
            
            // Generate all combinations of left and right variations
            for (const left of leftVariations) {
                for (const right of rightVariations) {
                    // Original order
                    variations.push({
                        type: ast.type,
                        left: left,
                        right: right
                    });
                    
                    // Commutative order (swap left and right)
                    variations.push({
                        type: ast.type,
                        left: right,
                        right: left
                    });
                }
            }
            
            return variations;
        }
        
        return [ast];
    }
    
    // Convert AST back to string, preserving original parentheses structure
    function astToString(ast) {
        if (ast.type === 'VAR') {
            return ast.name;
        }
        
        if (ast.type === 'NOT') {
            const operandStr = astToString(ast.operand);
            
            // Use parentheses if originally had them or if operand is complex
            const needsParens = ast.hasParens || (ast.operand.type === 'AND' || ast.operand.type === 'OR');
            
            if (needsParens) {
                return `(NOT ${operandStr})`;
            }
            return `NOT ${operandStr}`;
        }
        
        if (ast.type === 'AND' || ast.type === 'OR') {
            const leftStr = astToString(ast.left);
            const rightStr = astToString(ast.right);
            
            // Preserve parentheses structure - add parentheses around complex sub-expressions
            let leftFinal = leftStr;
            let rightFinal = rightStr;
            
            // Add parentheses if sub-expression is complex (contains operators)
            if (ast.left.type === 'AND' || ast.left.type === 'OR') {
                leftFinal = `(${leftStr})`;
            }
            if (ast.right.type === 'AND' || ast.right.type === 'OR') {
                rightFinal = `(${rightStr})`;
            }
            
            return `${leftFinal} ${ast.type} ${rightFinal}`;
        }
        
        return '';
    }
    
    try {
        // Parse the expression
        const ast = parseExpression(expression);
        
        // Generate all variations
        const astVariations = generateASTVariations(ast);
        
        // Convert back to strings and remove duplicates
        const stringVariations = astVariations.map(astToString);
        const uniqueVariations = [...new Set(stringVariations)];
        
        return uniqueVariations;
    } catch (error) {
        // Fallback to original expression if parsing fails
        console.warn('Failed to parse expression:', expression, error);
        return [expression];
    }
}

// Normalises user answer and compares it against accepted answers
function checkExpressionAnswer() {
    if (answered) return;
    
    const userAnswer = document.getElementById('expressionInput').value.trim().toUpperCase();
    
    answered = true;
    totalQuestions++;

    hideSubmitExpressionButton();

    // More comprehensive normalization function
    function normalizeExpression(expr) {
        return expr
            .replace(/\s+/g, ' ')           // Collapse multiple spaces to single space
            .replace(/\s*\(\s*/g, '(')      // Remove spaces around opening parentheses
            .replace(/\s*\)\s*/g, ')')      // Remove spaces around closing parentheses  
            .replace(/\s*(AND|OR|NOT)\s*/g, ' $1 ')  // Ensure single space around operators
            .replace(/\s+/g, ' ')           // Collapse any remaining multiple spaces
            .trim();                        // Remove leading/trailing spaces
    }

    // Normalize the user answer for comparison
    const normalizedUser = normalizeExpression(userAnswer);
    
    // Check if user answer matches any of the accepted answers
    const isCorrect = currentAcceptedAnswers.some(acceptedAnswer => {
        const normalizedAccepted = normalizeExpression(acceptedAnswer.toUpperCase());
        return normalizedUser === normalizedAccepted;
    });
    
    if (isCorrect) {
        score++;
        showFeedback('Correct! Excellent work!', 'correct');
    } else {
        showFeedback(`Incorrect. The correct answer is: ${currentExpression}`, 'incorrect');
    }
    
    updateScoreDisplay();
    showNextButton();
}


// Update UI
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

function showSubmitExpressionButton() {
    document.getElementById('submitExpressionBtn').style.display = 'inline-block';
}

function hideSubmitExpressionButton() {
    document.getElementById('submitExpressionBtn').style.display = 'none';
}

function updateScoreDisplay() {
    document.getElementById('scoreDisplay').textContent = `${score}/${totalQuestions}`;
}

function nextQuestion() {
    hideNextButton();
    hideFeedback();
    
    answered = false;

    if (currentMode === 'nameThatGate') {
        generateNameThatGateQuestion();
    } else if (currentMode === 'writeExpression') {
        showSubmitExpressionButton();
        generateExpressionQuestion();
        if (debugMode) {
            updateDebugDisplayForExpressionMode();
        }
    }
    else {
        console.error('Unknown game mode:', currentMode);
    }
}

function handleEnterKeyForExpressionMode(event) {
    if (event.key === 'Enter') {
        if (!answered) {
            checkExpressionAnswer();
        } else {
            nextQuestion();
        }
    }
}

// Hardcoded - prettier and faster than using circuit generator
function generateLevel1ExpressionModeCircuit(container) {
    const gates = ['AND', 'OR', 'NOT'];
    const gate = gates[Math.floor(Math.random() * gates.length)];
    
    let svg = '<svg width="200" height="120" viewBox="0 0 200 120">';
    
    if (gate === 'AND') {
        currentExpression = 'Q = A AND B';
        svg += drawANDGate();
    } else if (gate === 'OR') {
        currentExpression = 'Q = A OR B';
        svg += drawORGate();
    } else {
        currentExpression = 'Q = NOT A';
        svg += drawNOTGate();
    }
    
    svg += '</svg>';
    container.innerHTML = svg;
        
    currentAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentExpression);
    if (debugMode) {
        updateDebugDisplayForExpressionMode();
    }
}

// Generates SVG for expressions
class CircuitGenerator {
    constructor() {
        this.gateId = 0;
        this.wireId = 0;
        this.variablePositions = new Map(); // Track variable positions to avoid overlaps
    }

    parseExpression(expr) {
        // Remove Q = from the beginning
        const rightSide = expr.split(' = ')[1];
        return this.parseTokens(this.tokenize(rightSide));
    }

    tokenize(expr) {
        const tokens = [];
        let i = 0;
        while (i < expr.length) {
            if (expr[i] === ' ') {
                i++;
                continue;
            }
            if (expr[i] === '(') {
                tokens.push('(');
                i++;
            } else if (expr[i] === ')') {
                tokens.push(')');
                i++;
            } else if (expr.substr(i, 3) === 'AND') {
                tokens.push('AND');
                i += 3;
            } else if (expr.substr(i, 2) === 'OR') {
                tokens.push('OR');
                i += 2;
            } else if (expr.substr(i, 3) === 'NOT') {
                tokens.push('NOT');
                i += 3;
            } else if (/[A-Z]/.test(expr[i])) {
                tokens.push(expr[i]);
                i++;
            } else {
                i++;
            }
        }
        return tokens;
    }

    parseTokens(tokens) {
        return this.parseOr(tokens, 0).node;
    }

    parseOr(tokens, pos) {
        let result = this.parseAnd(tokens, pos);
        
        while (result.pos < tokens.length && tokens[result.pos] === 'OR') {
            const right = this.parseAnd(tokens, result.pos + 1);
            result = {
                node: { type: 'OR', left: result.node, right: right.node },
                pos: right.pos
            };
        }
        return result;
    }

    parseAnd(tokens, pos) {
        let result = this.parseNot(tokens, pos);
        
        while (result.pos < tokens.length && tokens[result.pos] === 'AND') {
            const right = this.parseNot(tokens, result.pos + 1);
            result = {
                node: { type: 'AND', left: result.node, right: right.node },
                pos: right.pos
            };
        }
        return result;
    }

    parseNot(tokens, pos) {
        if (pos < tokens.length && tokens[pos] === 'NOT') {
            const operand = this.parsePrimary(tokens, pos + 1);
            return {
                node: { type: 'NOT', operand: operand.node },
                pos: operand.pos
            };
        }
        return this.parsePrimary(tokens, pos);
    }

    parsePrimary(tokens, pos) {
        if (pos >= tokens.length) return { node: null, pos };
        
        if (tokens[pos] === '(') {
            const result = this.parseOr(tokens, pos + 1);
            return { node: result.node, pos: result.pos + 1 }; // Skip closing )
        } else if (/[A-Z]/.test(tokens[pos])) {
            return { node: { type: 'VAR', name: tokens[pos] }, pos: pos + 1 };
        }
        return { node: null, pos };
    }

    generateCircuit(expression, container) {
        this.gateId = 0;
        this.wireId = 0;
        this.variablePositions = new Map(); // Reset for each circuit generation
        
        const ast = this.parseExpression(expression);
        const layout = this.layoutNodes(ast);
        const svg = this.renderSVG(layout, container);
        
        return svg;
    }

    layoutNodes(node, x = null, y = null, level = 0, parentGateInputY = null) {
        if (!node) return null;

        // Calculate circuit depth for width determination
        const depth = this.getCircuitDepth(node);
        const baseWidth = Math.max(300, depth * 100);
        
        if (x === null) {
            x = baseWidth - 50;
        }
        
        if (y === null) {
            y = 125;
        }

        const minY = 40;
        const maxY = 210;
        y = Math.max(minY, Math.min(maxY, y));

        const nodeLayout = {
            ...node,
            x: x,
            y: y,
            id: this.gateId++,
            level: level
        };

        if (node.type === 'VAR') {
            nodeLayout.width = 20;
            nodeLayout.height = 20;
            nodeLayout.x = 60;
            
            let targetY = y;
            if (parentGateInputY !== null) {
                targetY = parentGateInputY;
            }
            
            nodeLayout.y = this.adjustVariablePosition(node.name, targetY);
        } else if (node.type === 'NOT') {
            nodeLayout.width = 60;
            nodeLayout.height = 40;
            nodeLayout.operand = this.layoutNodes(node.operand, x - 90, y, level + 1, y);
        } else { // AND or OR
            nodeLayout.width = 80;
            nodeLayout.height = 60; // Increased from 50 to give more vertical space
            
            // Increase spacing to match the larger gate height
            const baseSpacing = Math.max(40, 55 - (level * 5)); // Increased spacing
            const spacing = Math.min(baseSpacing, (maxY - minY) / 4);
            
            const leftY = Math.max(minY, Math.min(maxY, y - spacing));
            const rightY = Math.max(minY, Math.min(maxY, y + spacing));
            
            // Use larger input offsets to match the bigger gate
            nodeLayout.left = this.layoutNodes(node.left, x - 100, leftY, level + 1, y - 15); // Increased from 12
            nodeLayout.right = this.layoutNodes(node.right, x - 100, rightY, level + 1, y + 15); // Increased from 12
        }

        return nodeLayout;
    }

    adjustVariablePosition(varName, proposedY) {
        const minSeparation = 30; // Minimum vertical separation between variables
        
        // Check if this variable already has a position assigned
        if (this.variablePositions.has(varName)) {
            return this.variablePositions.get(varName);
        }
        
        let adjustedY = proposedY;
        let conflictFound = true;
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loops
        
        // Keep adjusting until we find a position that doesn't conflict
        while (conflictFound && attempts < maxAttempts) {
            conflictFound = false;
            attempts++;
            
            for (const [existingVar, existingY] of this.variablePositions) {
                if (Math.abs(adjustedY - existingY) < minSeparation) {
                    // Try both directions - up and down
                    const moveUp = existingY - minSeparation;
                    const moveDown = existingY + minSeparation;
                    
                    // Choose the direction that keeps us closer to the original proposed position
                    if (Math.abs(moveUp - proposedY) < Math.abs(moveDown - proposedY) && moveUp >= 40) {
                        adjustedY = moveUp;
                    } else if (moveDown <= 210) {
                        adjustedY = moveDown;
                    } else if (moveUp >= 40) {
                        adjustedY = moveUp;
                    } else {
                        // If both directions are out of bounds, use the proposed position anyway
                        adjustedY = Math.max(40, Math.min(210, proposedY));
                    }
                    
                    conflictFound = true;
                    break;
                }
            }
        }
        
        // Ensure we stay within bounds
        adjustedY = Math.max(40, Math.min(210, adjustedY));
        
        // Store the final position
        this.variablePositions.set(varName, adjustedY);
        
        return adjustedY;
    }

    getCircuitDepth(node) {
        if (!node) return 0;
        if (node.type === 'VAR') return 1;
        if (node.type === 'NOT') return 1 + this.getCircuitDepth(node.operand);
        return 1 + Math.max(this.getCircuitDepth(node.left), this.getCircuitDepth(node.right));
    }

    renderSVG(layout, container) {
        // Calculate dynamic width based on circuit complexity
        const depth = this.getCircuitDepth(layout);
        const width = Math.max(350, depth * 100 + 100);
        const height = 250;
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        
        // Collect all variables for input labels
        const variables = new Set();
        this.collectVariables(layout, variables);
        
        // Render connections first (so they appear behind gates)
        svg += this.renderConnections(layout);
        
        // Render gates
        svg += this.renderGates(layout);
        
        // Output label
        svg += `<text x="${width - 30}" y="${height/2 + 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`;
        
        // Output line to Q
        const rootOutput = this.getOutputPoint(layout);
        svg += `<line x1="${rootOutput.x}" y1="${rootOutput.y}" x2="${width - 50}" y2="${height/2}" stroke="#333" stroke-width="2"/>`;
        
        svg += '</svg>';
        container.innerHTML = svg;
        return svg;
    }

    collectVariables(node, variables) {
        if (!node) return;
        if (node.type === 'VAR') {
            variables.add(node.name);
        } else if (node.type === 'NOT') {
            this.collectVariables(node.operand, variables);
        } else {
            this.collectVariables(node.left, variables);
            this.collectVariables(node.right, variables);
        }
    }

    renderGates(node) {
        if (!node) return '';
        
        let svg = '';
        
        if (node.type === 'AND') {
            // Increased gate height - adjust the path coordinates
            svg += `<path d="M ${node.x - 40} ${node.y - 30} L ${node.x - 40} ${node.y + 30} L ${node.x - 15} ${node.y + 30} A 30 30 0 0 0 ${node.x - 15} ${node.y - 30} Z" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += this.renderGates(node.left);
            svg += this.renderGates(node.right);
        } else if (node.type === 'OR') {
            // Increased gate height - adjust the path coordinates  
            svg += `<path d="M ${node.x - 40} ${node.y - 30} Q ${node.x - 15} ${node.y - 30} ${node.x + 10} ${node.y} Q ${node.x - 15} ${node.y + 30} ${node.x - 40} ${node.y + 30} Q ${node.x - 25} ${node.y} ${node.x - 40} ${node.y - 30}" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += this.renderGates(node.left);
            svg += this.renderGates(node.right);
        } else if (node.type === 'NOT') {
            svg += `<path d="M ${node.x - 30} ${node.y - 20} L ${node.x - 30} ${node.y + 20} L ${node.x + 19} ${node.y} Z" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += `<circle cx="${node.x + 25}" cy="${node.y}" r="5" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += this.renderGates(node.operand);
        } else if (node.type === 'VAR') {
            // Render variable labels at their positions
            svg += `<text x="${node.x - 10}" y="${node.y + 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${node.name}</text>`;
        }
        
        return svg;
    }

    renderConnections(node) {
        if (!node) return '';
        
        let svg = '';
        
        if (node.type === 'AND') {
            // Connection from left child to gate
            if (node.left) {
                const leftOutput = this.getOutputPoint(node.left);
                svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 40}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
            }
            
            // Connection from right child to gate
            if (node.right) {
                const rightOutput = this.getOutputPoint(node.right);
                svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 40}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
            }
            
            svg += this.renderConnections(node.left);
            svg += this.renderConnections(node.right);
        }
        else if (node.type === 'OR') {
            // Connection from left child to gate
            if (node.left) {
                const leftOutput = this.getOutputPoint(node.left);
                svg += `<line x1="${leftOutput.x}" y1="${leftOutput.y}" x2="${node.x - 35}" y2="${node.y - 15}" stroke="#333" stroke-width="2"/>`;
            }
            
            // Connection from right child to gate
            if (node.right) {
                const rightOutput = this.getOutputPoint(node.right);
                svg += `<line x1="${rightOutput.x}" y1="${rightOutput.y}" x2="${node.x - 35}" y2="${node.y + 15}" stroke="#333" stroke-width="2"/>`;
            }
            
            svg += this.renderConnections(node.left);
            svg += this.renderConnections(node.right);
        }
         else if (node.type === 'NOT') {
            // Connection from operand to NOT gate
            if (node.operand) {
                const operandOutput = this.getOutputPoint(node.operand);
                svg += `<line x1="${operandOutput.x}" y1="${operandOutput.y}" x2="${node.x - 30}" y2="${node.y}" stroke="#333" stroke-width="2"/>`;
            }
            
            svg += this.renderConnections(node.operand);
        }
        
        return svg;
    }

    getOutputPoint(node) {
        if (!node) return { x: 0, y: 0 };
        
        if (node.type === 'VAR') {
            return { x: node.x + 10, y: node.y };
        } else if (node.type === 'NOT') {
            return { x: node.x + 30, y: node.y };
        } else if (node.type === 'OR') {
            return { x: node.x + 10, y: node.y }; // Moved 5 pixels right from +10
        } else {
            return { x: node.x + 15, y: node.y }; // Moved 5 pixels right from +10
        }
    }
}

const circuitGenerator = new CircuitGenerator();

function generateLevel2ExpressionModeCircuit(container) {
const level2Expressions = [
    "Q = (A AND B) AND C",
    "Q = (A AND B) OR C",
    "Q = (A AND C) AND B",
    "Q = (A AND C) OR B",
    "Q = (A OR B) AND C",
    "Q = (A OR B) OR C",
    "Q = (A OR C) AND B",
    "Q = (A OR C) OR B",
    "Q = (B AND C) AND A",
    "Q = (B AND C) OR A",
    "Q = (B OR C) AND A",
    "Q = (B OR C) OR A",
    "Q = A AND (B AND C)",
    "Q = A AND (B OR C)",
    "Q = A AND (C AND B)",
    "Q = A AND (C OR B)",
    "Q = A OR (B AND C)",
    "Q = A OR (B OR C)",
    "Q = A OR (C AND B)",
    "Q = A OR (C OR B)",
    "Q = B AND (A AND C)",
    "Q = B AND (A OR C)",
    "Q = B AND (C AND A)",
    "Q = B AND (C OR A)",
    "Q = B OR (A AND C)",
    "Q = B OR (A OR C)",
    "Q = B OR (C AND A)",
    "Q = B OR (C OR A)",
    "Q = C AND (A AND B)",
    "Q = C AND (A OR B)",
    "Q = C AND (B AND A)",
    "Q = C AND (B OR A)",
    "Q = C OR (A AND B)",
    "Q = C OR (A OR B)",
    "Q = C OR (B AND A)",
    "Q = C OR (B OR A)",
    'Q = NOT (NOT A)'
];

    
    currentExpression = level2Expressions[Math.floor(Math.random() * level2Expressions.length)];
    circuitGenerator.generateCircuit(currentExpression, container);
    
    currentAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentExpression);
    if (debugMode) {
        updateDebugDisplayForExpressionMode();
    }
}

function generateLevel3ExpressionModeCircuit(container) {
    const level3Expressions = [
        'Q = (A AND B) OR (C AND D)',
        'Q = (A OR B) AND (C OR D)',
        'Q = (A AND B) AND (C OR D)',
        'Q = (A OR B) OR (C AND D)',
        'Q = (NOT (A AND B)) OR C',
        'Q = (NOT (A OR B)) AND C',
        'Q = A AND (NOT (B OR C))',
        'Q = A OR (NOT (B AND C))',
        'Q = (NOT A) AND (NOT B)',
        'Q = (NOT A) OR (NOT B)',
        'Q = ((NOT A) AND B) OR C',
        'Q = (A AND (NOT B)) OR C',
        'Q = ((NOT A) OR B) AND C',
        'Q = (A OR (NOT B)) AND C',
        'Q = NOT ((NOT A) AND B)',
        'Q = NOT (A AND (NOT B))',
        'Q = (A AND B) OR (NOT C)',
        'Q = (A OR B) AND (NOT C)',
        'Q = (NOT A) AND (B OR C)',
        'Q = (NOT A) OR (B AND C)',
        'Q = ((NOT A) AND (NOT B)) AND C',
        'Q = ((NOT A) OR (NOT B)) OR C',
        'Q = (A AND (NOT B)) AND C',
        'Q = (A OR (NOT B)) OR C',
        'Q = NOT ((A OR B) OR C)',
        'Q = NOT ((A AND B) AND C)',
        'Q = ((A AND (NOT B)) OR C)',
        'Q = ((A OR (NOT B)) AND C)'
    ];
    
    currentExpression = level3Expressions[Math.floor(Math.random() * level3Expressions.length)];
    circuitGenerator.generateCircuit(currentExpression, container);
    
    currentAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentExpression);
    if (debugMode) {
        updateDebugDisplayForExpressionMode();
    }
}

// Challenge mode - less important that circuits are wonky
function generateLevel4ExpressionModeCircuit(container) {
    const level4Expressions = [
        'Q = ((A AND B) OR (C AND D)) OR E', // A + B wonky lines
        'Q = (A AND (B OR C)) AND (D OR E)', // D + E wonky lines
        'Q = ((A OR B) AND (C AND D)) OR E', // A + B wonky lines
        'Q = (A OR (B AND C)) OR (D AND E)', // D + E wonky lines - move AND down?
        'Q = (NOT (A AND B)) OR (C AND D)',
        'Q = (A AND B) AND (NOT (C OR D))',
        'Q = ((NOT A) OR B) AND (C OR (NOT D))',
        'Q = (A AND ((NOT B) OR C)) OR (D AND E)' // A overlaps NOT gate in SVG, D + E wonky lines
    ];
    
    currentExpression = level4Expressions[Math.floor(Math.random() * level4Expressions.length)];
    circuitGenerator.generateCircuit(currentExpression, container);
    
    currentAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentExpression);
    if (debugMode) {
        updateDebugDisplayForExpressionMode();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    generateNameThatGateQuestion();
    updateScoreDisplay();
});