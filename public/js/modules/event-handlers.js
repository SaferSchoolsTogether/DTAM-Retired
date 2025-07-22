/**
 * Event Handlers Module
 * Handles event binding and handling
 */

import { state } from './core.js';
import { 
    showUploadModal, 
    hideUploadModal, 
    showAnalysisModal, 
    hideAnalysisModal, 
    showAnalysisDetail, 
    backToOptions, 
    showClearSessionModal, 
    hideClearSessionModal,
    toggleCaseContext,
    toggleCaseContextEditMode,
    saveCaseContextEdits,
    togglePlatformProfile
} from './ui-state.js';
import { 
    getPlatformName,
    updatePhoto, 
    updatePhotoView, 
    handleUpload, 
    deletePhoto, 
    clearSession, 
    saveProgress, 
    previewReport, 
    generateReport 
} from './api-service.js';

// Initialize event listeners
function initEventListeners() {
    // DOM Elements
    const addPhotosBtn = document.getElementById('addPhotosBtn');
    const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
    const fileUploadContainer = document.getElementById('fileUploadContainer');
    const closeUploadBtn = document.getElementById('closeUploadBtn');
    const fileDropArea = document.getElementById('fileDropArea');
    const fileInput = document.getElementById('fileInput');
    const selectedFileName = document.getElementById('selectedFileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileUploadForm = document.getElementById('fileUploadForm');
    const photoGrid = document.getElementById('photoGrid');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analysisModal = document.getElementById('analysisModal');
    const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
    const analysisOptions = document.getElementById('analysisOptions');
    const backToOptionsBtns = document.querySelectorAll('[id^="backToOptionsBtn"]');
    const tagOptions = document.querySelectorAll('.tag-option');
    const applyTagBtns = document.querySelectorAll('[id^="apply"][id$="Btn"]');
    const addTagInput = document.getElementById('addTagInput');
    const tagsContainer = document.getElementById('tagsContainer');
    const notesTextarea = document.getElementById('notesTextarea');
    const saveProgressBtn = document.getElementById('saveProgressBtn');
    const previewReportBtn = document.getElementById('previewReportBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const saveIndicator = document.getElementById('saveIndicator');
    const currentImage = document.getElementById('currentImage');
    const progressIndicator = document.getElementById('progressIndicator');
    const clearSessionBtn = document.getElementById('clearSessionBtn');
    const clearSessionModal = document.getElementById('clearSessionModal');
    const closeClearSessionBtn = document.getElementById('closeClearSessionBtn');
    const confirmDeleteInput = document.getElementById('confirmDeleteInput');
    const confirmClearSessionBtn = document.getElementById('confirmClearSessionBtn');
    const caseContextToggle = document.getElementById('caseContextToggle');
    
    // Case context panel toggle
    const caseContextToggleBtn = document.getElementById('caseContextToggleBtn');
    if (caseContextToggleBtn) {
        caseContextToggleBtn.addEventListener('click', toggleCaseContext);
    }
    
    // Case context close button
    const caseContextCloseBtn = document.getElementById('caseContextCloseBtn');
    if (caseContextCloseBtn) {
        caseContextCloseBtn.addEventListener('click', function() {
            toggleCaseContext(false);
        });
    }
    
    // Case context overlay (click to close)
    const caseContextOverlay = document.getElementById('caseContextOverlay');
    if (caseContextOverlay) {
        caseContextOverlay.addEventListener('click', function(e) {
            // Only close if the click was directly on the overlay, not on the panel
            if (e.target === caseContextOverlay) {
                toggleCaseContext(false);
            }
        });
    }
    
    // Platform profile panel toggle
    const platformInfoToggleBtn = document.getElementById('platformInfoToggleBtn');
    if (platformInfoToggleBtn) {
        platformInfoToggleBtn.addEventListener('click', togglePlatformProfile);
    }
    
    // Platform profile close button
    const platformProfileCloseBtn = document.getElementById('platformProfileCloseBtn');
    if (platformProfileCloseBtn) {
        platformProfileCloseBtn.addEventListener('click', togglePlatformProfile);
    }
    
    // Platform profile overlay (click to close)
    const platformProfileOverlay = document.getElementById('platformProfileOverlay');
    if (platformProfileOverlay) {
        platformProfileOverlay.addEventListener('click', togglePlatformProfile);
    }
    
    // Case context edit button
    const caseContextEditBtn = document.getElementById('caseContextEditBtn');
    if (caseContextEditBtn) {
        caseContextEditBtn.addEventListener('click', toggleCaseContextEditMode);
    }
    
    // Case context cancel edit button
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', toggleCaseContextEditMode);
    }
    
    // Case context save edit form
    const caseEditForm = document.getElementById('caseEditForm');
    if (caseEditForm) {
        caseEditForm.addEventListener('submit', saveCaseContextEdits);
    }

    // Photo upload
    if (addPhotosBtn) addPhotosBtn.addEventListener('click', showUploadModal);
    if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', showUploadModal);
    if (closeUploadBtn) closeUploadBtn.addEventListener('click', hideUploadModal);
    if (fileDropArea) {
        fileDropArea.addEventListener('click', () => fileInput.click());
        fileDropArea.addEventListener('dragover', handleDragOver);
        fileDropArea.addEventListener('dragleave', handleDragLeave);
        fileDropArea.addEventListener('drop', handleDrop);
    }
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (fileUploadForm) fileUploadForm.addEventListener('submit', handleUpload);

    // Photo selection and delete
    if (photoGrid) {
        // Initial setup of delete button listeners
        updateDeleteButtonListeners();
        
        // Handle photo selection
        photoGrid.addEventListener('click', (e) => {
            // Skip if clicking on delete button (handled separately)
            if (e.target.classList.contains('photo-delete-btn')) {
                return;
            }
            
            // Handle photo selection
            const photoThumb = e.target.closest('.photo-thumb');
            if (photoThumb) {
                selectPhoto(photoThumb);
            }
        });
    }

    // Analysis modal
    if (analyzeBtn) analyzeBtn.addEventListener('click', showAnalysisModal);
    if (closeAnalysisBtn) closeAnalysisBtn.addEventListener('click', hideAnalysisModal);
    
    // Analysis options
    const analysisOptionElements = document.querySelectorAll('.analysis-option');
    analysisOptionElements.forEach(option => {
        option.addEventListener('click', () => {
            const analysisType = option.dataset.analysis;
            showAnalysisDetail(analysisType);
        });
    });

    // Back buttons
    backToOptionsBtns.forEach(btn => {
        btn.addEventListener('click', backToOptions);
    });

    // Tag options
    tagOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectTagOption(option);
        });
    });

    // Apply tag buttons
    applyTagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyAnalysisTag();
        });
    });

    // Add tag input
    if (addTagInput) {
        addTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && addTagInput.value.trim()) {
                addTag(addTagInput.value.trim());
                addTagInput.value = '';
            }
        });
    }

    // Remove tag
    if (tagsContainer) {
        tagsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                removeTag(e.target.parentElement);
            }
        });
    }

    // Notes textarea
    if (notesTextarea) {
        notesTextarea.addEventListener('input', () => {
            saveNotes(notesTextarea.value);
        });
    }

    // Save progress
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', saveProgress);
    }

    // Preview report
    if (previewReportBtn) {
        previewReportBtn.addEventListener('click', previewReport);
    }

    // Generate report
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }

    // Clear Session
    if (clearSessionBtn) {
        clearSessionBtn.addEventListener('click', showClearSessionModal);
    }

    if (closeClearSessionBtn) {
        closeClearSessionBtn.addEventListener('click', hideClearSessionModal);
    }

    if (confirmDeleteInput) {
        confirmDeleteInput.addEventListener('input', function() {
            confirmClearSessionBtn.disabled = this.value !== 'DELETE';
        });
    }

    if (confirmClearSessionBtn) {
        confirmClearSessionBtn.addEventListener('click', clearSession);
    }
    
    // Profile info fields
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const profileUrlInput = document.getElementById('profileUrl');
    
    // Add event listeners for profile info fields
    if (usernameInput) {
        usernameInput.addEventListener('change', function() {
            saveProfileInfo();
        });
    }
    
    if (displayNameInput) {
        displayNameInput.addEventListener('change', function() {
            saveProfileInfo();
        });
    }
    
    if (profileUrlInput) {
        profileUrlInput.addEventListener('change', function() {
            saveProfileInfo();
        });
    }
}

