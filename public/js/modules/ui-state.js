/**
 * UI State Module
 * Handles UI state management (toggles, collapses, etc.)
 */

import { state } from './core.js';
import { updatePhoto } from './api-service.js';

// Load case data
function loadCaseData() {
    // First try to get the active case
    fetch('/api/case-data')
        .then(response => {
            if (!response.ok) {
                // If no specific endpoint exists, we'll fetch the whole app-data.json
                return fetch('/data/app-data.json');
            }
            return response;
        })
        .then(response => response.json())
        .then(data => {
            // Check if we have case data
            if (data.case) {
                populateCaseContext(data.case);
                
                // Add a class to the body to indicate we have an active case
                document.body.classList.add('has-active-case');
                
                // Store the active case ID in localStorage for persistence
                localStorage.setItem('activeCaseId', data.case.caseId);
            } else {
                document.body.classList.remove('has-active-case');
                localStorage.removeItem('activeCaseId');
            }
        })
        .catch(error => {
            console.error('Error loading case data:', error);
        });
}

// Populate case context
function populateCaseContext(caseData) {
    // Set case ID and date
    const caseIdElements = document.querySelectorAll('.case-id, #caseId');
    const caseDateElements = document.querySelectorAll('.case-date, #caseDate');
    
    caseIdElements.forEach(el => {
        if (el) el.textContent = caseData.caseId || 'N/A';
    });
    
    caseDateElements.forEach(el => {
        if (el) el.textContent = caseData.date || 'N/A';
    });
    
    // Set investigator name
    const investigatorElements = document.querySelectorAll('.investigator-name, #investigatorName');
    investigatorElements.forEach(el => {
        if (el) el.textContent = caseData.investigatorName || 'N/A';
    });
    
    // Set student info
    const studentNameElements = document.querySelectorAll('.student-name, #studentName');
    const studentGradeElements = document.querySelectorAll('.student-grade, #studentGrade');
    
    if (caseData.studentInfo) {
        studentNameElements.forEach(el => {
            if (el) el.textContent = caseData.studentInfo.name || 'N/A';
        });
        
        studentGradeElements.forEach(el => {
            if (el) el.textContent = caseData.studentInfo.grade || 'N/A';
        });
    } else {
        studentNameElements.forEach(el => {
            if (el) el.textContent = 'N/A';
        });
        
        studentGradeElements.forEach(el => {
            if (el) el.textContent = 'N/A';
        });
    }
    
    // Set SOC status
    const socStatusElements = document.querySelectorAll('.soc-status, #socStatus');
    socStatusElements.forEach(el => {
        if (el) el.textContent = caseData.socStatus || 'N/A';
    });
    
    // Update page title to include case ID
    document.title = `Case ${caseData.caseId} - Digital Threat Assessment Management`;
    
    // Add a visual indicator to the navigation
    const navElement = document.querySelector('nav');
    if (navElement) {
        const caseIndicator = document.createElement('div');
        caseIndicator.className = 'active-case-indicator';
        caseIndicator.innerHTML = `<span>Active Case: ${caseData.caseId}</span>`;
        
        // Remove any existing indicators
        const existingIndicator = navElement.querySelector('.active-case-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        navElement.appendChild(caseIndicator);
    }
}

// Toggle case context
function toggleCaseContext(forceCollapse) {
    const caseContextBar = document.getElementById('caseContextBar');
    const toggleText = document.querySelector('.case-context-toggle-text');
    
    if (forceCollapse === true || !caseContextBar.classList.contains('collapsed')) {
        // Collapse
        caseContextBar.classList.add('collapsed');
        state.caseContextCollapsed = true;
        if (toggleText) toggleText.textContent = 'Expand';
    } else {
        // Expand
        caseContextBar.classList.remove('collapsed');
        state.caseContextCollapsed = false;
        if (toggleText) toggleText.textContent = 'Collapse';
    }
    
    // Save state to localStorage
    localStorage.setItem('caseContextCollapsed', state.caseContextCollapsed);
}

// Show upload modal
function showUploadModal() {
    document.getElementById('fileUploadContainer').classList.add('active');
}

// Hide upload modal
function hideUploadModal() {
    document.getElementById('fileUploadContainer').classList.remove('active');
    resetUploadForm();
}

// Reset upload form
function resetUploadForm() {
    const fileUploadForm = document.getElementById('fileUploadForm');
    const selectedFileName = document.getElementById('selectedFileName');
    const uploadBtn = document.getElementById('uploadBtn');
    
    fileUploadForm.reset();
    selectedFileName.textContent = '';
    selectedFileName.classList.remove('active');
    uploadBtn.disabled = true;
}

// Show analysis modal
function showAnalysisModal() {
    const analysisModal = document.getElementById('analysisModal');
    const analysisOptions = document.getElementById('analysisOptions');
    
    analysisModal.classList.add('active');
    analysisOptions.style.display = 'grid';
    
    // Hide all detail views
    document.querySelectorAll('.analysis-detail').forEach(detail => {
        detail.classList.remove('active');
    });
}

// Hide analysis modal
function hideAnalysisModal() {
    document.getElementById('analysisModal').classList.remove('active');
    state.selectedAnalysisType = null;
    state.selectedAnalysisValue = null;
}

// Show analysis detail
function showAnalysisDetail(type) {
    state.selectedAnalysisType = type;
    
    // Hide options
    document.getElementById('analysisOptions').style.display = 'none';
    
    // Show detail view
    document.getElementById(`detail-${type}`).classList.add('active');
}

// Back to options
function backToOptions() {
    // Hide all detail views
    document.querySelectorAll('.analysis-detail').forEach(detail => {
        detail.classList.remove('active');
    });
    
    // Show options
    document.getElementById('analysisOptions').style.display = 'grid';
    
    // Reset selection
    state.selectedAnalysisType = null;
    state.selectedAnalysisValue = null;
    
    // Reset tag options
    document.querySelectorAll('.tag-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Disable apply buttons
    document.querySelectorAll('.apply-tag-btn').forEach(btn => {
        btn.disabled = true;
    });
}

// Show clear session modal
function showClearSessionModal() {
    document.getElementById('clearSessionModal').classList.add('active');
    document.getElementById('confirmDeleteInput').value = '';
    document.getElementById('confirmClearSessionBtn').disabled = true;
}

// Hide clear session modal
function hideClearSessionModal() {
    document.getElementById('clearSessionModal').classList.remove('active');
}

// Update tags
function updateTags(tags) {
    const tagsContainer = document.getElementById('tagsContainer');
    tagsContainer.innerHTML = '';
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="tag-remove" data-tag="${tag}">×</span>
        `;
        tagsContainer.appendChild(tagElement);
    });
}

// Update metadata
function updateMetadata(metadata) {
    const detailRows = document.querySelectorAll('.detail-row');
    
    if (detailRows.length >= 4 && metadata) {
        detailRows[0].querySelector('.detail-value').textContent = metadata.posted || '';
        detailRows[1].querySelector('.detail-value').textContent = metadata.likes || '0';
        detailRows[2].querySelector('.detail-value').textContent = metadata.comments || '0';
        detailRows[3].querySelector('.detail-value').textContent = metadata.engagementRate || '0%';
    }
}

// Export functions
export {
    loadCaseData,
    populateCaseContext,
    toggleCaseContext,
    showUploadModal,
    hideUploadModal,
    resetUploadForm,
    showAnalysisModal,
    hideAnalysisModal,
    showAnalysisDetail,
    backToOptions,
    showClearSessionModal,
    hideClearSessionModal,
    updateTags,
    updateMetadata
};
