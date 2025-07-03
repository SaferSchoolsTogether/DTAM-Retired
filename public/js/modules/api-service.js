/**
 * API Service Module
 * Handles API calls and data fetching
 */

import { state } from './core.js';
import { updateTags, updateMetadata } from './ui-state.js';

// Update photo
function updatePhoto(data) {
    if (!state.currentPhotoId) return;
    
    const saveIndicator = document.getElementById('saveIndicator');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId || 'soc_1';
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving...
    `;
    
    fetch(`/api/soc/${socId}/platform/${platform}/photo/${state.currentPhotoId}`, {
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

// Update photo view
function updatePhotoView() {
    const currentImage = document.getElementById('currentImage');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId || 'soc_1';
    
    // Show loading state
    currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ELoading...%3C/text%3E%3C/svg%3E';
    
    // Fetch photo data
    fetch(`/api/soc/${socId}/platform/${platform}/photo/${state.currentPhotoId}`)
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
            const photoIndex = Array.from(document.querySelectorAll('.photo-thumb')).findIndex(thumb => thumb.dataset.photoId === state.currentPhotoId);
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

// Handle upload
function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId || 'soc_1';
    
    const files = fileInput.files;
    if (files.length === 0) return;
    
    const formData = new FormData();
    // Use a single file upload approach to match server expectations
    formData.append('photo', files[0]);
    
    uploadBtn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
    uploadBtn.disabled = true;
    
    // Use the correct API endpoint that includes socId
    fetch(`/api/soc/${socId}/platform/${platform}/upload`, {
        method: 'POST',
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
        alert(`Upload failed: ${error.message}. Please try again.`);
    });
}

// Delete photo
function deletePhoto(photoId, photoThumb, wasActive) {
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId || 'soc_1';
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Show deleting indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Deleting...
    `;
    
    fetch(`/api/soc/${socId}/platform/${platform}/photo/${photoId}`, {
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
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId || 'soc_1';
    
    // In a real app, this would generate a preview of the report
    window.open(`/api/soc/${socId}/platform/${platform}/report`, '_blank');
}

// Generate report
function generateReport() {
    // In a real app, this would generate and download the report
    alert('Report generated successfully!');
}

// Export functions
export {
    updatePhoto,
    updatePhotoView,
    handleUpload,
    deletePhoto,
    clearSession,
    saveProgress,
    previewReport,
    generateReport
};

// Import from other modules
import { hideUploadModal, hideClearSessionModal } from './ui-state.js';
import { selectPhoto } from './event-handlers.js';