// Update delete button listeners
function updateDeleteButtonListeners() {
    document.querySelectorAll('.photo-delete-btn').forEach(btn => {
        // Remove any existing listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add direct click event listener
        newBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent photo selection
            e.preventDefault();
            
            const photoThumb = this.closest('.photo-thumb');
            if (photoThumb) {
                const photoId = photoThumb.dataset.photoId;
                const isActive = photoThumb.classList.contains('active');
                
                if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
                    deletePhoto(photoId, photoThumb, isActive);
                }
            }
        });
    });
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('fileDropArea').classList.add('highlight');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('fileDropArea').classList.remove('highlight');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('fileDropArea').classList.remove('highlight');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // Only use the first file if multiple files are dropped
        const fileList = new DataTransfer();
        fileList.items.add(files[0]);
        document.getElementById('fileInput').files = fileList.files;
        updateSelectedFileInfo(files[0]);
    }
}

// Handle file select
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        updateSelectedFileInfo(files[0]);
    }
}

// Update selected file info
function updateSelectedFileInfo(file) {
    const selectedFileName = document.getElementById('selectedFileName');
    const uploadBtn = document.getElementById('uploadBtn');
    
    selectedFileName.textContent = file.name;
    selectedFileName.classList.add('active');
    uploadBtn.disabled = false;
}

