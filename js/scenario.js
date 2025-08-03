import { generateAllAcceptedAnswers } from './expression-utils.js';
import { CircuitDrawer } from './draw-circuit-utils.js'; // Add this at the top
import * as ttUtils from './truth-table-utils.js';

export class Scenario {
    constructor(circuitGenerator, dependencies) {
        this.circuitGenerator = circuitGenerator;
        this.circuitDrawer = null;
        this.ui = dependencies.ui;
        this.state = dependencies.state;

        this.currentExpression = '';
        this.currentAcceptedAnswers = [];
        this.currentDifficulty = 1;

        this.questionType = 'expression'; // 'expression', 'truth-table', or 'draw-circuit'
        this.currentTruthTableData = [];
        this.inputs = [];
        this.intermediateExpressions = [];

        this.helpEnabled = false;

        // Truth table options state
        this.showIntermediateColumns = false;
        this.expertMode = false;

    }

    /**
     * Initializes the scenario mode, adding event listeners and generating the first question.
     */
    initialize() {
        document.getElementById('scenarioShowIntermediate').onchange = () => {
            this.showIntermediateColumns = document.getElementById('scenarioShowIntermediate').checked;
            this._redrawTable();
        };
        document.getElementById('scenarioExpertMode').onchange = () => {
            this.expertMode = document.getElementById('scenarioExpertMode').checked;
            this._redrawTable();
        };
        this.generateQuestion();
    }

        /**
     * Handles difficulty level changes.
     * @param {number} level - The new difficulty level.
     */
    setDifficulty(level) {
        this.currentDifficulty = level;
        this.generateQuestion();
    }


    generateQuestion() {
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
    
        const scenarios = scenarioScenarios[this.currentDifficulty];
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        this.currentExpression = randomScenario.expression;
        this.currentAcceptedAnswers = generateAllAcceptedAnswers(this.currentExpression);

        // Generate the HTML for the scenario description and input table
        let inputTableRows = '';
        for (const [input, description] of Object.entries(randomScenario.inputs)) {
            inputTableRows += `<tr><td><strong>${input}</strong></td><td>${description}</td></tr>`;
        }
        const scenarioHTML = `
            <div class="scenario-content">
                <h3>${randomScenario.title}</h3>
                <div class="panel bg-white panel-accent-info">${randomScenario.scenario.replace(/\n/g, '<br>')}</div>
                <div class="input-table-container">
                    <table class="input-table">
                        <thead><tr><th>Input</th><th>Criteria (True / False)</th></tr></thead>
                        <tbody>${inputTableRows}</tbody>
                    </table>
                </div>
            </div>`;
        document.getElementById('scenarioDisplay').innerHTML = scenarioHTML;
        document.getElementById('scenarioInput').value = '';
        
        // Randomly choose a question type
        const questionTypes = ['expression', 'truth-table', 'draw-circuit'];
        this.questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

        // this.questionType = 'draw-circuit'; // Force draw-circuit for now

        // Hide all task-specific containers and options
        document.getElementById('scenarioExpressionTask').style.display = 'none';
        document.getElementById('scenarioTruthTableTask').style.display = 'none';
        document.getElementById('scenarioDrawCircuitTask').style.display = 'none';
        document.getElementById('scenarioTruthTableOptions').style.display = 'none';
        document.getElementById('scenarioHelpInfo').style.display = 'none';
        document.getElementById('drawCircuitScenarioHelpInfo').style.display = 'none';
        this.ui.showSubmitButton();

        const questionTitle = document.getElementById('scenarioQuestionTitle');

        if (this.circuitDrawer) {
            this.circuitDrawer.destroy();
            this.circuitDrawer = null;
        }

        this._setHelpMode();
        this.updateHelpDisplay();

        // Configure UI based on the chosen question type
        switch (this.questionType) {
            case 'truth-table':
                questionTitle.textContent = 'Complete the truth table for this scenario:';
                document.getElementById('scenarioTruthTableTask').style.display = 'block';
                // document.getElementById('scenarioTruthTableOptions').style.display = 'flex';
                this._generateTruthTable();
                break;

        case 'draw-circuit': // This is the new part
            questionTitle.textContent = 'Draw the logic circuit for this scenario:';
            document.getElementById('scenarioDrawCircuitTask').style.display = 'block';

            // We need a submit button for this mode
            this.ui.showSubmitButton();

            // Initialize the circuit drawer utility
            this.circuitDrawer = new CircuitDrawer('scenarioCircuitCanvas', this.ui, this.state, 'scenario');
            this.circuitDrawer.start(
                this.currentExpression, 
                document.getElementById('scenarioInterpretedExpression')
            );

            break;

            case 'expression':
            default:
                questionTitle.textContent = 'Write the Boolean expression for this scenario:';
                document.getElementById('scenarioExpressionTask').style.display = 'block';
                break;
        }   
    }

    /**
     * Routes to the correct checking logic based on the current question type.
     */
    checkAnswer() {
        if (this.state.getAnswered()) return;

        switch (this.questionType) {
            case 'expression':
                this._checkExpressionAnswer();
                break;
            case 'truth-table':
                this._checkTruthTableAnswer();
                break;
            case 'draw-circuit':
                this._checkCircuitAnswer();
                break;
        }
    }
    
