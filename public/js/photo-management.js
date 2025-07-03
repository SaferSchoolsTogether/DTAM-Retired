// Global variables for photo management
// currentPhotoId is used by other modules like analysis.js
window.currentPhotoId = null;
let unsavedChanges = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set current photo ID if photos exist
    const photoThumbs = document.querySelectorAll('.photo-thumb');
    if (photoThumbs.length > 0) {
        window.currentPhotoId = photoThumbs[0].dataset.photoId;
    }

    // Initialize photo management event listeners
    initPhotoManagementEventListeners();
});

// Initialize photo management event listeners
function initPhotoManagementEventListeners() {
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
    const clearSessionBtn = document.getElementById('clearSessionBtn');
    const clearSessionModal = document.getElementById('clearSessionModal');
    const closeClearSessionBtn = document.getElementById('closeClearSessionBtn');
    const confirmDeleteInput = document.getElementById('confirmDeleteInput');
    const confirmClearSessionBtn = document.getElementById('confirmClearSessionBtn');
    const saveProgressBtn = document.getElementById('saveProgressBtn');
    const previewReportBtn = document.getElementById('previewReportBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');

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

// Clear session
function clearSession() {
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Show clearing indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Clearing session...
    `;
    
    fetch('/api/clear-session', {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to clear session');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Session cleared successfully
        `;
        
        // Hide modal
        hideClearSessionModal();
        
        // Show alert
        alert('Session cleared successfully. You will be redirected to the welcome page.');
        
        // Redirect to welcome page
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Error:', error);
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Failed to clear session
        `;
        
        alert('Failed to clear session. Please try again.');
    });
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
    window.currentPhotoId = photoThumb.dataset.photoId;
    
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
    fetch(`/api/platform/${platform}/photo/${window.currentPhotoId}`)
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
            const photoIndex = Array.from(document.querySelectorAll('.photo-thumb')).findIndex(thumb => thumb.dataset.photoId === window.currentPhotoId);
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

// Make updateDeleteButtonListeners available globally
window.updateDeleteButtonListeners = updateDeleteButtonListeners;
