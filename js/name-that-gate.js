// name-that-gate.js

export class NameThatGate {
    constructor(circuitGenerator, dependencies) {
        this.circuitGenerator = circuitGenerator;
        // Store the passed-in dependencies
        this.ui = dependencies.ui;
        this.state = dependencies.state;
        this.currentGate = '';
        this.reason = '';
    }

    /**
     * Initializes the mode, generating the answer options and the first question.
     */
    initialize() {
        this.generateOptions();
        this.generateQuestion();
        // Use the injected UI function
        this.ui.hideSubmitButton();    }

    /**
     * Creates the answer buttons ('AND', 'OR', 'NOT', 'NONE') for this mode.
     */
    generateOptions() {
        const optionsContainer = document.querySelector('#nameThatGateMode .options');
        optionsContainer.innerHTML = '';

        const gates = ['AND', 'OR', 'NOT', 'NONE'];
        gates.forEach(gate => {
            const button = document.createElement('button');
            button.classList.add('btn', 'option');
            button.textContent = gate;
            // The button now calls this class's checkAnswer method directly
            button.onclick = () => this.checkAnswer(gate);
            optionsContainer.appendChild(button);
        });
    }

    /**
     * Generates a new question by picking a random gate and rendering it.
     */
    generateQuestion() {
        const gates = ['AND', 'OR', 'NOT', 'NONE', 'NONE']; // 'NONE' is weighted higher
        this.currentGate = gates[Math.floor(Math.random() * gates.length)];

        const svgCanvas = document.getElementById('nameThatGateLogicDiagramDisplay');
        if (!svgCanvas) {
            console.error("SVG canvas element not found.");
            return;
        }

        this.reason = ''; // Reset the reason
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

        // Reset option button styles
        document.querySelectorAll('#nameThatGateMode .options .btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect', 'disabled');
        });
    }

    /**
     * Checks the user's selected answer against the correct gate.
     * @param {string} selectedAnswer - The gate name selected by the user.
     */
    checkAnswer(selectedAnswer) {
        // Use the injected state functions
        if (this.state.getAnswered()) return;
        this.state.setAnswered(true);
        const nameThatGateButtons = document.querySelectorAll('#nameThatGateMode .options .btn');

        const isCorrect = selectedAnswer === this.currentGate;
        this.state.recordResult(isCorrect);

        if (isCorrect) {
            nameThatGateButtons.forEach(btn => {
                if (btn.textContent === selectedAnswer) {
                    btn.classList.add('correct');
                }
            });
            let message = 'Correct! Well done!';
            if (this.currentGate === 'NONE') {
                message = `Correct! This is not a GCSE logic gate. ${this.reason}`;
            }
            this.ui.showFeedback(message, 'correct'); // Inject UI function
        } else {
            nameThatGateButtons.forEach(btn => {
                if (btn.textContent === selectedAnswer) {
                    btn.classList.add('incorrect');
                } else if (btn.textContent === this.currentGate) {
                    btn.classList.add('correct');
                }
            });
            let message = `Incorrect! The correct answer is ${this.currentGate}!`;
            if (this.currentGate === 'NONE') {
                message = `Incorrect! This is not a GCSE logic gate. ${this.reason}`;
            }
            this.ui.showFeedback(message, 'incorrect');
        }

        nameThatGateButtons.forEach(btn => {
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
                svg: `<circle cx="55" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/><path d="M 61 30 L 61 90 L 108 60 Z" fill="none" stroke="#333" stroke-width="2"/><line x1="30" y1="60" x2="50" y2="60" stroke="#333" stroke-width="2"/><line x1="108" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/><text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text><text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "The bubble is on the wrong side. It should be at the output."
            },
            {
                svg: `<path d="M 83 35 A 25 25 0 0 0 83 85 L 108 85 L 108 35 Z" fill="none" stroke="#333" stroke-width="2"/><line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/><line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/><line x1="108" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/><text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text><text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text><text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "It is a backwards AND gate. The curved side should be on the right."
            },
            {
                svg: `<path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/><circle cx="120" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/><line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/><line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/><line x1="125" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/><text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text><text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text><text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "The bubble makes it a NAND gate, used at A-Level."
            },
            {
                svg: `<path d="M 55 35 Q 70 60 55 85" fill="none" stroke="#333" stroke-width="2"/><path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/><line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/><line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/><line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/><text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text><text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text><text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
                reason: "The extra curved line makes it an XOR gate, used at A-Level."
            }
        ];

        const randomIndex = Math.floor(Math.random() * incorrectGates.length);
        const selectedGate = incorrectGates[randomIndex];
        this.reason = selectedGate.reason;

        return `<svg width="200" height="120" viewBox="0 0 200 120">${selectedGate.svg}</svg>`;
    }
}