        /**
     * Generates and renders the truth table using functions from the utility module.
     */
    _generateTruthTable() {
        const parsedData = ttUtils.parseExpressionForTable(this.currentExpression);
        this.inputs = parsedData.inputs;
        this.intermediateExpressions = parsedData.intermediateExpressions;

        this.currentTruthTableData = ttUtils.calculateTruthTableData(this.currentExpression, this.inputs, this.intermediateExpressions, this.showIntermediateColumns);
        const tableHTML = ttUtils.generateTableHTML(this.currentTruthTableData, this.inputs, this.intermediateExpressions, this.currentExpression, this.showIntermediateColumns, this.expertMode);

        document.getElementById('scenarioTruthTableContainer').innerHTML = tableHTML;
        this.ui.resetUIState('scenarioMode');
    }

    /**
     * Helper to redraw the table when an option (e.g., expert mode) is toggled.
     */
    _redrawTable() {
        if (this.questionType === 'truth-table') {
            this._generateTruthTable();
        }
    }

    /**
     * Checks the user's submitted Boolean expression.
     */
    _checkExpressionAnswer() {
        const userAnswer = document.getElementById('scenarioInput').value.trim().toUpperCase();
        this.state.setAnswered(true);
        this.ui.hideSubmitButton();

        const normalizeExpression = (expr) => expr.replace(/\s+/g, ' ').replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ')').replace(/\s*(AND|OR|NOT)\s*/g, ' $1 ').trim();
        const normalizedUser = normalizeExpression(userAnswer);

        const isCorrect = this.currentAcceptedAnswers.some(accepted => normalizeExpression(accepted.toUpperCase()) === normalizedUser);

        this.state.recordResult(isCorrect);
        if (isCorrect) {
            this.ui.showFeedback('Correct! Excellent work!', 'correct');
        } else {
            this.ui.showFeedback(`Incorrect. The correct answer is: ${this.currentExpression}`, 'incorrect');
        }
        this.ui.showNextButton();
    }

    /**
     * Checks the user's submitted truth table using functions from the utility module.
     */
    _checkTruthTableAnswer() {
        if (this.state.getAnswered()) return;

        this.ui.hideSubmitButton();
        const containerId = 'scenarioTruthTableContainer';
        if (this.expertMode) {
            ttUtils.checkExpertModeAnswer(this.currentTruthTableData, this.ui, this.state, containerId);
        } else {
            ttUtils.checkNormalModeAnswer(this.currentExpression, this.currentTruthTableData, this.ui, this.state, containerId);
        }
    }

    _checkCircuitAnswer() {
        const userExprText = this.circuitDrawer.getCurrentExpression();

        if (userExprText.includes('?')) {
            this.ui.showFeedback('Your circuit is not complete yet.', 'incorrect');
            return;
        }

        // Use the same accepted answers list generated for the expression question
        const isCorrect = this.currentAcceptedAnswers.some(acceptedAnswer => userExprText === acceptedAnswer);

        this.state.recordResult(isCorrect);
        if (isCorrect) {
            this.ui.showFeedback('Correct! The circuit matches the expression.', 'correct');
        } else {
            this.ui.showFeedback(`Incorrect. Your circuit (${userExprText.split('=')[1].trim()}) does not match the target expression.`, 'incorrect');
        }

        this.ui.showNextButton();
        this.ui.hideSubmitButton();
        this.state.setAnswered(true);
    }

    updateHelpDisplay() {
        let helpEnabled = false;
        
        // Determine which help mode is enabled based on question type
        if (this.questionType === 'expression') {
            const helpCheckbox = document.getElementById('scenarioExpressionHelpMode');
            helpEnabled = helpCheckbox ? helpCheckbox.checked : false;
        } else if (this.questionType === 'draw-circuit') {
            const helpCheckbox = document.getElementById('scenarioDrawCircuitHelpMode');
            helpEnabled = helpCheckbox ? helpCheckbox.checked : false;
        }
        
        this.helpEnabled = helpEnabled;
        const expressionHelpDiv = document.getElementById('scenarioHelpInfo');
        const circuitHelpDiv = document.getElementById('drawCircuitScenarioHelpInfo');

        if (!this.helpEnabled) {
            expressionHelpDiv.style.display = 'none';
            circuitHelpDiv.style.display = 'none';
            return;
        }

        if (this.questionType === 'draw-circuit') {
            expressionHelpDiv.style.display = 'none';
            circuitHelpDiv.style.display = 'inline-block';
        } else if (this.questionType === 'expression') {
            expressionHelpDiv.style.display = 'block';
            circuitHelpDiv.style.display = 'none';

            const acceptedAnswersDiv = document.getElementById('scenarioAcceptedAnswers');

            if (this.currentAcceptedAnswers && this.currentAcceptedAnswers.length > 0) {
                acceptedAnswersDiv.innerHTML = this.currentAcceptedAnswers.map(answer =>
                    `<div>${answer}</div>`
                ).join('');
            } else {
                acceptedAnswersDiv.innerHTML = '<div>No accepted answers generated</div>';
            }
        }
    }

    _setHelpMode() {
        const scenarioExpressionHelpOptions = document.getElementById('scenarioExpressionHelpOptions');
        const scenarioDrawCircuitHelpOptions = document.getElementById('scenarioDrawCircuitHelpOptions');
        const scenarioTruthTableOptions = document.getElementById('scenarioTruthTableOptions');
        
        // Hide all help options first
        scenarioExpressionHelpOptions.style.display = 'none';
        scenarioDrawCircuitHelpOptions.style.display = 'none';
        scenarioTruthTableOptions.style.display = 'none';
        
        if (this.questionType === 'draw-circuit') {
            scenarioDrawCircuitHelpOptions.style.display = 'flex';
        } else if (this.questionType === 'expression') {
            scenarioExpressionHelpOptions.style.display = 'flex';
        } else if (this.questionType === 'truth-table') {
            scenarioTruthTableOptions.style.display = 'flex';
        }
    }
}