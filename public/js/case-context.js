/**
 * Case Context JavaScript
 * Main entry point that imports and initializes modules
 */

// Import the core module and other necessary modules
import { initializeWorkstation } from './modules/core.js';
import { updateDeleteButtonListeners } from './modules/event-handlers.js';

// Make necessary functions available globally
window.updateDeleteButtonListeners = updateDeleteButtonListeners;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWorkstation();
});
