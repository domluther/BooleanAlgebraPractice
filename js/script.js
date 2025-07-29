let score = 0;
let totalQuestions = 0;
let answered = false;
let currentMode = 'nameThatGate';
let difficultyLevels = {
    writeExpression: 1,
    scenario: 1,
    truthTable: 1,
    drawCircuit: 1
};
const modeSettings = [{
    gameMode: 'nameThatGate',
    label: 'Name That Gate',
    levels: 0

}, {
    gameMode: 'writeExpression',
    label: 'Expression Writing',
    levels: 4
}, {
    gameMode: 'truthTable',
    label: 'Truth Tables',
    levels: 3
}, {
    gameMode: 'drawCircuit',
    label: 'Draw Circuit',
    levels: 4
}, {
    gameMode: 'scenario',
    label: 'Scenarios',
    levels: 3
}];

// Global variables for name that gate mode
let nameThatGateCurrentGate = '';
let nameThatGateReason = '';

// Global variables for expression writing mode
let currentExpression = '';
let currentAcceptedAnswers = [];
let expressionHelpMode = false;

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
let nextId = 0;
let draggingGate = null;
let draggingOffset = { x: 0, y: 0 };
let wireStartNode = null;
let targetExpression = "";
let parsedTargetExpression = {};
let circuitHelpMode = false;

// Global variables for scenario mode
let scenarioHelpMode = false;
let currentScenario = '';
let currentScenarioAcceptedAnswers = [];
const gateImages = {};

function generateModeSelectorButtons() {

    const container = document.getElementById('modeSelector');

    modeSettings.forEach(mode => {
        const button = document.createElement('button');
        button.className = 'btn btn-select';
        button.onclick = () => setGameMode(mode.gameMode, button);
        button.innerText = mode.label;
        container.appendChild(button);
    });
}

function generateDifficultyDropdown(gameMode) {
    if (gameMode === 'nameThatGate') return; // No difficulty levels for this mode


    const currentDifficulty = difficultyLevels[gameMode] || 1;
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
    const maxLevel = modeSettings.find(m => m.gameMode === gameMode)?.levels || 3;
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
    select.addEventListener('change', function () {
        const level = parseInt(this.value);
        setDifficultyLevel(level, this);
    });

    container.appendChild(select);
}


function setGameMode(mode, clickedButton) {
    currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-selector .btn-select').forEach(btn => {
        btn.classList.remove('active', 'mode-active');
    });
    clickedButton.classList.add('active', 'mode-active');
    
    // Hide all game modes
    document.querySelectorAll('.game-mode-container').forEach(el => el.style.display = 'none');

    // Hide help info for all modes
    document.getElementById('expressionHelpInfo').style.display = 'none';
    document.getElementById('scenarioHelpInfo').style.display = 'none';
    document.getElementById('circuitHelpInfo').style.display = 'none';

    generateDifficultyDropdown(mode);

    // Show the selected mode
    const activeContainer = document.getElementById(mode + 'Mode');
    if (activeContainer) {
        activeContainer.style.display = 'block';
    }

    
    // Reset answered state and hide feedback/buttons
    answered = false;
    hideFeedback();
    hideNextButton();
    showSubmitButton();

    
    // Initialize the selected mode
    if (mode === 'nameThatGate') {
        generateNameThatGateQuestion();
        hideSubmitButton()
    } else if (mode === 'writeExpression') {
        generateExpressionQuestion();
        if (expressionHelpMode) {
            document.getElementById('expressionHelpInfo').style.display = 'block';
            updateHelpDisplayForExpressionMode();
        }
    } else if (mode === 'scenario') {
        generateScenarioQuestion();
        if (scenarioHelpMode) {
            document.getElementById('scenarioHelpInfo').style.display = 'block';
            updateHelpDisplayForScenarioMode();
        }
    } else if (mode === 'truthTable') {
        generateTruthTableQuestion();
    } else if (mode === 'drawCircuit') {
        initDrawCircuitMode();
        if (circuitHelpMode) {
            document.getElementById('circuitHelpInfo').style.display = 'block';
        }
    }
}

function setDifficultyLevel(level, clickedButton) {
    // Update difficulty levels based on mode
    if (currentMode === 'writeExpression') {
        setExpressionModeDifficulty(level, clickedButton);
    } else if (currentMode === 'scenario') {
        setScenarioModeDifficulty(level, clickedButton);
    } else if (currentMode === 'truthTable') {
        setTruthTableModeDifficulty(level, clickedButton);
    } else if (currentMode === 'drawCircuit') {
        setDrawCircuitModeDifficulty(level, clickedButton);
    }
}

function checkAnswer(answer='') {
    if (answered) return;

    if (currentMode === 'drawCircuit') {
        checkCircuitAnswer();
    }
    else if (currentMode === 'nameThatGate') {
        checkNameThatGateAnswer(answer);
    }
    else if (currentMode === 'writeExpression') {
        checkExpressionAnswer();
    }
    else if (currentMode === 'scenario') {
        checkScenarioAnswer();
    }
    else if (currentMode === 'truthTable') {
        checkTruthTableAnswer();
    }
}

