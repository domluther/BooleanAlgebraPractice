// Handles initial UI generation and setup

/**
 * Generates the mode selector buttons based on available game modes.
 * @param {GameManager} gameManager - The game manager instance.
 */
export function generateModeSelectorButtons(gameManager) {
    const container = document.getElementById('modeSelector');
    container.innerHTML = ''; // Clear existing buttons

    for (const [modeKey, mode] of Object.entries(gameManager.modeSettings)) {
        const button = document.createElement('button');
        button.className = 'btn btn-select';
        button.dataset.mode = modeKey; // Store mode key in a data attribute
        button.innerText = mode.label;

        button.onclick = () => {
            // Update active button styling
            document.querySelectorAll('.mode-selector .btn-select').forEach(btn => btn.classList.remove('active', 'mode-active'));
            button.classList.add('active', 'mode-active');
            
            // Hide all game mode containers and help sections
            document.querySelectorAll('.game-mode-container').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.help-info').forEach(el => el.style.display = 'none');
            
            // Show the relevant container for the selected mode
            const activeContainer = document.getElementById(modeKey + 'Mode');
            if (activeContainer) {
                activeContainer.style.display = 'block';
            }
            
            generateDifficultyDropdown(gameManager, modeKey);
            gameManager.setGameMode(modeKey);
        };
        container.appendChild(button);
    }
}

/**
 * Generates a difficulty dropdown for a specific game mode.
 * @param {GameManager} gameManager - The game manager instance.
 * @param {string} gameMode - The current game mode key.
 */
export function generateDifficultyDropdown(gameManager, gameMode) {
    const config = gameManager.modeSettings[gameMode];
    const container = document.querySelector(`#${gameMode}Mode .difficulty-section`);

    if (!config || config.levels === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    const levelLookup = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert' };
    container.innerHTML = ''; // Clear previous content

    const label = document.createElement('label');
    label.className = 'difficulty-heading';
    label.textContent = 'Difficulty:';
    label.setAttribute('for', `${gameMode}-difficulty-select`);
    container.appendChild(label);

    const select = document.createElement('select');
    select.className = 'difficulty-select';
    select.id = `${gameMode}-difficulty-select`;

    for (let i = 1; i <= config.levels; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = levelLookup[i] || `Level ${i}`;
        select.appendChild(option);
    }

    select.addEventListener('change', function() {
        gameManager.setDifficulty(parseInt(this.value));
    });

    container.appendChild(select);
}

/**
 * Sets up global event listeners that don't belong to specific modes.
 * @param {GameManager} gameManager - The game manager instance.
 */
export function setupGlobalEventListeners(gameManager) {
    // Main action buttons
    document.getElementById('nextBtn').addEventListener('click', () => gameManager.nextQuestion());
    document.querySelectorAll('#generateRandomBtn').forEach(btn => {
        btn.addEventListener('click', () => gameManager.nextQuestion());
    });
    document.getElementById('submitBtn').addEventListener('click', () => gameManager.submitAnswer());

    // Generic help toggles (excluding mode-specific checkboxes)
    const genericHelpCheckboxes = document.querySelectorAll('.help-toggle .help-checkbox:not(#showIntermediateColumns):not(#expertMode)');
    genericHelpCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => gameManager.toggleHelp());
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault(); // Prevents default form submission or button activation

        if (gameManager.answered) {
            gameManager.nextQuestion();
        } else {
            // In 'nameThatGate' mode, there's no text input to submit.
            if (gameManager.currentMode !== 'nameThatGate') {
                gameManager.submitAnswer();
            }
        }
    });
}

/**
 * Initializes the default game mode by clicking the first mode button.
 */
export function initializeDefaultMode() {
    const initialModeButton = document.querySelector('.mode-selector .btn-select');
    if (initialModeButton) {
        initialModeButton.click(); // Simulate a click to set the initial mode
    }
}