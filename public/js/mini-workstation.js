/**
 * Mini Workstation JavaScript
 * Handles client-side functionality for the mini workstation for unknown threat analysis
 */

// Import necessary modules
import { updateTags, updateMetadata, showUploadModal, hideUploadModal } from './modules/ui-state.js';

// Global state
const state = {
    currentPhotoId: null,
    unsavedChanges: false,
    caseId: null,
    threatId: null,
    platform: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMiniWorkstation();
});

// Initialize mini workstation
function initializeMiniWorkstation() {
    // Get data from body attributes
    state.caseId = document.body.dataset.caseId;
    state.threatId = document.body.dataset.threatId;
    state.platform = document.body.dataset.platform;
    
    // Set current photo ID if photos exist
    const photoThumbs = document.querySelectorAll('.photo-thumb');
    if (photoThumbs.length > 0) {
        state.currentPhotoId = photoThumbs[0].dataset.photoId;
        
        // Update reverse image search links
        updateReverseImageSearchLinks();
    }
    
    // Initialize event listeners
    initEventListeners();
    
    console.log('Mini workstation initialized with:', {
        caseId: state.caseId,
        threatId: state.threatId,
        platform: state.platform
    });
}

// Initialize event listeners
function initEventListeners() {
    // Photo upload
    const addPhotosBtn = document.getElementById('addPhotosBtn');
    const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
    const closeUploadBtn = document.getElementById('closeUploadBtn');
    const fileDropArea = document.getElementById('fileDropArea');
    const fileInput = document.getElementById('fileInput');
    const fileUploadForm = document.getElementById('fileUploadForm');
    
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
    const photoGrid = document.getElementById('photoGrid');
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
    
    // Add tag input
    const addTagInput = document.getElementById('addTagInput');
    if (addTagInput) {
        addTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && addTagInput.value.trim()) {
                addTag(addTagInput.value.trim());
                addTagInput.value = '';
            }
        });
    }
    
    // Remove tag
    const tagsContainer = document.getElementById('tagsContainer');
    if (tagsContainer) {
        tagsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                removeTag(e.target.parentElement);
            }
        });
    }
    
    // Notes textarea
    const notesTextarea = document.getElementById('notesTextarea');
    if (notesTextarea) {
        notesTextarea.addEventListener('input', () => {
            saveNotes(notesTextarea.value);
        });
    }
    
    // Threat content textarea
    const threatContentTextarea = document.getElementById('threatContentTextarea');
    if (threatContentTextarea) {
        threatContentTextarea.addEventListener('input', () => {
            state.unsavedChanges = true;
        });
    }
    
    // Save language analysis button
    const saveLanguageAnalysisBtn = document.getElementById('saveLanguageAnalysisBtn');
    if (saveLanguageAnalysisBtn) {
        saveLanguageAnalysisBtn.addEventListener('click', saveLanguageAnalysis);
    }
    
    // Search Google button
    const searchGoogleBtn = document.getElementById('searchGoogleBtn');
    if (searchGoogleBtn) {
        searchGoogleBtn.addEventListener('click', searchGoogleForThreatContent);
    }
    
    // Save progress button
    const saveProgressBtn = document.getElementById('saveProgressBtn');
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', saveProgress);
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

