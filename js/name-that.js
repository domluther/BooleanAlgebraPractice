import {expressionDatabase} from './data.js';
import { evaluateExpression, getInputVariables } from './expression-utils.js';

export class NameThat {
    constructor(circuitGenerator, dependencies) {
        this.circuitGenerator = circuitGenerator;
        // Store the passed-in dependencies
        this.ui = dependencies.ui;
        this.state = dependencies.state;
        this.currentGate = '';
        this.reason = '';
        this.currentDifficulty = 1;
        this.correctExpression = ''; // for level 2
    }

    /**
     * Initializes the mode, generating the answer options and the first question.
     */
    initialize() {
        this.generateQuestion();
        // Use the injected UI function
        this.ui.hideSubmitButton();    }

    /**
     * Handles difficulty level changes.
     * @param {number} level - The new difficulty level.
     */
    setDifficulty(level) {
        this.currentDifficulty = level;
        this.generateQuestion();
    }

    /**
     * Creates the answer buttons for this mode.
    */
    generateOptions(labels) {
        const optionsContainer = document.querySelector('#nameThatMode .options');
        optionsContainer.innerHTML = '';

        labels.forEach((label, index) => {
            const button = document.createElement('button');
            button.classList.add('btn', 'option');
            
            // Create the shortcut span
            const shortcutSpan = document.createElement('span');
            shortcutSpan.classList.add('shortcut');
            shortcutSpan.textContent = (index + 1).toString(); // 1, 2, 3, 4
            
            // Add the shortcut span and label text to the button
            button.appendChild(shortcutSpan);
            button.appendChild(document.createTextNode(' ' + label));
            
            button.onclick = () => this.checkAnswer(label);
            optionsContainer.appendChild(button);
        });
    }

