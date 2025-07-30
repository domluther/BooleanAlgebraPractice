export class UIManager {
    constructor() {
        // Cache DOM elements for performance
        this.feedbackDiv = document.getElementById('feedback');
        this.nextBtn = document.getElementById('nextBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.scoreDisplay = document.getElementById('scoreDisplay');
    }

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
        if (currentMode === 'nameThatGate') {
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
     * Updates the score display text.
     * @param {number} score - The current score.
     * @param {number} totalQuestions - The total number of questions answered.
     */
    updateScoreDisplay(score, totalQuestions) {
        this.scoreDisplay.textContent = `${score}/${totalQuestions}`;
    }

    /**
     * Resets the main UI state for a new question.
     * @param {string} currentMode - The current game mode.
     */
    resetUIState(currentMode) {
        this.hideFeedback();
        this.hideNextButton();
        this.showSubmitButton(currentMode);
    }
}