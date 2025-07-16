/**
 * UI State Module
 * Handles UI state management (toggles, collapses, etc.)
 */

import { state } from './core.js';
import { updatePhoto } from './api-service.js';

// Load case data
function loadCaseData() {
    // Get the case ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    
    if (!caseId) {
        document.body.classList.remove('has-active-case');
        return;
    }
    
    // Fetch case data for the specific case ID
    fetch(`/api/case-data?caseId=${caseId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch case data');
            }
            return response.json();
        })
        .then(data => {
            // Check if we have case data
            if (data.case) {
                populateCaseContext(data.case);
                
                // Add a class to the body to indicate we have an active case
                document.body.classList.add('has-active-case');
                
                // Add case ID as a data attribute to the body for easy access
                document.body.dataset.caseId = data.case.caseId;
            } else {
                document.body.classList.remove('has-active-case');
                delete document.body.dataset.caseId;
            }
        })
        .catch(error => {
            console.error('Error loading case data:', error);
            document.body.classList.remove('has-active-case');
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
}

// Toggle case context panel
function toggleCaseContext(forceState) {
    const caseContextPanel = document.getElementById('caseContextPanel');
    const caseContextOverlay = document.getElementById('caseContextOverlay');
    
    if (forceState === false || (forceState === undefined && caseContextPanel.classList.contains('active'))) {
        // Close panel
        caseContextPanel.classList.remove('active');
        caseContextOverlay.classList.remove('active');
    } else {
        // Open panel
        caseContextPanel.classList.add('active');
        caseContextOverlay.classList.add('active');
        
        // Always load case data when opening the panel
        loadCaseData();
        
        // Add click event listener to the overlay to close the panel when clicked
        caseContextOverlay.addEventListener('click', function(e) {
            // Only close if the click was directly on the overlay, not on the panel
            if (e.target === caseContextOverlay) {
                toggleCaseContext();
            }
        }, { once: true }); // Use once: true to prevent multiple listeners
    }
}

// Toggle edit mode for case context
function toggleCaseContextEditMode() {
    const viewMode = document.getElementById('caseContextDetails');
    const editMode = document.getElementById('caseContextEdit');
    
    if (editMode.style.display === 'none') {
        // Switch to edit mode
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        
        // Populate form with current values
        document.getElementById('editCaseId').value = document.getElementById('caseId').textContent;
        document.getElementById('editCaseDate').value = formatDateForInput(document.getElementById('caseDate').textContent);
        document.getElementById('editInvestigatorName').value = document.getElementById('investigatorName').textContent;
        document.getElementById('editStudentName').value = document.getElementById('studentName').textContent;
        document.getElementById('editStudentGrade').value = document.getElementById('studentGrade').textContent;
        document.getElementById('editSocStatus').value = document.getElementById('socStatus').textContent;
    } else {
        // Switch back to view mode
        viewMode.style.display = 'flex';
        editMode.style.display = 'none';
    }
}

// Format date for input field (MM/DD/YYYY to YYYY-MM-DD)
function formatDateForInput(dateStr) {
    if (!dateStr || dateStr === 'N/A') return '';
    
    try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return '';
    } catch (e) {
        console.error('Error formatting date:', e);
        return '';
    }
}

// Save case context edits
function saveCaseContextEdits(e) {
    e.preventDefault();
    
    // Get form values
    const caseId = document.getElementById('editCaseId').value;
    const caseDate = document.getElementById('editCaseDate').value;
    const investigatorName = document.getElementById('editInvestigatorName').value;
    const studentName = document.getElementById('editStudentName').value;
    const studentGrade = document.getElementById('editStudentGrade').value;
    const socStatus = document.getElementById('editSocStatus').value;
    
    // Get the current case ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentCaseId = urlParams.get('caseId') || caseId;
    
    // Prepare case data
    const caseData = {
        caseId: caseId,
        date: caseDate,
        investigatorName: investigatorName,
        organization: document.getElementById('organization')?.value || 'Unknown',
        socStatus: socStatus,
        studentInfo: {
            name: studentName,
            grade: studentGrade
        }
    };
    
    // Save to server
    fetch('/api/save-case', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(caseData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save case data');
        }
        return response.json();
    })
    .then(data => {
        // Update the view mode values
        document.getElementById('caseId').textContent = caseId || 'N/A';
        document.getElementById('caseDate').textContent = caseDate ? formatDateForDisplay(caseDate) : 'N/A';
        document.getElementById('investigatorName').textContent = investigatorName || 'N/A';
        document.getElementById('studentName').textContent = studentName || 'N/A';
        document.getElementById('studentGrade').textContent = studentGrade || 'N/A';
        document.getElementById('socStatus').textContent = socStatus || 'N/A';
        
        // Switch back to view mode
        toggleCaseContextEditMode();
        
        // Show save confirmation
        const saveIndicator = document.getElementById('saveIndicator');
        if (saveIndicator) {
            saveIndicator.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Case information saved
            `;
            
            // Reset after 3 seconds
            setTimeout(() => {
                saveIndicator.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    All changes saved
                `;
            }, 3000);
        }
        
        // If case ID changed, update URL
        if (caseId !== currentCaseId) {
            // Update URL without reloading the page
            urlParams.set('caseId', caseId);
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            
            // Update body data attribute
            document.body.dataset.caseId = caseId;
        }
    })
    .catch(error => {
        console.error('Error saving case data:', error);
        alert('Failed to save case data. Please try again.');
    });
}

// Format date for display (YYYY-MM-DD to MM/DD/YYYY)
function formatDateForDisplay(dateStr) {
    if (!dateStr) return 'N/A';
    
    try {
        const date = new Date(dateStr);
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
        console.error('Error formatting date for display:', e);
        return dateStr;
    }
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
    toggleCaseContextEditMode,
    saveCaseContextEdits,
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
