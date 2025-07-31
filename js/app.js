import { GameManager } from './game-manager.js';
import { UIManager } from './ui-manager.js';
import { ScoreManager } from './score-manager.js';
import { SiteNavigation } from './navigation.js';
import { 
    generateModeSelectorButtons, 
    setupGlobalEventListeners, 
    initializeDefaultMode 
} from './ui-setup.js';

/**
 * Initializes the complete application.
 * @param {GameManager} gameManager - The game manager instance.
 */
function initializeApplication(gameManager) {
    // Generate static UI elements
    generateModeSelectorButtons(gameManager);
    
    // Set up global event listeners
    setupGlobalEventListeners(gameManager);
    
    // Set the initial game mode
    initializeDefaultMode();
}

// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    const navigation = new SiteNavigation();
    navigation.init();
    
    // Create core application instances with proper dependency injection
    const scoreManager = new ScoreManager('boolean-algebra-practice');
    const uiManager = new UIManager();
    const gameManager = new GameManager(uiManager, scoreManager);

    // Initialize the application
    initializeApplication(gameManager);
});