// Handle upload
function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (!state.caseId) {
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
        alert('Error: No active case. Please create or select a case before uploading photos.');
        return;
    }
    
    if (!state.platform) {
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
        alert('Error: Could not determine platform for upload. Please try again.');
        return;
    }
    
    const files = fileInput.files;
    if (files.length === 0) return;
    
    const formData = new FormData();
    // Use a single file upload approach to match server expectations
    formData.append('photo', files[0]);
    
    uploadBtn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
    uploadBtn.disabled = true;
    
    // Use the case-level photo upload API endpoint
    fetch(`/api/case/${state.caseId}/platform/${state.platform}/upload`, {
        method: 'POST',
        headers: {
            'X-Case-ID': state.caseId
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            // Get more detailed error information if available
            return response.json().then(err => {
                throw new Error(err.error || 'Upload failed');
            }).catch(() => {
                throw new Error(`Upload failed with status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        hideUploadModal();
        
        // Reload to show new photos and ensure event listeners are attached
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
        alert(`Upload failed: ${error.message}. Please try again.`);
    });
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
    
    // Update reverse image search links
    updateReverseImageSearchLinks();
}

// Update photo view
function updatePhotoView() {
    const currentImage = document.getElementById('currentImage');
    
    if (!state.caseId) {
        currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3EError: No active case%3C/text%3E%3C/svg%3E';
        console.error('No active case ID found');
        return;
    }
    
    if (!state.platform) {
        currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3EError: Could not determine platform%3C/text%3E%3C/svg%3E';
        console.error('Could not determine platform for photo view');
        return;
    }
    
    // Show loading state
    currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ELoading...%3C/text%3E%3C/svg%3E';
    
    // Fetch photo data
    fetch(`/api/case/${state.caseId}/platform/${state.platform}/photo/${state.currentPhotoId}`, {
        headers: {
            'X-Case-ID': state.caseId
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch photo data');
        }
        return response.json();
    })
    .then(photo => {
        // Update image
        currentImage.src = photo.file_path;
        
        // Parse tags if it's a string
        let tags = photo.tags || [];
        if (typeof tags === 'string') {
            try {
                tags = JSON.parse(tags);
            } catch (e) {
                console.error('Error parsing tags:', e);
                tags = [];
            }
        }
        
        // Update tags
        updateTags(tags);
        
        // Update notes
        document.getElementById('notesTextarea').value = photo.notes || '';
        
        // Update progress indicator
        const photoIndex = Array.from(document.querySelectorAll('.photo-thumb')).findIndex(thumb => thumb.dataset.photoId === state.currentPhotoId);
        const totalPhotos = document.querySelectorAll('.photo-thumb').length;
        document.getElementById('progressIndicator').textContent = `Photo ${photoIndex + 1} of ${totalPhotos}`;
        
        // Make sure delete buttons have event listeners
        updateDeleteButtonListeners();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load photo data. Please try again.');
    });
}

// Delete photo
function deletePhoto(photoId, photoThumb, wasActive) {
    if (!state.caseId) {
        alert('Error: No active case. Please select a case before deleting photos.');
        return;
    }
    
    if (!state.platform) {
        alert('Error: Could not determine platform for deletion. Please try again.');
        return;
    }
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Show deleting indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Deleting...
    `;
    
    fetch(`/api/case/${state.caseId}/platform/${state.platform}/photo/${photoId}`, {
        method: 'DELETE',
        headers: {
            'X-Case-ID': state.caseId
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete photo');
        }
        return response.json();
    })
    .then(data => {
        // Remove photo from grid
        photoThumb.remove();
        
        // Update progress indicator
        const totalPhotos = document.querySelectorAll('.photo-thumb').length;
        if (totalPhotos === 0) {
            // No photos left, show empty state
            window.location.reload();
        } else {
            document.getElementById('progressIndicator').textContent = `Photo 1 of ${totalPhotos}`;
            
            // If the deleted photo was active, select another one
            if (wasActive) {
                const firstPhoto = document.querySelector('.photo-thumb');
                if (firstPhoto) {
                    selectPhoto(firstPhoto);
                }
            }
        }
        
        // Show success message
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Photo deleted successfully
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
            Failed to delete photo
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
        
        alert('Failed to delete photo. Please try again.');
    });
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

// Update photo
function updatePhoto(data) {
    if (!state.currentPhotoId) return;
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    if (!state.caseId) {
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error: No active case
        `;
        return;
    }
    
    if (!state.platform) {
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error: Could not determine platform
        `;
        return;
    }
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving...
    `;
    
    fetch(`/api/case/${state.caseId}/platform/${state.platform}/photo/${state.currentPhotoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Case-ID': state.caseId
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update photo');
        }
        return response.json();
    })
    .then(photo => {
        // Show saved indicator
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            All changes saved
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Failed to save changes
        `;
    });
}

// Update reverse image search links
function updateReverseImageSearchLinks() {
    const currentImage = document.getElementById('currentImage');
    const googleImagesLink = document.getElementById('googleImagesLink');
    const tinEyeLink = document.getElementById('tinEyeLink');
    
    if (currentImage && currentImage.src && googleImagesLink && tinEyeLink) {
        // Get the current image URL
        const imageUrl = currentImage.src;
        
        // Set the Google Images search URL
        googleImagesLink.href = `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(imageUrl)}`;
        
        // Set the TinEye search URL
        tinEyeLink.href = `https://tineye.com/search?url=${encodeURIComponent(imageUrl)}`;
    }
}

// Save language analysis
function saveLanguageAnalysis() {
    if (!state.threatId) {
        alert('Error: No active threat. Cannot save language analysis.');
        return;
    }
    
    const threatContentTextarea = document.getElementById('threatContentTextarea');
    const content = threatContentTextarea.value.trim();
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving language analysis...
    `;
    
    fetch(`/api/threats/${state.threatId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: content
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save language analysis');
        }
        return response.json();
    })
    .then(data => {
        // Show saved indicator
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Language analysis saved
        `;
        
        // Reset unsaved changes flag
        state.unsavedChanges = false;
        
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
            Failed to save language analysis
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

// Search Google for threat content
function searchGoogleForThreatContent() {
    const threatContentTextarea = document.getElementById('threatContentTextarea');
    const content = threatContentTextarea.value.trim();
    
    if (!content) {
        alert('Please enter some text to search for.');
        return;
    }
    
    // Create a quoted search query
    const searchQuery = `"${content.replace(/"/g, '')}"`;
    
    // Open Google search in a new tab
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
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
        
        // Load case data
        loadCaseData();
    }
}

// Load case data
function loadCaseData() {
    if (!state.caseId) {
        console.error('No case ID found');
        return;
    }
    
    // Fetch case data
    fetch(`/api/case-data?caseId=${state.caseId}`)
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
}

// Save progress
function saveProgress() {
    // If there are unsaved changes in the language analysis, save them
    if (state.unsavedChanges) {
        saveLanguageAnalysis();
    } else {
        const saveIndicator = document.getElementById('saveIndicator');
        
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            All changes saved
        `;
        
        alert('Progress saved successfully!');
    }
}
