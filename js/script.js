let score = 0;
let totalQuestions = 0;
let answered = false;
let currentMode = 'nameThatGate';

// Global variables for name that gate mode
let currentGate = '';
let gateReason = '';

// Global variables for expression writing mode
let expressionModeDifficultyLevel = 1;
let currentExpression = '';
let currentAcceptedAnswers = [];
let debugMode = false;

// Global variables for word expression mode
let wordExpressionModeDifficultyLevel = 1;
let wordDebugMode = false;
let currentWordExpression = '';
let currentWordAcceptedAnswers = [];

// Global variables for truth table mode
let truthTableModeDifficultyLevel = 1;
let showIntermediateColumns = false;
let currentTruthTableExpression = '';
let currentTruthTableData = [];
let truthTableInputs = [];
let expertMode = false;


// Updated setGameMode function to handle the new word expression mode
function setGameMode(mode, clickedButton) {
    currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.btn-select').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    // Hide all game modes
    document.getElementById('nameThatGateMode').style.display = 'none';
    document.getElementById('writeExpressionMode').style.display = 'none';
    document.getElementById('wordExpressionMode').style.display = 'none';
    document.getElementById('truthTableMode').style.display = 'none';

    // Hide debug info for all modes
    document.getElementById('debugInfo').style.display = 'none';
    document.getElementById('wordDebugInfo').style.display = 'none';
    
    // Show the selected mode
    document.getElementById(mode + 'Mode').style.display = 'block';
    
    // Reset answered state and hide feedback/buttons
    answered = false;
    hideFeedback();
    hideNextButton();
    
    // Initialize the selected mode
    if (mode === 'nameThatGate') {
        generateNameThatGateQuestion();
    } else if (mode === 'writeExpression') {
        showSubmitExpressionButton();
        generateExpressionQuestion();
        if (debugMode) {
            document.getElementById('debugInfo').style.display = 'block';
            updateDebugDisplayForExpressionMode();
        }
    } else if (mode === 'wordExpression') {
        showSubmitWordExpressionButton();
        generateWordExpressionQuestion();
        if (wordDebugMode) {
            document.getElementById('wordDebugInfo').style.display = 'block';
            updateDebugDisplayForWordExpressionMode();
        }
    } else if (mode === 'truthTable') {
        showSubmitTruthTableButton();
        generateTruthTableQuestion();
    }
}


// Name That Gate functionality
function generateNameThatGateQuestion() {
    const gates = ['AND', 'OR', 'NOT', 'NONE', 'NONE'];
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
    
    gateReason = selectedGate.reason;
    return selectedGate.svg;
    // Could be used to do this in a cleaner method without the global variable
    // return {
    //     svg: selectedGate.svg,
    //     reason: selectedGate.reason
    // };
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
        let message = 'Correct! Well done!';
        if (currentGate === 'NONE') {
            message = `Correct! This is not a GCSE logic gate. ${gateReason}`;
        }
        showFeedback(message, 'correct');
    } else {
        nameThatGateButtons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add('incorrect');
            } else if (btn.textContent === currentGate) {
                btn.classList.add('correct');
            }
        });
        let message = `Incorrect! The correct answer is ${currentGate}!`;
        if (currentGate === 'NONE') {
            message = `Incorrect! This is not a GCSE logic gate. ${gateReason}`;
        }
        showFeedback(message, 'incorrect');
    }
    
    updateScoreDisplay();
    showNextButton();
}

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
    'Q = ((A AND B) OR (C AND D)) OR E', // A + B wonky lines
    'Q = (A AND (B OR C)) AND (D OR E)', // D + E wonky lines
    'Q = ((A OR B) AND (C AND D)) OR E', // A + B wonky lines
    'Q = (A OR (B AND C)) OR (D AND E)', // D + E wonky lines - move AND down?
    'Q = (NOT (A AND B)) OR (C AND D)',
    'Q = (A AND B) AND (NOT (C OR D))',
    'Q = ((NOT A) OR B) AND (C OR (NOT D))',
    'Q = (A AND ((NOT B) OR C)) OR (D AND E)' // A overlaps NOT gate in SVG, D + E wonky lines
    ]
};


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
    document.querySelectorAll('#writeExpressionMode .difficulty-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    generateExpressionQuestion();
    hideFeedback();
    
    if (debugMode) {
        updateDebugDisplayForExpressionMode();
    }

    // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitExpressionButton();
    answered = false;
}

