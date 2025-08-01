// ui-setup.js
// Handles initial UI generation and setup - moved from app.js

import { difficultyLabels, appSettings } from './config.js';

/**
 * Generates the mode selector buttons based on available game modes.
 * @param {GameManager} gameManager - The game manager instance.
 */
export function generateStaticUI(gameManager){
    generateModeSelectorButtons(gameManager);
    generateDifficultyDropdown(gameManager, gameManager.currentMode);
}

function generateModeSelectorButtons(gameManager) {
    const container = document.querySelector(appSettings.selectors.modeSelector);
    container.innerHTML = ''; // Clear existing buttons

    for (const [modeKey, mode] of Object.entries(gameManager.modeSettings)) {
        const button = document.createElement('button');
        button.className = appSettings.cssClasses.modeButton;
        button.dataset.mode = modeKey; // Store mode key in a data attribute
        button.innerText = mode.label;

        button.onclick = () => {
            // Update active button styling
            document.querySelectorAll('.mode-selector .btn-select').forEach(btn => 
                btn.classList.remove('active', 'mode-active')
            );
            button.classList.add('active', 'mode-active');
            
            // Hide all game mode containers and help sections
            document.querySelectorAll('.game-mode-container').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.help-info').forEach(el => el.style.display = 'none');
            
            // Show the relevant container for the selected mode
            const activeContainer = document.getElementById(modeKey + 'Mode');
            if (activeContainer) {
                activeContainer.style.display = 'block';
            }
            
            // Mode must be set before generating difficulty dropdown to get correct level
            gameManager.setGameMode(modeKey);
            generateDifficultyDropdown(gameManager, modeKey);
        };
        container.appendChild(button);
    }
}

/**
 * Generates a difficulty dropdown for a specific game mode.
 * @param {GameManager} gameManager - The game manager instance.
 * @param {string} gameMode - The current game mode key.
 */
function generateDifficultyDropdown(gameManager, gameMode) {
    const config = gameManager.modeSettings[gameMode];
    const container = document.querySelector(`#${gameMode}Mode .difficulty-section`);

    if (!config || config.levels === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    container.innerHTML = ''; // Clear previous content

    const label = document.createElement('label');
    label.className = appSettings.cssClasses.difficultyHeading;
    label.textContent = 'Difficulty:';
    label.setAttribute('for', `${gameMode}-difficulty-select`);
    container.appendChild(label);

    const select = document.createElement('select');
    select.className = appSettings.cssClasses.difficultySelect;
    select.id = `${gameMode}-difficulty-select`;

    for (let i = 1; i <= config.levels; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = difficultyLabels[i] || `Level ${i}`;
        if (i === gameManager.getCurrentDifficulty()) {
            option.selected = true; // Set the current difficulty as selected
        }
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

    // Generic help toggles
    const genericHelpCheckboxes = document.querySelectorAll('.help-toggle .help-checkbox');
    genericHelpCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => gameManager.toggleHelp());
    });

    setupScoreEventListeners(gameManager);

    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault(); // Prevents default form submission or button activation

        if (gameManager.answered) {
            gameManager.nextQuestion();
        } else {
            // In 'nameThat' mode, there's no text input to submit.
            if (gameManager.currentMode !== 'nameThat') {
                gameManager.submitAnswer();
            }
        }
    });
}

function setupScoreEventListeners(gameManager) {
    // Score button to open modal
    const scoreButton = document.getElementById('scoreButton');
    if (scoreButton) {
        scoreButton.addEventListener('click', () => {
            gameManager.uiManager.showScoreModal(gameManager.scoreManager);
        });
    }

    // Modal close buttons (both X button and Close button)
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameManager.uiManager.hideScoreModal();
        });
    });

    // Reset scores button
    const resetButton = document.querySelector('.reset-scores-btn');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all scores? This cannot be undone.')) {
                gameManager.scoreManager.resetAllScores();
                gameManager.uiManager.updateScoreButton(gameManager.scoreManager.getStatistics());
                
                // Refresh modal if it's currently open
                const modal = document.getElementById('scoreModal');
                if (modal && modal.style.display === 'flex') {
                    gameManager.uiManager.showScoreModal(gameManager.scoreManager);
                }
            }
        });
    }
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