    /**
     * Generates a new question by picking a random gate and rendering it.
     */
    generateQuestion() {
        const questionTitle = document.getElementById('nameThatQuestionTitle');
        const displayArea = document.getElementById('nameThatLogicDiagramDisplay');
        displayArea.innerHTML = ''; // Clear previous content

        if (this.currentDifficulty === 1) {
            questionTitle.textContent = 'Name that GCSE logic gate';
            this._generateLevel1Question();
        } else if (this.currentDifficulty === 2) {
            questionTitle.textContent = 'Name that logic expression';
            this._generateLevel2Question();
        } else { // Level 3
            questionTitle.textContent = 'Name that truth table';
            this._generateLevel3Question();
        }

        document.querySelectorAll('#nameThatMode .options .btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect', 'disabled');
        });
    }

    _generateLevel1Question() {
        const gates = ['AND', 'OR', 'NOT', 'NONE', 'NONE'];
        this.currentGate = gates[Math.floor(Math.random() * gates.length)];
        const svgCanvas = document.getElementById('nameThatLogicDiagramDisplay');
        this.reason = '';

        switch (this.currentGate) {
            case 'AND':
                this.circuitGenerator.generateCircuit('Q = A AND B', svgCanvas);
                break;
            case 'OR':
                this.circuitGenerator.generateCircuit('Q = A OR B', svgCanvas);
                break;
            case 'NOT':
                this.circuitGenerator.generateCircuit('Q = NOT A', svgCanvas);
                break;
            case 'NONE':
                svgCanvas.innerHTML = this._drawInvalidGate();
                break;
        }
        this.generateOptions(['AND', 'OR', 'NOT', 'NONE']);
    }

    // TODO - expressionDatabase contains questions with commutation which is problematic here ie Q = A AND B is the same as Q = B AND A but one would be marked wrong
    _generateLevel2Question() {
        const svgCanvas = document.getElementById('nameThatLogicDiagramDisplay');
        svgCanvas.innerHTML = ''; // Ensure cleared at start
        const expressions = expressionDatabase.level2NoOverlap;

        this.correctExpression = expressions[Math.floor(Math.random() * expressions.length)];
        this.circuitGenerator.generateCircuit(this.correctExpression, svgCanvas);

        const options = [this.correctExpression];
        const otherExpressions = expressions.filter(expr => expr !== this.correctExpression);

        while (options.length < 4 && otherExpressions.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherExpressions.length);
            options.push(otherExpressions.splice(randomIndex, 1)[0]);
        }

        // Shuffle the options so the correct answer isn't always first
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        this.generateOptions(options);
    }

    _generateLevel3Question() {
        const displayArea = document.getElementById('nameThatLogicDiagramDisplay');
        const expressions = [...expressionDatabase.level2NoOverlap]; // Use more complex expressions

        // 1. Select a correct expression
        this.correctExpression = expressions[Math.floor(Math.random() * expressions.length)];

        // 2. Generate and display the truth table for it
        displayArea.innerHTML = this._generateStaticTableHTML(this.correctExpression);

        // 3. Get 3 other unique random expressions for options
        const options = [this.correctExpression];
        const otherExpressions = expressions.filter(expr => expr !== this.correctExpression);
        while (options.length < 4 && otherExpressions.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherExpressions.length);
            const randomExpression = otherExpressions.splice(randomIndex, 1)[0];
            options.push(randomExpression);
        }

        // 4. Shuffle options and generate buttons
        // Shuffle the options so the correct answer isn't always first
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        this.generateOptions(options);
}

    /**
     * Checks the user's selected answer against the correct answer.
     * @param {string} selectedAnswer - The answer selected by the user.
     */
    checkAnswer(selectedAnswer) {
        if (this.state.getAnswered()) return;
        this.state.setAnswered(true);

        const isLevel1 = this.currentDifficulty === 1;
        const correctAnswer = isLevel1 ? this.currentGate : this.correctExpression;
        const isCorrect = selectedAnswer === correctAnswer;

        this.state.recordResult(isCorrect);

        let feedbackMessage;

        // Handle feedback messages
        if (isCorrect) {
            feedbackMessage = 'Correct! Well done!';
            // Provide specific reason if the 'NONE' answer is correctly identified in Level 1
            if (isLevel1 && correctAnswer === 'NONE') {
                feedbackMessage = `Correct! This is not a GCSE logic gate. ${this.reason}`;
            }
        } else {
            feedbackMessage = `Incorrect! The correct answer is ${correctAnswer}!`;
            // Provide specific reason if the 'NONE' answer is incorrectly identified in Level 1
            if (isLevel1 && correctAnswer === 'NONE') {
                feedbackMessage = `Incorrect! This is not a GCSE logic gate. ${this.reason}`;
            }
        }

        this.ui.showFeedback(feedbackMessage, isCorrect ? 'correct' : 'incorrect');

        // Update button styles to show correct/incorrect answers
        const optionButtons = document.querySelectorAll('#nameThatMode .options .btn');
        optionButtons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.textContent === selectedAnswer) {
                btn.classList.add('incorrect');
            }
            btn.disabled = true;
            btn.classList.add('disabled');
        });

        this.ui.showNextButton();
    }

    /**
     * Generates and returns the SVG for an invalid or non-GCSE gate.
     * @private
     */
    _drawInvalidGate() {
        const incorrectGates = [{
                svg: `<circle cx="65" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 71 30 L 71 90 L 120 60 Z" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="60" x2="60" y2="60" stroke="#333" stroke-width="2"/>
                <line x1="120" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "The bubble is on the wrong side of this NOT gate. It should be at the output."
            },
            {
                svg: `<path d="M 86 35 A 25 25 0 0 0 86 85 L 113 85 L 113 35 Z" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="50" x2="63" y2="50" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="70" x2="63" y2="70" stroke="#333" stroke-width="2"/>
                <line x1="113" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "It is a backwards AND gate. The curved side should be on the right."
            },
            {
                svg: `<path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
                <circle cx="120" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
                <line x1="125" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "The bubble makes it a NAND gate - an AND followed by a NOT."
            },
            {
                svg: `<path d="M 55 35 Q 70 60 55 85" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
                <line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
                <line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
                <text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
                <text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
                <text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "The extra curved line makes it an XOR gate, used at A-Level."
            }
        ];

        const randomIndex = Math.floor(Math.random() * incorrectGates.length);
        const selectedGate = incorrectGates[randomIndex];
        this.reason = selectedGate.reason;

        return `<svg width="200" height="120" viewBox="0 0 200 120">${selectedGate.svg}</svg>`;
    }

        /**
     * Generates and returns the HTML for a static, completed truth table.
     * @param {string} expression - The expression to build the table for.
     * @returns {string} The complete HTML string for the table.
     * @private
     */
    _generateStaticTableHTML(expression) {
        const inputs = getInputVariables(expression);
        const outputVariable = expression.split(' = ')[0].trim();
        const expressionBody = expression.split(' = ')[1];
        const numCombinations = 2 ** inputs.length;

        let tableHTML = '<table class="truth-table"><thead><tr>';
        inputs.forEach(input => tableHTML += `<th class="input-header">${input}</th>`);
        tableHTML += `<th class="output-header">${outputVariable}</th></tr></thead><tbody>`;

        for (let i = 0; i < numCombinations; i++) {
            const combination = {};
            const rowValues = {};
            tableHTML += '<tr>';
            for (let j = 0; j < inputs.length; j++) {
                const inputName = inputs[j];
                const value = Boolean((i >> (inputs.length - 1 - j)) & 1);
                combination[inputName] = value;
                rowValues[inputName] = value ? 1 : 0;
                tableHTML += `<td class="input-cell">${rowValues[inputName]}</td>`;
            }

            const outputValue = evaluateExpression(expressionBody, combination);
            tableHTML += `<td class="output-cell">${outputValue ? 1 : 0}</td>`;
            tableHTML += '</tr>';
        }

        tableHTML += '</tbody></table>';
        return tableHTML;
    }
}