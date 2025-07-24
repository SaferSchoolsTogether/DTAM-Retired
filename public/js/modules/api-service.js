/**
 * API Service Module
 * Handles API calls and data fetching
 */

import { state } from './core.js';
import { updateTags, updateMetadata } from './ui-state.js';

// Helper function to get platform name with fallbacks
function getPlatformName() {
  try {
    const activeIcon = document.querySelector('.platform-icon.active');
    if (!activeIcon) {
      // Try to get platform from URL if no active icon
      const urlPath = window.location.pathname;
      const platformMatch = urlPath.match(/\/platform\/([^\/]+)/);
      if (platformMatch && platformMatch[1]) {
        return platformMatch[1];
      }
      
      // If still no platform, check if there's a data attribute on the body
      const bodyPlatform = document.body.dataset.platform;
      if (bodyPlatform) {
        return bodyPlatform;
      }
      
      console.error('No active platform icon found and no fallback available');
      return null;
    }
    
    const platformUrl = activeIcon.getAttribute('href');
    if (!platformUrl) {
      console.error('Platform icon has no href attribute');
      return null;
    }
    
    // Extract platform name from URL, removing any query parameters
    const platformWithQuery = platformUrl.split('/').pop();
    return platformWithQuery.split('?')[0]; // Remove query parameters
  } catch (error) {
    console.error('Error getting platform name:', error);
    return null;
  }
}

// Update photo
function updatePhoto(data) {
    if (!state.currentPhotoId) return;
    
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
    
    // Get the case ID from the URL or body data attribute
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId') || document.body.dataset.caseId;
    
    if (!caseId) {
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" style="color: #f44336;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error: No active case
        `;
        return;
    }
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving...
    `;
    
    // Check if this is an unknown threat (no SOC)
    const isUnknownThreat = document.body.hasAttribute('data-unknown-threat');
    const socId = document.body.dataset.socId;
    
    let apiUrl;
    if (isUnknownThreat) {
        // Use case-level API endpoint for unknown threats
        apiUrl = `/api/case/${caseId}/platform/${platform}/photo/${state.currentPhotoId}`;
    } else {
        // Use SOC-level API endpoint for known threats
        apiUrl = `/api/soc/${socId}/platform/${platform}/photo/${state.currentPhotoId}?caseId=${caseId}`;
    }
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Case-ID': caseId
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
    // Get the platform name using the helper function
    const platform = getPlatformName();
    if (!platform) {
        currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3EError: Could not determine platform%3C/text%3E%3C/svg%3E';
        console.error('Could not determine platform for photo view');
        return;
    }
    
    // Get the case ID from the URL or body data attribute
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId') || document.body.dataset.caseId;
    
    if (!caseId) {
        currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3EError: No active case%3C/text%3E%3C/svg%3E';
        console.error('No active case ID found');
        return;
    }
    
    // Show loading state
    currentImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3ELoading...%3C/text%3E%3C/svg%3E';
    
    // Check if this is an unknown threat (no SOC)
    const isUnknownThreat = document.body.hasAttribute('data-unknown-threat');
    const socId = document.body.dataset.socId;
    
    let apiUrl;
    if (isUnknownThreat) {
        // Use case-level API endpoint for unknown threats
        apiUrl = `/api/case/${caseId}/platform/${platform}/photo/${state.currentPhotoId}`;
    } else {
        // Use SOC-level API endpoint for known threats
        apiUrl = `/api/soc/${socId}/platform/${platform}/photo/${state.currentPhotoId}?caseId=${caseId}`;
    }
    
    // Fetch photo data
    fetch(apiUrl, {
        headers: {
            'X-Case-ID': caseId
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
    // Get the platform name using the helper function
    const platform = getPlatformName();
    if (!platform) {
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
        alert('Error: Could not determine platform for upload. Please try again.');
        return;
    }
    
    // Get the case ID from the URL or body data attribute
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId') || document.body.dataset.caseId;
    
    if (!caseId) {
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
        alert('Error: No active case. Please create or select a case before uploading photos.');
        return;
    }
    
    const files = fileInput.files;
    if (files.length === 0) return;
    
    const formData = new FormData();
    // Use a single file upload approach to match server expectations
    formData.append('photo', files[0]);
    
    uploadBtn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
    uploadBtn.disabled = true;
    
    // Check if this is an unknown threat (no SOC)
    const isUnknownThreat = document.body.hasAttribute('data-unknown-threat');
    const socId = document.body.dataset.socId;
    
    let apiUrl;
    if (isUnknownThreat) {
        // Use case-level API endpoint for unknown threats
        apiUrl = `/api/case/${caseId}/platform/${platform}/upload`;
    } else {
        // Use SOC-level API endpoint for known threats
        apiUrl = `/api/soc/${socId}/platform/${platform}/upload?caseId=${caseId}`;
    }
    
    // Use the correct API endpoint based on whether this is an unknown threat or not
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'X-Case-ID': caseId
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
    // Get the platform name using the helper function
    const platform = getPlatformName();
    if (!platform) {
        alert('Error: Could not determine platform for deletion. Please try again.');
        return;
    }
    
    // Get the case ID from the URL or body data attribute
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId') || document.body.dataset.caseId;
    
    if (!caseId) {
        alert('Error: No active case. Please select a case before deleting photos.');
        return;
    }
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Show deleting indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Deleting...
    `;
    
    // Check if this is an unknown threat (no SOC)
    const isUnknownThreat = document.body.hasAttribute('data-unknown-threat');
    const socId = document.body.dataset.socId;
    
    let apiUrl;
    if (isUnknownThreat) {
        // Use case-level API endpoint for unknown threats
        apiUrl = `/api/case/${caseId}/platform/${platform}/photo/${photoId}`;
    } else {
        // Use SOC-level API endpoint for known threats
        apiUrl = `/api/soc/${socId}/platform/${platform}/photo/${photoId}?caseId=${caseId}`;
    }
    
    fetch(apiUrl, {
        method: 'DELETE',
        headers: {
            'X-Case-ID': caseId
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
    // Get the platform name using the helper function
    const platform = getPlatformName();
    if (!platform) {
        alert('Error: Could not determine platform for report preview. Please try again.');
        return;
    }
    
    // Extract socId from the URL or from the body data attribute
    const socId = document.body.dataset.socId;
    if (!socId) {
        alert('Error: Could not determine SOC ID for report preview. Please try again.');
        return;
    }
    
    // Show the report preview modal
    import('/js/report-preview.js')
        .then(module => {
            module.showReportPreviewModal();
        })
        .catch(error => {
            console.error('Error loading report preview module:', error);
            alert('Failed to load report preview. Please try again.');
        });
}

// Generate report
function generateReport() {
    // Use the preview report function to show the modal first
    previewReport();
}

// Export functions
export {
    getPlatformName,
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
