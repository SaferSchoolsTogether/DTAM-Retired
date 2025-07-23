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
    threatId: null // Added for multi-SOC threat system
};

// Initialize
function initializeWorkstation() {
    // Set current photo ID if photos exist
    const photoThumbs = document.querySelectorAll('.photo-thumb');
    if (photoThumbs.length > 0) {
        state.currentPhotoId = photoThumbs[0].dataset.photoId;
    }
    
    // Get threat ID from body data attribute if available
    const threatId = document.body.dataset.threatId;
    if (threatId) {
        state.threatId = threatId;
        console.log('Initialized with threat ID:', threatId);
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
