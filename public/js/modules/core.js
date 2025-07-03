/**
 * Core Module
 * Contains initialization and global variables
 */

// Global variables
const state = {
    currentPhotoId: null,
    selectedAnalysisType: null,
    selectedAnalysisValue: null,
    unsavedChanges: false,
    caseContextCollapsed: false,
    helpPanelCollapsed: true
};

// Initialize
function initializeWorkstation() {
    // Set current photo ID if photos exist
    const photoThumbs = document.querySelectorAll('.photo-thumb');
    if (photoThumbs.length > 0) {
        state.currentPhotoId = photoThumbs[0].dataset.photoId;
    }

    // Load case data
    loadCaseData();

    // Check if case context bar state is saved in localStorage
    const savedState = localStorage.getItem('caseContextCollapsed');
    if (savedState === 'true') {
        toggleCaseContext(true);
    }
    
    // Check if help panel state is saved in localStorage
    const helpPanelState = localStorage.getItem('helpPanelCollapsed');
    if (helpPanelState === 'false') {
        toggleHelpPanel(false);
    }

    // Event listeners
    initEventListeners();
}

// Export functions and variables
export {
    state,
    initializeWorkstation
};

// Import other modules
import { loadCaseData, toggleCaseContext, toggleHelpPanel } from './ui-state.js';
import { initEventListeners } from './event-handlers.js';
