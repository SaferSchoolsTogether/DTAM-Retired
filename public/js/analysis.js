// Global variables for analysis
let selectedAnalysisType = null;
let selectedAnalysisValue = null;

// Reference to currentPhotoId and currentSocId from photo-management.js
// These are declared in photo-management.js and made available globally

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Initialize analysis event listeners
    initAnalysisEventListeners();
});

// Initialize analysis event listeners
function initAnalysisEventListeners() {
    // DOM Elements
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
    if (!window.currentPhotoId || !selectedAnalysisType || !selectedAnalysisValue) return;
    
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
    const photoThumb = document.querySelector(`.photo-thumb[data-photo-id="${window.currentPhotoId}"]`);
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
    if (!window.currentPhotoId) return;
    
    const tagsContainer = document.getElementById('tagsContainer');
    const tags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tagEl => 
        tagEl.textContent.trim().replace('×', '')
    );
    
    updatePhoto({ tags });
}

// Save notes
function saveNotes(notes) {
    if (!window.currentPhotoId) return;
    
    updatePhoto({ notes });
}

// Update photo
function updatePhoto(data) {
    if (!window.currentPhotoId) return;
    
    const saveIndicator = document.getElementById('saveIndicator');
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving...
    `;
    
    fetch(`/api/soc/${window.currentSocId}/platform/${platform}/photo/${window.currentPhotoId}`, {
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