function showSubmitButton() {
    document.getElementById('submitBtn').style.display = 'inline-block';
}

function hideSubmitButton() {
    document.getElementById('submitBtn').style.display = 'none';
}

// Name That Gate functionality
function generateNameThatGateQuestion() {
    const gates = ['AND', 'OR', 'NOT', 'NONE', 'NONE'];
    nameThatGateCurrentGate = gates[Math.floor(Math.random() * gates.length)];

    const svgCanvas = document.getElementById('nameThatGateLogicDiagramDisplay');
    if (!svgCanvas) {
        console.error("SVG canvas element not found.");
        return;
    }

    switch(nameThatGateCurrentGate) {
        case 'AND':
            circuitGenerator.generateCircuit('Q = A AND B', svgCanvas);
            break;
        case 'OR':
            circuitGenerator.generateCircuit('Q = A OR B', svgCanvas);
            break;
        case 'NOT':
            circuitGenerator.generateCircuit('Q = NOT A', svgCanvas);
            break;
        case 'NONE':
            svgCanvas.innerHTML = drawNONEGate();
            break;
    }
    
    // Reset option buttons
    document.querySelectorAll('.options .btn').forEach(btn => {
        btn.classList.remove('correct', 'incorrect');
    });
}

// Needed for invalid gates
function drawNONEGate() {
    const incorrectGates = [
        {
            // NOT gate with inversion bubble before the triangle (backwards NOT)
            svg: `
                <circle cx="55" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 61 30 L 61 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/>
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
            reason: "It is a backwards AND gate. The curved side should be on the right."
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
            reason: "The bubble makes it a NAND gate, used at A-Level."
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
            reason: "The extra curved line makes it an XOR gate, used at A-Level."
        }
    ];
    
    // Select a random incorrect gate
    const randomIndex = Math.floor(Math.random() * incorrectGates.length);
    const selectedGate = incorrectGates[randomIndex];
    
    nameThatGateReason = selectedGate.reason;
    
    const completeGateSVG = `
    <svg width="200" height="120" viewBox="0 0 200 120">
        ${selectedGate.svg}
    </svg>`
    return completeGateSVG;
}

function checkNameThatGateAnswer(answer) {
    if (answered) return;
    
    answered = true;
    totalQuestions++;

    const nameThatGateButtons = document.querySelectorAll('#nameThatGateMode .options .btn');
    
    if (answer === nameThatGateCurrentGate) {
        score++;
        nameThatGateButtons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add('correct');
            }
        });
        let message = 'Correct! Well done!';
        if (nameThatGateCurrentGate === 'NONE') {
            message = `Correct! This is not a GCSE logic gate. ${nameThatGateReason}`;
        }
        showFeedback(message, 'correct');
    } else {
        nameThatGateButtons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add('incorrect');
            } else if (btn.textContent === nameThatGateCurrentGate) {
                btn.classList.add('correct');
            }
        });
        let message = `Incorrect! The correct answer is ${nameThatGateCurrentGate}!`;
        if (nameThatGateCurrentGate === 'NONE') {
            message = `Incorrect! This is not a GCSE logic gate. ${nameThatGateReason}`;
        }
        showFeedback(message, 'incorrect');
    }
    
    updateScoreDisplay();
    showNextButton();
}

//  Expression mode content
const expressionDatabase = {
    level1: [
        "Q = A AND B",
        "Q = A OR B", 
        "Q = NOT A",
        "Q = NOT B",
    ],
    level2: [
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
    ],
    level3: [
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
    ],
    level4: [
    'Q = ((A AND B) OR (C AND D)) OR E',
    'Q = (A AND (B OR C)) AND (D OR E)',
    'Q = ((A OR B) AND (C AND D)) OR E',
    'Q = (A OR (B AND C)) OR (D AND E)',
    'Q = (NOT (A AND B)) OR (C AND D)',
    'Q = (A AND B) AND (NOT (C OR D))',
    'Q = ((NOT A) OR B) AND (C OR (NOT D))',
    'Q = (A AND ((NOT B) OR C)) OR (D AND E)'
    ]
};


// Help mode for expression writing
function toggleHelpExpressionMode() {
    expressionHelpMode = document.getElementById('debugMode').checked;
    const expressionHelpInfo = document.getElementById('expressionHelpInfo');

    if (expressionHelpMode && currentMode === 'writeExpression') {
        expressionHelpInfo.style.display = 'block';
        updateHelpDisplayForExpressionMode();
    } else {
        expressionHelpInfo.style.display = 'none';
    }
}

function updateHelpDisplayForExpressionMode() {
    if (expressionHelpMode) {
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
    difficultyLevels.writeExpression = level;

    document.querySelectorAll('#writeExpressionMode .btn-select').forEach(btn => {
        btn.classList.remove('active', 'difficulty-active');
    });
    clickedButton.classList.add('active', 'difficulty-active');
    
    generateExpressionQuestion();
    hideFeedback();
    
    if (expressionHelpMode) {
        updateHelpDisplayForExpressionMode();
    }

    // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitButton();
    answered = false;
}

function generateExpressionQuestion() {
    const logicDiagramDisplay = document.getElementById('logicDiagramDisplay');
    const levelKey = `level${difficultyLevels.writeExpression}`;
    const expressions = expressionDatabase[levelKey];

    currentExpression = expressions[Math.floor(Math.random() * expressions.length)];
    circuitGenerator.generateCircuit(currentExpression, logicDiagramDisplay);
    
    currentAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentExpression);

    if (expressionHelpMode) {
        updateHelpDisplayForExpressionMode();
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

    hideSubmitButton();

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

// Help mode for scenario mode
function toggleHelpScenarioMode() {
    scenarioHelpMode = document.getElementById('scenarioDebugMode').checked;
    const expressionHelpInfo = document.getElementById('scenarioHelpInfo');
    
    if (scenarioHelpMode && currentMode === 'scenario') {
        expressionHelpInfo.style.display = 'block';
        updateHelpDisplayForScenarioMode();
    } else {
        expressionHelpInfo.style.display = 'none';
    }
}

function updateHelpDisplayForScenarioMode() {
    if (scenarioHelpMode) {
        const acceptedAnswersDiv = document.getElementById('scenarioAcceptedAnswers');
        if (currentScenarioAcceptedAnswers && currentScenarioAcceptedAnswers.length > 0) {
            acceptedAnswersDiv.innerHTML = currentScenarioAcceptedAnswers.map(answer => 
                `<div>${answer}</div>`
            ).join('');
        } else {
            acceptedAnswersDiv.innerHTML = '<div>No accepted answers generated</div>';
        }
    }
}

// Scenario Mode functionality
function setScenarioModeDifficulty(level, clickedButton) {
    difficultyLevels.scenario = level;

    // UPDATED: Changed selector from .difficulty-btn to .btn-select
    document.querySelectorAll('#scenarioMode .btn-select').forEach(btn => {
        btn.classList.remove('active', 'difficulty-active');
    });
    clickedButton.classList.add('active', 'difficulty-active');
    
    generateScenarioQuestion();
    hideFeedback();
    
    if (scenarioHelpMode) {
        updateHelpDisplayForScenarioMode();
    }
        // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitButton();
    answered = false;
}

function generateScenarioQuestion() {
    const scenarioScenarios = {
        1: [ // Level 1 - Simple AND/OR scenarios
            {
                title: "Going out",
                scenario: "You can go out (Q) if you have done your homework.",
                inputs: {
                    A: "Homework is done"
                },
                expression: "Q = A"
            },
                        {
                title: "Going out again",
                scenario: "You can go out (Q) if you did not get a detention at school.",
                inputs: {
                    A: "Got a detention"
                },
                expression: "Q = NOT A"
            },
            {
                title: "Door Access",
                scenario: "A secure door will only unlock (Q) if the person has a valid ID badge AND knows the correct passcode.",
                inputs: {
                    A: "Person has a valid ID badge",
                    B: "Person knows the correct passcode"
                },
                expression: "Q = A AND B"
            },
            {
                title: "Alarm System",
                scenario: "A burglar alarm will trigger (Q) if either a door OR window is opened.",
                inputs: {
                    A: "Door is opened",
                    B: "Window is opened"
                },
                expression: "Q = A OR B"
            },
            {
                title: "Computer Login",
                scenario: "A computer will let the user login (Q) if they enter the correct username AND the correct password.",
                inputs: {
                    A: "Correct username entered",
                    B: "Correct password entered"
                },
                expression: "Q = A AND B"
            },
            {
                title: "Emergency Exit",
                scenario: "An emergency exit will open (Q) if either the fire alarm is activated OR the manual override is pressed.",
                inputs: {
                    A: "Fire alarm is activated",
                    B: "Manual override is pressed"
                },
                expression: "Q = A OR B"
            }
        ],
        2: [ // Level 2 - More complex scenarios with 3 inputs
            {
                title: "Bank Vault Access",
                scenario: "A bank stores its money in a vault to keep it safe. The vault will open (Q) only if all three conditions are met: the manager's key is turned, the correct code is entered, and biometric scan passes.",
                inputs: {
                    A: "Manager's key is turned",
                    B: "Correct code is entered",
                    C: "Biometric scan passes"
                },
                expression: "Q = A AND B AND C"
            },
            {
                title: "Emergency Shutdown",
                scenario: "A nuclear reactor will shut down (Q) if the temperature or pressure exceed a safe limit. It can also be triggered by an emergency button being pressed.",
                inputs: {
                    A: "Temperature exceeds safe limit",
                    B: "Pressure exceeds safe limit",
                    C: "Emergency button is pressed"
                },
                expression: "Q = A OR B OR C"
            },
            {
                title: "Car Engine Start",
                scenario: "A car engine will start (Q) if the key is in the ignition while the brake pedal is pressed or the start button is pressed.",
                inputs: {
                    A: "Key is in ignition",
                    B: "Brake pedal is pressed",
                    C: "Start button is pressed"
                },
                expression: "Q = A AND (B OR C)"
            },
            {
                title: "Security Camera",
                scenario: "A security camera will record (Q) if motion is detected at night or the manual recording switch is on.",
                inputs: {
                    A: "Motion is detected",
                    B: "It's nighttime",
                    C: "Manual recording switch is on"
                },
                expression: "Q = (A AND B) OR C"
            },
            {
                title: "Gym Access",
                scenario: "A gym grants access to discounted memberships (Q) only if one of the following applies: The person is under 21 and has a university ID, or they are aged 65 or older and show proof of residency.",
                inputs: {
                    A: "Under 21",
                    B: "Has university ID",
                    C: "65 or older",
                    D: "Has proof of residency"
                },
                expression: "Q = (A AND B) OR (C AND D)"
            },
            {
                title: "Library Bonus",
                scenario: "A library gives out a free bookmark (Q) when a special token is shown while borrowing either a fiction book or a non-fiction book.",
                inputs: {
                    T: "Token is shown",
                    F: "Fiction book borrowed",
                    N: "Non-fiction book borrowed"
                },
                expression: "Q = T AND (F OR N)"
            }
        ],
        3: [ // Level 3 - More wordy scenarios
            {
                title: "Server Access Control",
                scenario: "A server will let a user login (Q) if they are authenticated. Admins can login whenever but regular users can only login during business hours.",
                inputs: {
                    A: "User is authenticated",
                    B: "User is an admin",
                    C: "User is a regular user",
                    D: "It's during business hours",
                },
                expression: "Q = A AND (B OR (C AND D))"
            },
            {
                title: "Smart doorbell",
                scenario: `Smart doorbells allow people to answer their door remotely. This means the user can talk to their visitors while they are not at home, or if they are unable to answer the door in person for any other reason, such as a disability.

                Smart doorbells include a camera in addition to a doorbell. If the camera detects movement, or if the doorbell is pressed, then a notification is sent to the user's smartphone (X). An app can then be used to view the camera and to listen to or speak with the visitor.`,
                inputs: {
                    D: "Doorbell is pressed",
                    M: "Movement is detected by the camera",
                },
                expression: "X = M OR D"
            },
            {
                title: "Private Collector's Trap",
                scenario: `A private collector has received a valuable gemstone which they wish to put on display. Due to its value, the collector has proposed a trap to prevent thieves from stealing the gemstone or escaping after attempting to steal it.

                The gemstone rests on top of a pressure plate on a pedestal, surrounded by a glass case. If the glass is broken and the gemstone's weight is removed from the pressure plate, the trap is set off. A steel barrier is then lowered (L), blocking the only entrance to the room and trapping any thieves.`,
                inputs: {
                    B: "Glass case is broken",
                    W: "Weight is applied",
                },
                expression: "L = B AND (NOT W)"
            },
            {
                title: "Bank Vault Lock",
                scenario: `Bank vaults use many different types of locks to prevent theft and unauthorised access. One bank improves its security by controlling the combination lock with an electronic system, allowing the combination lock to be enabled and disabled electronically. While disabled, the vault will not open even if the correct combination is used.
                
                The combination lock is enabled (L) when two switches, located in separate rooms, are pressed. Additionally, to prevent access outside of the bank's opening hours even if the combination has been stolen, a time lock is used. This means that the combination lock is only enabled while the time lock is off as well.`,
                inputs: {
                    A: "Switch 1 is pressed",
                    B: "Switch 2 is pressed",
                    T: "Time lock is on"
                },
                expression: "L = (A AND B) AND (NOT T)"
            },
            {
                title: "Synchronised Defibrillator",
                scenario: `Defibrillators are life-saving devices which apply an electric shock to a patient to return their heartbeat to normal. In some cases, this shock must be applied at a specific time (i.e. the shock must be synchronised with the patient's heartbeat).

                When this is the case, the paddles are placed on the patient's chest and their heartbeat is monitored. Once a timing function has determined the correct moment to apply the shock, the user pushes a button on each paddle. The shock is then automatically applied (S) at the appropriate time to correct the patient's heartbeat.`,
                inputs: {
                    A: "Button on paddle 1 is not pressed",
                    B: "Button on paddle 2 is not pressed",
                    T: "Timing function is ready"
                },
                expression: "S = NOT (A AND B) AND T"
            },
            {
                title: "Flood Predictor",
                scenario: `Flooding can be predicted ahead of time, allowing those who may be affected to set up defences or to evacuate. A simple prediction uses the amount of rainfall, as well as other conditions such as river stage (the water level in the river) and soil moisture, to determine whether a flood is likely to occur.
                
                If the river stage is high, it may be close to overflowing, while if the soil moisture is high, it is unable to hold more water. High rainfall at the same time as either of these would then cause flooding (F). A prediction should therefore be made in these conditions.`,
                inputs: {
                    M: "Soil moisture is high",
                    R: "High rainfall",
                    S: "River stage is high"
                },
                expression: "F = R AND (M OR S)"
            },
            {
                title: "Eco-Friendly Reward",
                scenario: "Shoppers receive a free reusable bag (Q) if their entire purchase is environmentally friendly. They must choose a reusable item (like a bamboo toothbrush or a metal straw), select organic food, and avoid plastic packaging.",
                inputs: {
                    B: "Chosen bamboo toothbrush",
                    F: "Chosen organic fruit",
                    P: "Used plastic packaging",
                    S: "Chosen metal straw",
                },
                expression: "Q = (B OR S) AND F AND (NOT P)"
            }

        ]
    };

    const scenarioDisplay = document.getElementById('scenarioDisplay');
    const scenarios = scenarioScenarios[difficultyLevels.scenario];
    
    // Pick a random scenario from the current difficulty level
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    // Store the current expression and generate accepted answers
    currentScenario = randomScenario.expression;
    currentScenarioAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentScenario);

    // Generate the HTML for the scenario display
    let inputTableRows = '';
    for (const [input, description] of Object.entries(randomScenario.inputs)) {
        inputTableRows += `
            <tr>
                <td><strong>${input}</strong></td>
                <td>${description}</td>
            </tr>
        `;
    }
    
    // Replace newlines in scenario text with <br> for HTML display
    const scenarioHTML = `
        <div class="scenario-content">
            <h3>${randomScenario.title}</h3>
            <div class="panel bg-white panel-accent-info">
                ${randomScenario.scenario.replace(/\n/g, '<br>')}
            </div>
            
            <div class="input-table-container">
                <table class="input-table">
                    <thead>
                        <tr>
                            <th>Input</th>
                            <th>Criteria (True / False)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inputTableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    scenarioDisplay.innerHTML = scenarioHTML;
    document.getElementById('scenarioInput').value = '';
}

function checkScenarioAnswer() {
    if (answered) return;
    
    const userAnswer = document.getElementById('scenarioInput').value.trim().toUpperCase();
    
    answered = true;
    totalQuestions++;

    hideSubmitButton();

    // Use the same normalization function as the regular expression mode
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
    const isCorrect = currentScenarioAcceptedAnswers.some(acceptedAnswer => {
        const normalizedAccepted = normalizeExpression(acceptedAnswer.toUpperCase());
        return normalizedUser === normalizedAccepted;
    });
    
    if (isCorrect) {
        score++;
        showFeedback('Correct! Excellent work!', 'correct');
    } else {
        showFeedback(`Incorrect. The correct answer is: ${currentScenario}`, 'incorrect');
    }
    
    updateScoreDisplay();
    showNextButton();
}

// Handle Enter key for scenario mode input
function handleEnterKeyForScenarioMode(event) {
    if (event.key === 'Enter') {
        if (!answered) {
            checkScenarioAnswer();
        } else {
            nextQuestion();
        }
    }
}

// Truth Table Mode functionality
function setTruthTableModeDifficulty(level, clickedButton) {
    difficultyLevels.truthTable = level;

    // UPDATED: Changed selector from .difficulty-btn to .btn-select
    document.querySelectorAll('#truthTableMode .btn-select').forEach(btn => {
        btn.classList.remove('active', 'difficulty-active');
    });
    clickedButton.classList.add('active', 'difficulty-active');
    
    generateTruthTableQuestion();
    hideFeedback();

    // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitButton();
    answered = false;
}

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
            const result = { ...combination };
            
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
        answered = false;
        hideFeedback();
        showSubmitButton();
    }
}

function generateTruthTableQuestion() {
    const expressionDisplay = document.getElementById('truthTableExpression');
    const truthTableContainer = document.getElementById('truthTableContainer');
    const truthTableCircuitContainer = document.getElementById('truthTableLogicDiagramDisplay');

    // Get expressions for current difficulty level
    const expressions = expressionDatabase[`level${difficultyLevels.truthTable}`];

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
        const result = { ...combination };
        
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
    
    return { inputs, intermediateExpressions };
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
        checkExpertModeAnswer();
    } else {
        checkNormalModeAnswer();
    }
    
    updateScoreDisplay();
    showNextButton();
}

function checkNormalModeAnswer() {
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
        showFeedback('Please answer all rows in the output column (Q).', 'incorrect');
        answered = false;
        showSubmitButton();

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

function checkExpertModeAnswer() {
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
            showFeedback('Expert Mode: All fields in the truth table must be filled.', 'incorrect');
            answered = false;
            showSubmitButton();
            
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
        
        userRows.push({ rowIndex, data: userRow });
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
        showSubmitButton();
        generateExpressionQuestion();
        if (expressionHelpMode) {
            updateHelpDisplayForExpressionMode();
        }
    }
    else if (currentMode === 'scenario') {
        showSubmitButton();
        generateScenarioQuestion();
        if (scenarioHelpMode) {
            updateHelpDisplayForScenarioMode();
        }
    } else if (currentMode === 'truthTable') {
        showSubmitButton();
        generateTruthTableQuestion();
        // Reset all select elements
        document.querySelectorAll('.truth-table-select').forEach(select => {
            select.value = '';
            select.disabled = false;
            select.classList.remove('correct', 'incorrect', 'unanswered');
        });
    }  
    else if (currentMode === 'drawCircuit') {
        showSubmitButton();
        initDrawCircuitMode();
    } else {
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

    // Check if this is a simple single-gate circuit
    isSingleGateCircuit(node) {
        if (!node) return false;
        
        // Single gate: AND/OR with only variable children, or NOT with variable child
        if (node.type === 'AND' || node.type === 'OR') {
            return (node.left && node.left.type === 'VAR') && 
                   (node.right && node.right.type === 'VAR');
        } else if (node.type === 'NOT') {
            return node.operand && node.operand.type === 'VAR';
        }
        
        return false;
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
            nodeLayout.height = 60;
            
            const baseSpacing = Math.max(40, 55 - (level * 5));
            const spacing = Math.min(baseSpacing, (maxY - minY) / 4);
            
            const leftY = Math.max(minY, Math.min(maxY, y - spacing));
            const rightY = Math.max(minY, Math.min(maxY, y + spacing));
            
            nodeLayout.left = this.layoutNodes(node.left, x - 100, leftY, level + 1, y - 15);
            nodeLayout.right = this.layoutNodes(node.right, x - 100, rightY, level + 1, y + 15);
        }

        return nodeLayout;
    }

    adjustVariablePosition(varName, proposedY) {
        const minSeparation = 30;
        
        // Check if this variable already has a position assigned
        if (this.variablePositions.has(varName)) {
            return this.variablePositions.get(varName);
        }
        
        let adjustedY = proposedY;
        let conflictFound = true;
        let attempts = 0;
        const maxAttempts = 10;
        
        const minY = 40;
        const maxY = 210;
        
        while (conflictFound && attempts < maxAttempts) {
            conflictFound = false;
            attempts++;
            
            for (const [existingVar, existingY] of this.variablePositions) {
                if (Math.abs(adjustedY - existingY) < minSeparation) {
                    const moveUp = existingY - minSeparation;
                    const moveDown = existingY + minSeparation;
                    
                    if (Math.abs(moveUp - proposedY) < Math.abs(moveDown - proposedY) && moveUp >= minY) {
                        adjustedY = moveUp;
                    } else if (moveDown <= maxY) {
                        adjustedY = moveDown;
                    } else if (moveUp >= minY) {
                        adjustedY = moveUp;
                    } else {
                        adjustedY = Math.max(minY, Math.min(maxY, proposedY));
                    }
                    
                    conflictFound = true;
                    break;
                }
            }
        }
        
        adjustedY = Math.max(minY, Math.min(maxY, adjustedY));
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
        // Check for simple hardcoded cases first
        const simpleResult = this.renderSimpleCircuit(layout);
        if (simpleResult) {
            const svg = `<svg width="200" height="120" viewBox="0 0 200 120">${simpleResult}</svg>`;
            container.innerHTML = svg;
            return svg;
        }
        
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

    renderSimpleCircuit(layout) {
        if (!layout || !this.isSingleGateCircuit(layout)) {
            return null;
        }
        
        if (layout.type === 'AND' && layout.left && layout.right && 
            layout.left.type === 'VAR' && layout.right.type === 'VAR') {
            // Hardcoded AND gate
            const varA = layout.left.name;
            const varB = layout.right.name;
            return `<path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`;
        }
        
        if (layout.type === 'OR' && layout.left && layout.right && 
            layout.left.type === 'VAR' && layout.right.type === 'VAR') {
            // Hardcoded OR gate
            const varA = layout.left.name;
            const varB = layout.right.name;
            return `<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
        <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varB}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`;
        }
        
        if (layout.type === 'NOT' && layout.operand && layout.operand.type === 'VAR') {
            // Hardcoded NOT gate
            const varA = layout.operand.name;
            return `<path d="M 60 30 L 60 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/>
        <circle cx="115" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="60" x2="60" y2="60" stroke="#333" stroke-width="2"/>
        <line x1="120" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
        <text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">${varA}</text>
        <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`;
        }
        
        return null;
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
            svg += `<path d="M ${node.x - 40} ${node.y - 30} L ${node.x - 40} ${node.y + 30} L ${node.x - 15} ${node.y + 30} A 30 30 0 0 0 ${node.x - 15} ${node.y - 30} Z" fill="none" stroke="#333" stroke-width="2"/>`;
            svg += this.renderGates(node.left);
            svg += this.renderGates(node.right);
        } else if (node.type === 'OR') {
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
            return { x: node.x + 10, y: node.y };
        } else {
            return { x: node.x + 15, y: node.y };
        }
    }
}

const circuitGenerator = new CircuitGenerator();

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
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


// Code for Circuit Drawing Mode with Debug Logging
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

function addTerminals(){
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

        const centerY = inputCount > 1
            ? startY + i * spaceBetween
            : (startY + endY) / 2;

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
    console.log('🎯 ADDING EVENT LISTENERS - Starting');
    
    // Remove any existing listeners to prevent duplicates
    const canvasClone = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(canvasClone, canvas);
    canvas = canvasClone;
    ctx = canvas.getContext('2d');
    
    console.log('🎯 ADDING EVENT LISTENERS - Canvas refreshed');
    
    const toolboxGates = document.querySelectorAll('.gate[draggable="true"]');
    toolboxGates.forEach(gate => {
        gate.addEventListener('dragstart', (e) => {
            console.log('🟢 TOOLBOX DRAGSTART - Gate:', e.currentTarget.id);
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
        console.log('🟡 CANVAS DRAGOVER - DataTransfer has data:', !!e.dataTransfer.getData('text/plain'));
    });

    canvas.addEventListener('drop', (e) => {
        console.log('🔴 CANVAS DROP EVENT - Starting');
        e.preventDefault();
        
        // Guard clause to ensure drag originated from toolbox
        const dragData = e.dataTransfer.getData('text/plain');
        console.log('🔴 CANVAS DROP - Drag data:', dragData);
        
        if (!dragData) {
            console.log('🔴 CANVAS DROP - No drag data, returning early');
            return;
        }
        
        const id = dragData;
        const type = id.replace('drag-', '');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('🔴 CANVAS DROP - Adding gate:', { type, x, y, gateCount: gates.length });
        addGate(type, x, y);
        console.log('🔴 CANVAS DROP - Gate added, new count:', gates.length);
    });

    canvas.addEventListener('mousedown', (e) => {
        console.log('🔵 MOUSEDOWN - Starting', { 
            answered, 
            shiftKey: e.shiftKey, 
            button: e.button,
            detail: e.detail,
            eventType: e.type,
            timeStamp: e.timeStamp,
            currentDraggingGate: draggingGate ? draggingGate.id : 'none'
        });
        
        // Prevent multiple rapid-fire events
        if (draggingGate) {
            console.log('🔵 MOUSEDOWN - Already dragging gate, ignoring');
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        if (answered) {
            console.log('🔵 MOUSEDOWN - Already answered, returning');
            return;
        }
        
        const pos = getMousePos(e);
        console.log('🔵 MOUSEDOWN - Position:', pos);
        
        // Try to snap to a nearby node first
        const snappedNode = getClickedNode(pos) || getNearbyNode(pos);
        
        if (snappedNode) {
            console.log('🔵 MOUSEDOWN - Found snapped node, starting wire');
            wireStartNode = snappedNode;
            clearSelections();
        } else {
            // Check if clicking on a wire first
            const clickedWire = getClickedWire(pos);
            if (clickedWire) {
                console.log('🔵 MOUSEDOWN - Clicked on wire');
                clearSelections();
                selectedWire = clickedWire;
                enableRemoveSelectedButton();
                draw();
                return;
            }

            // Check if clicking on a gate
            const clickedGate = getClickedGate(pos);
            if (clickedGate) {
                console.log('🔵 MOUSEDOWN - Clicked on gate:', { gateId: clickedGate.id, shiftKey: e.shiftKey });
                
                // If shift key is held, start dragging; otherwise, select
                if (e.shiftKey) {
                    console.log('🔵 MOUSEDOWN - Starting drag mode for gate:', clickedGate.id);
                    
                    // Additional safety check
                    if (draggingGate) {
                        console.log('🔵 MOUSEDOWN - ERROR: Already have draggingGate:', draggingGate.id);
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
                    console.log('🔵 MOUSEDOWN - Selecting gate:', clickedGate.id);
                    clearSelections();
                    selectedGate = clickedGate;
                    enableRemoveSelectedButton();
                    draw();
                }
            } else {
                console.log('🔵 MOUSEDOWN - Clicked on empty space');
                disableRemoveSelectedButton();
                clearSelections();
                draw();
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (draggingGate) {
            // Only log occasionally to avoid spam
            if (Math.random() < 0.01) { // 1% chance
                console.log('🟠 MOUSEMOVE - Dragging gate:', draggingGate.id);
            }
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
        console.log('🟣 MOUSEUP - Starting', { 
            hasDraggingGate: !!draggingGate, 
            hasWireStartNode: !!wireStartNode,
            gateCount: gates.length 
        });
        
        if (wireStartNode) {
            console.log('🟣 MOUSEUP - Processing wire connection');
            const pos = getMousePos(e);
            const endNode = getClickedNode(pos) || getNearbyNode(pos);
            if (endNode && endNode !== wireStartNode && endNode.type !== wireStartNode.type) {
                console.log('🟣 MOUSEUP - Adding wire connection');
                addWire(wireStartNode, endNode);
            }
            wireStartNode = null;
        }
        
        if (draggingGate) {
            console.log('🟣 MOUSEUP - Finishing gate drag for:', draggingGate.id);
        }
        
        draggingGate = null;
        draw();
        updateInterpretedExpression();
        
        console.log('🟣 MOUSEUP - Finished, gate count:', gates.length);
    });
    
    document.getElementById('resetCircuitBtn').addEventListener('click', () => {
        console.log('🔄 RESET BUTTON CLICKED');
        if (answered) return;
        answered = false;
        disableRemoveSelectedButton();
        setupCanvas();
        draw();
    });

    // Add event listener for remove selected button
    document.getElementById('removeSelectedBtn').addEventListener('click', () => {
        console.log('🗑️ REMOVE SELECTED BUTTON CLICKED');
        removeSelected();
    });
}

function addGate(type, x, y) {
    console.log('➕ ADD GATE - Starting:', { type, x, y, currentGateCount: gates.length, nextId });
    console.log('➕ ADD GATE - gateImages:', gateImages);

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
        outputNode: { x: x + gateWidth/2, y: y, gateId: nextId-1, type: 'output', connectedTo: null }
    };

    console.log('➕ ADD GATE - Created gate object:', { id: newGate.id, type: newGate.type });

    if (type === 'NOT') {
        newGate.inputNodes.push({ x: x - gateWidth/2, y: y, gateId: newGate.id, type: 'input', index: 0, connectedTo: null });
    } else { // AND, OR
        newGate.inputNodes.push({ x: x - gateWidth/2, y: y - 10, gateId: newGate.id, type: 'input', index: 0, connectedTo: null });
        newGate.inputNodes.push({ x: x - gateWidth/2, y: y + 10, gateId: newGate.id, type: 'input', index: 1, connectedTo: null });
    }
    
    gates.push(newGate);
    console.log('➕ ADD GATE - Gate added to array, new count:', gates.length);
    console.log('➕ ADD GATE - All gate IDs:', gates.map(g => g.id));
    
    clearSelections();
    draw();
}

function addWire(startNode, endNode) {
    let fromNode = startNode.type === 'output' ? startNode : endNode;
    let toNode = startNode.type === 'input' ? startNode : endNode;
    
    wires = wires.filter(w => w.to !== toNode);
    if(toNode.connectedTo) {
        const prevFromNode = findNodeByConnectionInfo(toNode.connectedTo);
        if(prevFromNode) prevFromNode.connectedTo = null;
    }

    wires.push({ from: fromNode, to: toNode });
    fromNode.connectedTo = { gateId: toNode.gateId, nodeIndex: toNode.index, nodeType: 'input' };
    toNode.connectedTo = { gateId: fromNode.gateId, nodeIndex: fromNode.index, nodeType: 'output' };
}

function draw() {
    if(!ctx) return;
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
    // console.log('Drawing nodes for gate:', gate);
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
        console.log('🗑️ REMOVING SELECTED GATE:', selectedGate.id);
        removeGate(selectedGate);
        selectedGate = null;
        disableRemoveSelectedButton();
    } else if (selectedWire) {
        console.log('🗑️ REMOVING SELECTED WIRE');
        removeWire(selectedWire);
        selectedWire = null;
        disableRemoveSelectedButton();
    }
    draw();
    updateInterpretedExpression();
}

function removeGate(gateToRemove) {
    console.log('🗑️ REMOVE GATE - Starting removal of:', gateToRemove.id);
    console.log('🗑️ REMOVE GATE - Current gate count:', gates.length);
    
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
    
    console.log('🗑️ REMOVE GATE - Finished, new gate count:', gates.length);
    console.log('🗑️ REMOVE GATE - Remaining gate IDs:', gates.map(g => g.id));
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

// --- ANSWER CHECKING LOGIC ---

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

    const possibleAnswers = generateAllAcceptedExpressionModeAnswers(targetExpression);

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
    if (parts.length !== 2) return { output: 'Q', inputs: ['A', 'B'] }; // Default fallback

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
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
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
    const { gateId, nodeIndex, nodeType } = connection;
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
        console.log(`Found standalone gate: ${gate.type}`);
        const expression = buildExpression(gate.outputNode);
        expressionElement.textContent = expression;
    } else {
        expressionElement.textContent = '';
    }
}

function buildExpression(node) {
    console.log('buildExpression called for node:', node);

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

function setDrawCircuitModeDifficulty(level, clickedButton) {
    difficultyLevels.drawCircuit = level;

    // UPDATED: Changed selector from .difficulty-btn to .btn-select
    document.querySelectorAll('#drawCircuitMode .btn-select').forEach(btn => {
        btn.classList.remove('active', 'difficulty-active');
    });
    clickedButton.classList.add('active', 'difficulty-active');

    generateDrawCircuitQuestion();
    hideFeedback();

    // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitButton();
    answered = false;
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
    if (resetBtn){
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
    const levelKey = `level${difficultyLevels.drawCircuit}`;
    const expressions = expressionDatabase[levelKey];

    targetExpression = expressions[Math.floor(Math.random() * expressions.length)];
    document.getElementById('circuitTargetExpression').innerHTML = `<div class="expression-text">${targetExpression}</div>`;

    parsedTargetExpression = parseExpression(targetExpression);

    setupCanvas()
    draw();

}

// Help mode for circuit drawing
function toggleHelpCircuitMode() {
    circuitHelpMode = document.getElementById('showCircuitExpression').checked;
    const circuitHelpInfo = document.getElementById('circuitHelpInfo');

    if (circuitHelpMode && currentMode === 'drawCircuit') {
        circuitHelpInfo.style.display = 'block';
    } else {
        circuitHelpInfo.style.display = 'none';
    }
}