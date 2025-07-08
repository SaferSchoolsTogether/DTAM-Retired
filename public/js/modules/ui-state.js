/**
 * UI State Module
 * Handles UI state management (toggles, collapses, etc.)
 */

import { state } from './core.js';
import { updatePhoto } from './api-service.js';

// Load case data
function loadCaseData() {
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
            }
        })
        .catch(error => {
            console.error('Error loading case data:', error);
        });
}

// Populate case context
function populateCaseContext(caseData) {
    // Set case ID and date
    document.getElementById('caseId').textContent = caseData.caseId || 'N/A';
    document.getElementById('caseDate').textContent = caseData.date || 'N/A';
    
    // Set investigator name
    document.getElementById('investigatorName').textContent = caseData.investigatorName || 'N/A';
    
    // Set student info
    if (caseData.studentInfo) {
        document.getElementById('studentName').textContent = caseData.studentInfo.name || 'N/A';
        document.getElementById('studentGrade').textContent = caseData.studentInfo.grade || 'N/A';
    } else {
        document.getElementById('studentName').textContent = 'N/A';
        document.getElementById('studentGrade').textContent = 'N/A';
    }
    
    // Set SOC status
    document.getElementById('socStatus').textContent = caseData.socStatus || 'N/A';
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
