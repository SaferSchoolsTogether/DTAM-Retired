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
    caseContextCollapsed: false
};

// Initialize
function initializeWorkstation() {
    // Set current photo ID if photos exist
    const photoThumbs = document.querySelectorAll('.photo-thumb');
    if (photoThumbs.length > 0) {
        state.currentPhotoId = photoThumbs[0].dataset.photoId;
    }

    // Check if case context bar state is saved in localStorage
    const savedState = localStorage.getItem('caseContextCollapsed');
    if (savedState === 'true') {
        toggleCaseContext(true);
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
import { loadCaseData, toggleCaseContext } from './ui-state.js';
import { initEventListeners } from './event-handlers.js';
