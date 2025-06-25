// Global variables
let currentPhotoId = null;
let selectedAnalysisType = null;
let selectedAnalysisValue = null;
let unsavedChanges = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set current photo ID if photos exist
    const photoThumbs = document.querySelectorAll('.photo-thumb');
    if (photoThumbs.length > 0) {
        currentPhotoId = photoThumbs[0].dataset.photoId;
    }

    // Event listeners
    initEventListeners();
});

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

// Global function to update delete button listeners
window.updateDeleteButtonListeners = function() {
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
                    // Get the full platform name from the URL instead of the abbreviated text
                    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
                    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
                    
                    const saveIndicator = document.getElementById('saveIndicator');
                    const progressIndicator = document.getElementById('progressIndicator');
                    
                    // Show deleting indicator
                    saveIndicator.innerHTML = `
                        <span class="loading-spinner"></span>
                        Deleting...
                    `;
                    
                    fetch(`/api/platform/${platform}/photo/${photoId}`, {
                        method: 'DELETE'
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
                            progressIndicator.textContent = `Photo 1 of ${totalPhotos}`;
                            
                            // If the deleted photo was active, select another one
                            if (isActive) {
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
                        
                        alert('Failed to delete photo. Please try again.');
                    });
                }
            }
        });
    });
};

// Photo selection and delete
if (photoGrid) {
    // Initial setup of delete button listeners
    window.updateDeleteButtonListeners();
    
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
        document.getElementById('fileInput').files = files;
        updateSelectedFileInfo(files);
    }
}

// Handle file select
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        updateSelectedFileInfo(files);
    }
}

// Update selected file info
function updateSelectedFileInfo(files) {
    const selectedFileName = document.getElementById('selectedFileName');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (files.length === 1) {
        selectedFileName.textContent = files[0].name;
    } else {
        selectedFileName.textContent = `${files.length} files selected`;
    }
    selectedFileName.classList.add('active');
    uploadBtn.disabled = false;
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

// Handle upload
function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    const files = fileInput.files;
    if (files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('photo', files[i]);
    }
    
    uploadBtn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
    uploadBtn.disabled = true;
    
    fetch(`/api/platform/${platform}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        return response.json();
    })
    .then(data => {
        hideUploadModal();
        
        // Reload to show new photos and ensure event listeners are attached
        window.location.reload();
        
        // Add event to ensure delete buttons work after reload
        window.addEventListener('DOMContentLoaded', function() {
            // Make sure updateDeleteButtonListeners is available in global scope
            if (typeof window.updateDeleteButtonListeners === 'function') {
                window.updateDeleteButtonListeners();
            }
        });
    })
    .catch(error => {
        console.error('Error:', error);
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
        alert('Upload failed. Please try again.');
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
    currentPhotoId = photoThumb.dataset.photoId;
    
    // Update UI
    updatePhotoView();
}

// Update photo view
function updatePhotoView() {
    const currentImage = document.getElementById('currentImage');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Show loading state
    currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ELoading...%3C/text%3E%3C/svg%3E';
    
    // Fetch photo data
    fetch(`/api/platform/${platform}/photo/${currentPhotoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch photo data');
            }
            return response.json();
        })
        .then(photo => {
            // Update image
            currentImage.src = photo.path;
            
            // Update tags
            updateTags(photo.tags);
            
            // Update notes
            document.getElementById('notesTextarea').value = photo.notes || '';
            
            // Update metadata
            updateMetadata(photo.metadata);
            
            // Update progress indicator
            const photoIndex = Array.from(document.querySelectorAll('.photo-thumb')).findIndex(thumb => thumb.dataset.photoId === currentPhotoId);
            const totalPhotos = document.querySelectorAll('.photo-thumb').length;
            document.getElementById('progressIndicator').textContent = `Photo ${photoIndex + 1} of ${totalPhotos}`;
            
            // Make sure delete buttons have event listeners
            if (typeof updateDeleteButtonListeners === 'function') {
                updateDeleteButtonListeners();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load photo data. Please try again.');
        });
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
    if (!currentPhotoId) return;
    
    const tagsContainer = document.getElementById('tagsContainer');
    const tags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tagEl => 
        tagEl.textContent.trim().replace('×', '')
    );
    
    updatePhoto({ tags });
}

// Save notes
function saveNotes(notes) {
    if (!currentPhotoId) return;
    
    updatePhoto({ notes });
}

// Update photo
function updatePhoto(data) {
    if (!currentPhotoId) return;
    
    const saveIndicator = document.getElementById('saveIndicator');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving...
    `;
    
    fetch(`/api/platform/${platform}/photo/${currentPhotoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
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
    selectedAnalysisType = null;
    selectedAnalysisValue = null;
}

// Show analysis detail
function showAnalysisDetail(type) {
    selectedAnalysisType = type;
    
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
    selectedAnalysisType = null;
    selectedAnalysisValue = null;
    
    // Reset tag options
    document.querySelectorAll('.tag-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Disable apply buttons
    document.querySelectorAll('.apply-tag-btn').forEach(btn => {
        btn.disabled = true;
    });
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
    selectedAnalysisValue = option.dataset.value;
    
    // Enable apply button
    const applyBtn = option.closest('.tag-options').querySelector('.apply-tag-btn');
    applyBtn.disabled = false;
}

// Apply analysis tag
function applyAnalysisTag() {
    if (!currentPhotoId || !selectedAnalysisType || !selectedAnalysisValue) return;
    
    const tagsContainer = document.getElementById('tagsContainer');
    
    const analysisTags = {};
    analysisTags[selectedAnalysisType] = selectedAnalysisValue;
    
    // Update photo
    updatePhoto({ analysisTags });
    
    // Add tag to UI
    const tagElement = document.createElement('span');
    tagElement.className = 'tag analysis-tag';
    tagElement.textContent = `${selectedAnalysisType.replace(/-/g, ' ')}: ${selectedAnalysisValue}`;
    tagsContainer.appendChild(tagElement);
    
    // Update photo status
    const photoThumb = document.querySelector(`.photo-thumb[data-photo-id="${currentPhotoId}"]`);
    if (photoThumb) {
        const photoStatus = photoThumb.querySelector('.photo-status');
        photoStatus.classList.add('analyzed');
        photoStatus.textContent = '✓';
    }
    
    // Hide modal
    hideAnalysisModal();
}

// Save progress
function saveProgress() {
    const saveIndicator = document.getElementById('saveIndicator');
    
    saveIndicator.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
        </svg>
        All changes saved
    `;
    
    // In a real app, this would save all progress to the server
    alert('Progress saved successfully!');
}

// Preview report
function previewReport() {
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // In a real app, this would generate a preview of the report
    window.open(`/api/platform/${platform}/report`, '_blank');
}

// Generate report
function generateReport() {
    // In a real app, this would generate and download the report
    alert('Report generated successfully!');
}

// Confirm delete photo
function confirmDeletePhoto(photoThumb) {
    const photoId = photoThumb.dataset.photoId;
    const isActive = photoThumb.classList.contains('active');
    
    // For testing purposes, skip confirmation and directly delete
    // In a production environment, you would use: 
    // if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
    //     deletePhoto(photoId, photoThumb, isActive);
    // }
    
    // Directly delete for testing
    deletePhoto(photoId, photoThumb, isActive);
}

// Delete photo
function deletePhoto(photoId, photoThumb, wasActive) {
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Show deleting indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Deleting...
    `;
    
    fetch(`/api/platform/${platform}/photo/${photoId}`, {
        method: 'DELETE'
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