// Select photo
function selectPhoto(photoThumb) {
    // Remove active class from all thumbnails
    document.querySelectorAll('.photo-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    
    // Add active class to selected thumbnail
    photoThumb.classList.add('active');
    
    // Get photo ID
    state.currentPhotoId = photoThumb.dataset.photoId;
    
    // Update UI
    updatePhotoView();
}

// Select tag option
function selectTagOption(option) {
    // Clear other selections in this category
    const options = option.closest('.tag-option-grid').querySelectorAll('.tag-option');
    options.forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select this option
    option.classList.add('selected');
    state.selectedAnalysisValue = option.dataset.value;
    
    // Enable apply button
    const applyBtn = option.closest('.tag-options').querySelector('.apply-tag-btn');
    applyBtn.disabled = false;
}

// Apply analysis tag
function applyAnalysisTag() {
    if (!state.currentPhotoId || !state.selectedAnalysisType || !state.selectedAnalysisValue) return;
    
    const tagsContainer = document.getElementById('tagsContainer');
    
    const analysisTags = {};
    analysisTags[state.selectedAnalysisType] = state.selectedAnalysisValue;
    
    // Update photo
    updatePhoto({ analysisTags });
    
    // Add tag to UI
    const tagElement = document.createElement('span');
    tagElement.className = 'tag analysis-tag';
    tagElement.textContent = `${state.selectedAnalysisType.replace(/-/g, ' ')}: ${state.selectedAnalysisValue}`;
    tagsContainer.appendChild(tagElement);
    
    // Update photo status
    const photoThumb = document.querySelector(`.photo-thumb[data-photo-id="${state.currentPhotoId}"]`);
    if (photoThumb) {
        const photoStatus = photoThumb.querySelector('.photo-status');
        photoStatus.classList.add('analyzed');
        photoStatus.textContent = '✓';
    }
    
    // Hide modal
    hideAnalysisModal();
}

// Add tag
function addTag(tag) {
    if (!tag) return;
    
    const tagsContainer = document.getElementById('tagsContainer');
    
    // Check if tag already exists
    const existingTags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tagEl => 
        tagEl.textContent.trim().replace('×', '')
    );
    
    if (existingTags.includes(tag)) return;
    
    // Create tag element
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove" data-tag="${tag}">×</span>
    `;
    tagsContainer.appendChild(tagElement);
    
    // Save tags
    saveTags();
}

// Remove tag
function removeTag(tagElement) {
    tagElement.remove();
    saveTags();
}

// Save tags
function saveTags() {
    if (!state.currentPhotoId) return;
    
    const tagsContainer = document.getElementById('tagsContainer');
    const tags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tagEl => 
        tagEl.textContent.trim().replace('×', '')
    );
    
    updatePhoto({ tags });
}

// Save notes
function saveNotes(notes) {
    if (!state.currentPhotoId) return;
    
    updatePhoto({ notes });
}

// Save profile info
function saveProfileInfo() {
    const username = document.getElementById('username').value.trim();
    const displayName = document.getElementById('displayName').value.trim();
    const profileUrl = document.getElementById('profileUrl').value.trim();
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Get the platform name using the helper function
    const platform = getPlatformName();
    if (!platform) {
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error: Could not determine platform
        `;
        return;
    }
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId || 'soc_1';
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving profile info...
    `;
    
    fetch(`/api/soc/${socId}/platform/${platform}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            displayName,
            profileUrl
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update profile info');
        }
        return response.json();
    })
    .then(data => {
        // Show saved indicator
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Profile info saved
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
    })
    .catch(error => {
        console.error('Error:', error);
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Failed to save profile info
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
    });
}

// Export functions
export {
    initEventListeners,
    updateDeleteButtonListeners,
    selectPhoto,
    selectTagOption,
    applyAnalysisTag,
    addTag,
    removeTag,
    saveTags,
    saveNotes,
    saveProfileInfo
};
