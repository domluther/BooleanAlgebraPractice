// ui-setup.js
// Handles initial UI generation and setup - moved from app.js

import { difficultyLabels, appSettings, appState, setNotationType } from './config.js';

/**
 * Generates the mode selector buttons based on available game modes.
 * @param {GameManager} gameManager - The game manager instance.
 */
export function generateStaticUI(gameManager){
    generateModeSelectorButtons(gameManager);
    generateDifficultyDropdown(gameManager, gameManager.currentMode);
    setupNotationSelector(gameManager);
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
            window.location.hash = modeKey;

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
        if (gameMode === 'scenario' && i === 4) {
            option.textContent = 'A-Level'; // Special case for scenario mode level 4
        }
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

        // Handle hash-based navigation (much simpler than pushState/popstate!)
    function handleModeChange() {
        const hash = window.location.hash.slice(1); // Remove the # symbol
        const mode = hash || appSettings.defaultMode; // Default if no hash
        
        if (gameManager.modeSettings[mode]) {
            // Update active button styling
            document.querySelectorAll('.mode-selector .btn-select').forEach(btn => 
                btn.classList.remove('active', 'mode-active')
            );
            
            const activeButton = document.querySelector(`.mode-selector .btn-select[data-mode="${mode}"]`);
            if (activeButton) {
                activeButton.classList.add('active', 'mode-active');
            }
            
            // Hide all game mode containers and help sections
            document.querySelectorAll('.game-mode-container').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.help-info').forEach(el => el.style.display = 'none');
            
            // Show the relevant container for the selected mode
            const activeContainer = document.getElementById(mode + 'Mode');
            if (activeContainer) {
                activeContainer.style.display = 'block';
            }
            
            // Update game manager and difficulty dropdown
            gameManager.setGameMode(mode);
            generateDifficultyDropdown(gameManager, mode);
        }
    }

    // Listen for hash changes (back/forward buttons work automatically!)
    window.addEventListener('hashchange', handleModeChange);
    
    // Handle initial load
    handleModeChange();

    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevents default form submission or button activation

            if (gameManager.answered) {
                gameManager.nextQuestion();
            } else {
                // In 'nameThat' mode, there's no text input to submit.
                if (gameManager.currentMode !== 'nameThat') {
                    gameManager.submitAnswer();
                }
            }
        }
        // Handle number keys 1-4 for name-that mode option selection
        else if (gameManager.currentMode === 'nameThat' && ['1', '2', '3', '4'].includes(event.key)) {
            event.preventDefault(); // Prevent any default behavior
            
            const optionButtons = document.querySelectorAll('#nameThatMode .options .btn');
            const buttonIndex = parseInt(event.key) - 1; // Convert to 0-based index
            
            // Check if the button exists and is not disabled
            if (optionButtons[buttonIndex] && !optionButtons[buttonIndex].disabled) {
                optionButtons[buttonIndex].click();
            }
            return;
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
    // Set default hash if none exists
    if (!window.location.hash) {
        window.location.hash = appSettings.defaultMode;
    }
}

/**
 * Sets up the notation selector and its event listener.
 * @param {GameManager} gameManager - The game manager instance.
 */
function setupNotationSelector(gameManager) {
    const notationToggles = document.querySelectorAll('.notation-toggle-input');
    if (notationToggles.length === 0) return;

    // Set initial state based on current setting (checked = symbols, unchecked = words)
    const initialState = appState.notationType === 'symbol';
    notationToggles.forEach(toggle => {
        toggle.checked = initialState;
    });

    // Add event listener for changes to all toggles
    notationToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const newNotationType = this.checked ? 'symbol' : 'word';
            setNotationType(newNotationType);
            
            // Sync all other toggles to match this one
            notationToggles.forEach(otherToggle => {
                if (otherToggle !== this) {
                    otherToggle.checked = this.checked;
                }
            });
            
            // Refresh current question display to show new notation
            gameManager.refreshCurrentQuestionDisplay();
        });
    });
}