function generateExpressionQuestion() {
    const logicDiagramDisplay = document.getElementById('logicDiagramDisplay');
    const levelKey = `level${expressionModeDifficultyLevel}`;
    const expressions = expressionDatabase[levelKey];

    currentExpression = expressions[Math.floor(Math.random() * expressions.length)];
    circuitGenerator.generateCircuit(currentExpression, logicDiagramDisplay);
    
    currentAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentExpression);

    if (debugMode) {
        updateDebugDisplayForExpressionMode();
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

// Debug mode for word expression writing
function toggleDebugWordExpressionMode() {
    wordDebugMode = document.getElementById('wordDebugMode').checked;
    const debugInfo = document.getElementById('wordDebugInfo');
    
    if (wordDebugMode && currentMode === 'wordExpression') {
        debugInfo.style.display = 'block';
        updateDebugDisplayForWordExpressionMode();
    } else {
        debugInfo.style.display = 'none';
    }
}

function updateDebugDisplayForWordExpressionMode() {
    if (wordDebugMode) {
        const acceptedAnswersDiv = document.getElementById('wordAcceptedAnswers');
        if (currentWordAcceptedAnswers && currentWordAcceptedAnswers.length > 0) {
            acceptedAnswersDiv.innerHTML = currentWordAcceptedAnswers.map(answer => 
                `<div>${answer}</div>`
            ).join('');
        } else {
            acceptedAnswersDiv.innerHTML = '<div>No accepted answers generated</div>';
        }
    }
}

// Word Expression Mode functionality
function setWordExpressionModeDifficulty(level, clickedButton) {
    wordExpressionModeDifficultyLevel = level;
    
    // Update button states
    document.querySelectorAll('#wordExpressionMode .difficulty-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    generateWordExpressionQuestion();
    hideFeedback();
    
    if (wordDebugMode) {
        updateDebugDisplayForWordExpressionMode();
    }
        // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitWordExpressionButton();
    answered = false;
}

function generateWordExpressionQuestion() {
    const wordExpressionScenarios = {
        1: [ // Level 1 - Simple AND/OR scenarios
            {
                title: "Door Access",
                scenario: "A secure door will only unlock if the person has a valid ID badge AND knows the correct passcode.",
                inputs: {
                    A: "Person has a valid ID badge",
                    B: "Person knows the correct passcode"
                },
                expression: "Q = A AND B"
            },
            {
                title: "Alarm System",
                scenario: "A burglar alarm will trigger if either a door is opened OR a window is opened.",
                inputs: {
                    A: "Door is opened",
                    B: "Window is opened"
                },
                expression: "Q = A OR B"
            },
            {
                title: "Computer Login",
                scenario: "A computer will allow login if the user enters the correct username AND the correct password.",
                inputs: {
                    A: "Correct username entered",
                    B: "Correct password entered"
                },
                expression: "Q = A AND B"
            },
            {
                title: "Emergency Exit",
                scenario: "An emergency exit will open if either the fire alarm is activated OR the manual override is pressed.",
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
                scenario: "A bank vault will open only if all three conditions are met: the manager's key is turned, the correct code is entered, and biometric scan passes.",
                inputs: {
                    A: "Manager's key is turned",
                    B: "Correct code is entered",
                    C: "Biometric scan passes"
                },
                expression: "Q = A AND B AND C"
            },
            {
                title: "Emergency Shutdown",
                scenario: "A nuclear reactor will shut down if any of these conditions occur: temperature exceeds safe limit, pressure exceeds safe limit, or the emergency button is pressed.",
                inputs: {
                    A: "Temperature exceeds safe limit",
                    B: "Pressure exceeds safe limit",
                    C: "Emergency button is pressed"
                },
                expression: "Q = A OR B OR C"
            },
            {
                title: "Car Engine Start",
                scenario: "A car engine will start if the key is in the ignition AND either the brake pedal is pressed OR the car is in park mode.",
                inputs: {
                    A: "Key is in ignition",
                    B: "Brake pedal is pressed",
                    C: "Car is in park mode"
                },
                expression: "Q = A AND (B OR C)"
            },
            {
                title: "Security Camera",
                scenario: "A security camera will record if motion is detected AND either it's nighttime OR the manual recording switch is on.",
                inputs: {
                    A: "Motion is detected",
                    B: "It's nighttime",
                    C: "Manual recording switch is on"
                },
                expression: "Q = A AND (B OR C)"
            }
        ],
        3: [ // Level 3 - Complex scenarios with NOT gates and mixed logic
            {
                title: "Server Access Control",
                scenario: "A server will grant access if the user is authenticated AND either they are an admin OR (they are a regular user AND it's during business hours AND the system is not in maintenance mode).",
                inputs: {
                    A: "User is authenticated",
                    B: "User is an admin",
                    C: "User is a regular user",
                    D: "It's during business hours",
                    E: "System is in maintenance mode"
                },
                expression: "Q = A AND (B OR (C AND D AND NOT E))"
            },
            {
                title: "Automated Sprinkler System",
                scenario: "A sprinkler system will activate if fire is detected AND the system is not disabled AND either (it's an automatic system) OR (it's manual mode AND the override button is pressed).",
                inputs: {
                    A: "Fire is detected",
                    B: "System is disabled",
                    C: "It's an automatic system",
                    D: "It's manual mode",
                    E: "Override button is pressed"
                },
                expression: "Q = A AND NOT B AND (C OR (D AND E))"
            },
            {
                title: "Smart Home Lighting",
                scenario: "Smart lights will turn on if it's dark AND either (motion is detected AND the house is not in sleep mode) OR the manual switch is pressed.",
                inputs: {
                    A: "It's dark",
                    B: "Motion is detected",
                    C: "House is in sleep mode",
                    D: "Manual switch is pressed"
                },
                expression: "Q = A AND ((B AND NOT C) OR D)"
            }
        ]
    };

    const scenarioDisplay = document.getElementById('scenarioDisplay');
    const scenarios = wordExpressionScenarios[wordExpressionModeDifficultyLevel];
    
    // Pick a random scenario from the current difficulty level
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    // Store the current expression and generate accepted answers
    currentWordExpression = randomScenario.expression;
    currentWordAcceptedAnswers = generateAllAcceptedExpressionModeAnswers(currentWordExpression);
    
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
    
    const scenarioHTML = `
        <div class="scenario-content">
            <h3>${randomScenario.title}</h3>
            <p class="scenario-description">${randomScenario.scenario}</p>
            
            <div class="input-table-container">
                <h4>Input Criteria (True / False)</h4>
                <table class="input-table">
                    <thead>
                        <tr>
                            <th>Input</th>
                            <th>Criteria</th>
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
    document.getElementById('wordExpressionInput').value = '';
}

function checkWordExpressionAnswer() {
    if (answered) return;
    
    const userAnswer = document.getElementById('wordExpressionInput').value.trim().toUpperCase();
    
    answered = true;
    totalQuestions++;

    hideSubmitWordExpressionButton();

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
    const isCorrect = currentWordAcceptedAnswers.some(acceptedAnswer => {
        const normalizedAccepted = normalizeExpression(acceptedAnswer.toUpperCase());
        return normalizedUser === normalizedAccepted;
    });
    
    if (isCorrect) {
        score++;
        showFeedback('Correct! Excellent work!', 'correct');
    } else {
        showFeedback(`Incorrect. The correct answer is: ${currentWordExpression}`, 'incorrect');
    }
    
    updateScoreDisplay();
    showNextButton();
}

// Handle Enter key for word expression input
function handleEnterKeyForWordExpressionMode(event) {
    if (event.key === 'Enter') {
        checkWordExpressionAnswer();
    }
}

// Button visibility functions for word expression mode
function showSubmitWordExpressionButton() {
    document.getElementById('submitWordExpressionBtn').style.display = 'inline-block';
}

function hideSubmitWordExpressionButton() {
    document.getElementById('submitWordExpressionBtn').style.display = 'none';
}

// Truth Table Mode functionality
function setTruthTableModeDifficulty(level, clickedButton) {
    truthTableModeDifficultyLevel = level;
    
    // Update button states
    document.querySelectorAll('#truthTableMode .difficulty-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    
    generateTruthTableQuestion();
    hideFeedback();

    // Show submit button and hide next button when changing difficulty
    hideNextButton();
    showSubmitTruthTableButton();
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
        showSubmitTruthTableButton();
    }
}

function generateTruthTableQuestion() {
    const expressionDisplay = document.getElementById('truthTableExpression');
    const truthTableContainer = document.getElementById('truthTableContainer');
    const truthTableCircuitContainer = document.getElementById('truthTableLogicDiagramDisplay');

    // Get expressions for current difficulty level
    const expressions = expressionDatabase[`level${truthTableModeDifficultyLevel}`];
    
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
    
    hideSubmitTruthTableButton();
    
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
        showSubmitTruthTableButton();
        
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
            showSubmitTruthTableButton();
            
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

// Button visibility functions for truth table mode
function showSubmitTruthTableButton() {
    document.getElementById('submitTruthTableBtn').style.display = 'inline-block';
}

function hideSubmitTruthTableButton() {
    document.getElementById('submitTruthTableBtn').style.display = 'none';
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
    else if (currentMode === 'wordExpression') {
        showSubmitWordExpressionButton();
        generateWordExpressionQuestion();
        if (wordDebugMode) {
            updateDebugDisplayForWordExpressionMode();
        }
    } else if (currentMode === 'truthTable') {
        showSubmitTruthTableButton();
        generateTruthTableQuestion();
        
        // Reset all select elements
        document.querySelectorAll('.truth-table-select').forEach(select => {
            select.value = '';
            select.disabled = false;
            select.classList.remove('correct', 'incorrect', 'unanswered');
        });
    }  else {
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
    generateNameThatGateQuestion();
    updateScoreDisplay();
});