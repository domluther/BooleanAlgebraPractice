export class UIManager {
    constructor() {
        // Cache DOM elements for performance
        this.feedbackDiv = document.getElementById('feedback');
        this.nextBtn = document.getElementById('nextBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.scoreButton = document.getElementById('scoreButton');
        this.scoreModal = document.getElementById('scoreModal');    }

    /**
     * Displays a feedback message to the user.
     * @param {string} message - The text to display.
     * @param {string} type - The class to apply for styling ('correct' or 'incorrect').
     */
    showFeedback(message, type) {
        this.feedbackDiv.textContent = message;
        this.feedbackDiv.className = `feedback ${type}`;
        this.feedbackDiv.style.display = 'block';
    }

    /**
     * Hides the feedback message.
     */
    hideFeedback() {
        this.feedbackDiv.style.display = 'none';
    }

    /**
     * Shows the "Next Question" button.
     */
    showNextButton() {
        this.nextBtn.style.display = 'inline-block';
    }

    /**
     * Hides the "Next Question" button.
     */
    hideNextButton() {
        this.nextBtn.style.display = 'none';
    }

    /**
     * Shows the "Mark My Answer" button.
     * @param {string} currentMode - The current game mode, to check if the button should be hidden.
     */
    showSubmitButton(currentMode) {
        if (currentMode === 'nameThat') {
            this.hideSubmitButton();
            return;
        }
        this.submitBtn.style.display = 'inline-block';
    }

    /**
     * Hides the "Mark My Answer" button.
     */
    hideSubmitButton() {
        this.submitBtn.style.display = 'none';
    }

    /**
     * Resets the main UI state for a new question.
     * @param {string} currentMode - The current game mode.
     */
    resetUIState(currentMode, hideFeedback = true) {
        if (hideFeedback) {
            this.hideFeedback();
        }
        this.hideNextButton();
        this.showSubmitButton(currentMode);
    }

    updateScoreButton(stats) {
        if (!this.scoreButton) return;

        const { currentLevel } = stats;
        
        // Show current level instead of percentage
        this.scoreButton.textContent = `${currentLevel.emoji} ${currentLevel.title} (${stats.totalPoints} pts)`;
        
        // Update button class based on level
        this.scoreButton.className = 'score-button';
        if (currentLevel.threshold >= 1000) this.scoreButton.classList.add('legendary');
        else if (currentLevel.threshold >= 500) this.scoreButton.classList.add('master');
        else if (currentLevel.threshold >= 200) this.scoreButton.classList.add('advanced');
        else if (currentLevel.threshold >= 75) this.scoreButton.classList.add('intermediate');
        else this.scoreButton.classList.add('beginner');
    }

    showScoreModal(scoreManager) {
        if (!this.scoreModal) return;

        const stats = scoreManager.getStatistics();
        this.populateScoreModal(stats, scoreManager);
        this.scoreModal.style.display = 'flex';
        
        // Add click outside to close
        this.scoreModal.addEventListener('click', (e) => {
            if (e.target === this.scoreModal) {
                this.hideScoreModal();
            }
        });
    }

    // Add these methods to your UIManager class

    /**
     * Hides the score modal.
     */
    hideScoreModal() {
        if (this.scoreModal) {
            this.scoreModal.style.display = 'none';
        }
    }

    /**
     * Populates the individual scores section of the modal.
     * @param {Object} scores - The scores object from ScoreManager
     * @param {ScoreManager} scoreManager - The score manager instance for formatting
     */
    populateIndividualScores(scores, scoreManager) {
        const programList = document.getElementById('programList');
        const noScores = document.getElementById('noScores');
        if (!programList || !noScores) return;

        const scoreEntries = Object.entries(scores);
        
        if (scoreEntries.length === 0) {
            programList.style.display = 'none';
            noScores.style.display = 'block';
            return;
        }

        programList.style.display = 'block';
        noScores.style.display = 'none';

        programList.innerHTML = scoreEntries.map(([mode, score]) => {
            const accuracy = score.attempts > 0 ? Math.round((score.correct / score.attempts) * 100) : 0;
            
            return `
                <div class="program-item">
                    <div class="program-info">
                        <div class="program-name">${this.formatModeName(mode)}</div>
                        <div class="program-details">
                            ${score.attempts} attempts • ${score.correct} correct (${accuracy}%) • Best streak: ${score.bestStreak}
                        </div>
                    </div>
                    <div class="program-score">
                        <div class="score-points">${score.totalPoints} pts</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Gets display information for a score (similar to original ScoreManager).
     * @param {Object} score - Score object with bestScore property
     * @returns {Object} Display object with text and className
     */
    getScoreDisplay(score) {
        if (score.attempts === 0) {
            return { text: 'Not Attempted', className: 'score-na' };
        }

        const best = score.bestScore;
        let className = 'score-poor';
        
        // Adjust thresholds for point-based system instead of percentage
        if (best >= 50) className = 'score-excellent';      // High points
        else if (best >= 30) className = 'score-good';       // Good points  
        else if (best >= 15) className = 'score-fair';       // Fair points
        // else stays 'score-poor' for low points

        return { text: `${best} pts`, className };
    }

    /**
     * Formats mode names for display.
     * @param {string} mode - The mode key
     * @returns {string} Formatted mode name
     */
    formatModeName(mode) {
        const modeNames = {
            'nameThat': 'Name That',
            'writeExpression': 'Write Expression', 
            'truthTable': 'Truth Table',
            'drawCircuit': 'Draw Circuit',
            'scenario': 'Scenario'
        };
        return modeNames[mode] || mode;
    }

    showExpression(eleId, expression, help=false) {
        document.getElementById(eleId).innerHTML = `<div class="expression-text ${help ? 'help' : ''}">${expression}</div>`;
    }

    populateScoreModal(stats, scoreManager) {
        const { totalAttempts, totalPoints, accuracy, currentLevel, nextLevel, progressToNext, scores } = stats;
        
        // Populate level info
        const levelInfo = document.getElementById('levelInfo');
        if (levelInfo) {
            const progressHTML = nextLevel ? `
                <div class="level-progress">
                    <div class="progress-info">
                        <span>Progress to ${nextLevel.emoji} ${nextLevel.title}</span>
                        <span>${progressToNext.remaining} points needed</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressToNext.percentage}%"></div>
                    </div>
                </div>
            ` : `
                <div class="level-progress">
                    <div class="progress-info">
                        <span>🏆 Maximum level reached!</span>
                        <span>You're at the top!</span>
                    </div>
                </div>
            `;

            levelInfo.innerHTML = `
                <div class="current-level">
                    <div class="level-display">
                        <div class="level-emoji">${currentLevel.emoji}</div>
                        <div class="level-details">
                            <div class="level-title">${currentLevel.title}</div>
                            <div class="level-description">${currentLevel.description}</div>
                        </div>
                    </div>
                </div>
                ${progressHTML}
            `;
        }

        // Update overall stats
        const statGrid = document.getElementById('statGrid');
        if (statGrid) {
            statGrid.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${totalAttempts}</div>
                    <div class="stat-label">Total Attempts</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${accuracy}%</div>
                    <div class="stat-label">Overall Accuracy</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalPoints}</div>
                    <div class="stat-label">Total Points</div>
                </div>
            `;
        }

        // Populate individual scores
        this.populateIndividualScores(scores, scoreManager);
    }

}