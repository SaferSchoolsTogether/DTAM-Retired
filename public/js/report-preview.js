/**
 * Report Preview Module
 * Handles report preview and generation functionality
 */

// DOM Elements
const reportPreviewModal = document.getElementById('reportPreviewModal');
const closeReportPreviewBtn = document.getElementById('closeReportPreviewBtn');
const generateReportFromPreviewBtn = document.getElementById('generateReportFromPreviewBtn');
const reportLoading = document.getElementById('reportLoading');
const reportPreviewBody = document.getElementById('reportPreviewBody');
const reportError = document.getElementById('reportError');
const retryReportBtn = document.getElementById('retryReportBtn');
const generationProgress = document.getElementById('generationProgress');
const pdfProgressBar = document.getElementById('pdfProgressBar');
const progressStatus = document.getElementById('progressStatus');

// State
let reportData = null;
let currentCaseId = null;
let currentSocId = null;
let currentPlatform = null;

// Initialize
function initReportPreview() {
    // Get data attributes from body
    const body = document.body;
    currentCaseId = body.dataset.caseId;
    currentSocId = body.dataset.socId;
    
    // Get platform from URL or active platform icon
    const activeIcon = document.querySelector('.platform-icon.active');
    if (activeIcon) {
        const platformUrl = activeIcon.getAttribute('href');
        if (platformUrl) {
            // Extract platform name from URL
            const platformWithQuery = platformUrl.split('/').pop();
            currentPlatform = platformWithQuery.split('?')[0]; // Remove query parameters
        }
    }
    
    // If still no platform, try to get from URL
    if (!currentPlatform) {
        const urlPath = window.location.pathname;
        const platformMatch = urlPath.match(/\/platform\/([^\/]+)/);
        if (platformMatch && platformMatch[1]) {
            currentPlatform = platformMatch[1];
        }
    }
    
    // Event listeners
    if (closeReportPreviewBtn) {
        closeReportPreviewBtn.addEventListener('click', hideReportPreviewModal);
    }
    
    if (generateReportFromPreviewBtn) {
        generateReportFromPreviewBtn.addEventListener('click', generateReportFromPreview);
    }
    
    if (retryReportBtn) {
        retryReportBtn.addEventListener('click', loadReportData);
    }
    
    // Section toggle buttons
    document.querySelectorAll('.section-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            const content = document.getElementById(`${section}Content`);
            
            if (content) {
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    this.classList.remove('collapsed');
                } else {
                    content.style.display = 'none';
                    this.classList.add('collapsed');
                }
            }
        });
    });
    
    // Character counters for textareas
    document.addEventListener('input', function(e) {
        if (e.target && e.target.classList.contains('photo-notes')) {
            const counter = e.target.parentElement.querySelector('.character-counter .current-count');
            if (counter) {
                counter.textContent = e.target.value.length;
            }
        }
    });
}

// Show report preview modal
function showReportPreviewModal() {
    if (reportPreviewModal) {
        reportPreviewModal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Reset state
        reportLoading.style.display = 'flex';
        reportPreviewBody.style.display = 'none';
        reportError.style.display = 'none';
        generationProgress.style.display = 'none';
        
        // Load report data
        loadReportData();
    }
}

// Hide report preview modal
function hideReportPreviewModal() {
    if (reportPreviewModal) {
        reportPreviewModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Load report data
function loadReportData() {
    // Reset state
    reportLoading.style.display = 'flex';
    reportPreviewBody.style.display = 'none';
    reportError.style.display = 'none';
    
    // Validate required parameters
    if (!currentCaseId || !currentSocId || !currentPlatform) {
        showReportError('Missing required parameters. Please try again.');
        return;
    }
    
    // Fetch report data
    fetch(`/api/soc/${currentSocId}/platform/${currentPlatform}/report/preview?caseId=${currentCaseId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load report data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            reportData = data;
            displayReportData(data);
        })
        .catch(error => {
            console.error('Error loading report data:', error);
            showReportError('Failed to load report data. Please try again.');
        });
}

// Display report data
function displayReportData(data) {
    if (!data || !data.case || !data.soc) {
        showReportError('Invalid report data. Please try again.');
        return;
    }
    
    // Hide loading, show content
    reportLoading.style.display = 'none';
    reportPreviewBody.style.display = 'block';
    
    // Case information
    document.getElementById('editReportCaseId').value = data.case.id || '';
    document.getElementById('editReportCaseDate').value = data.case.date || '';
    document.getElementById('editReportInvestigator').value = data.case.team_member_name || '';
    document.getElementById('editReportOrganization').value = data.case.organization || '';
    
    // SOC information
    const socListContainer = document.getElementById('socListContainer');
    const noSocsMessage = document.getElementById('noSocsMessage');
    
    if (socListContainer) {
        // Clear previous content
        socListContainer.innerHTML = '';
        
        if (data.soc) {
            // Create SOC item from template
            const socTemplate = document.getElementById('socTemplate');
            if (socTemplate && socTemplate.content) {
                const socItem = document.importNode(socTemplate.content, true);
                
                // Set SOC data
                socItem.querySelector('.soc-name').textContent = data.soc.name || 'Unknown';
                socItem.querySelector('.soc-student-id').value = data.soc.student_id || '';
                socItem.querySelector('.soc-grade').value = data.soc.grade || '';
                socItem.querySelector('.soc-school').value = data.soc.school || '';
                
                // Set status
                const statusSelect = socItem.querySelector('.soc-status');
                if (statusSelect && data.soc.status) {
                    const options = statusSelect.querySelectorAll('option');
                    options.forEach(option => {
                        if (option.value === data.soc.status.toLowerCase()) {
                            option.selected = true;
                        }
                    });
                }
                
                socListContainer.appendChild(socItem);
                
                if (noSocsMessage) {
                    noSocsMessage.style.display = 'none';
                }
            }
        } else if (noSocsMessage) {
            noSocsMessage.style.display = 'block';
        }
        
        // Show editable content
        const socInfoContent = document.getElementById('socInfoContent');
        if (socInfoContent) {
            const skeletonLoading = socInfoContent.querySelector('.skeleton-loading');
            const editableContent = socInfoContent.querySelector('.editable-content');
            
            if (skeletonLoading) {
                skeletonLoading.style.display = 'none';
            }
            
            if (editableContent) {
                editableContent.style.display = 'block';
            }
        }
    }
    
    // Platform information
    const platformListContainer = document.getElementById('platformListContainer');
    const noPlatformsMessage = document.getElementById('noPlatformsMessage');
    
    if (platformListContainer) {
        // Clear previous content
        platformListContainer.innerHTML = '';
        
        if (data.platform) {
            // Create platform item from template
            const platformTemplate = document.getElementById('platformTemplate');
            if (platformTemplate && platformTemplate.content) {
                const platformItem = document.importNode(platformTemplate.content, true);
                
                // Set platform data
                const platformName = typeof data.platform === 'string' 
                    ? data.platform 
                    : (data.platform.platform_name || currentPlatform || 'Unknown');
                
                platformItem.querySelector('.platform-name').textContent = 
                    platformName.charAt(0).toUpperCase() + platformName.slice(1);
                
                platformItem.querySelector('.platform-username').value = 
                    data.platform.username || '';
                
                platformItem.querySelector('.platform-display-name').value = 
                    data.platform.display_name || '';
                
                platformItem.querySelector('.platform-url').value = 
                    data.platform.profile_url || '';
                
                platformListContainer.appendChild(platformItem);
                
                if (noPlatformsMessage) {
                    noPlatformsMessage.style.display = 'none';
                }
            }
        } else if (noPlatformsMessage) {
            noPlatformsMessage.style.display = 'block';
        }
        
        // Show editable content
        const platformInfoContent = document.getElementById('platformInfoContent');
        if (platformInfoContent) {
            const skeletonLoading = platformInfoContent.querySelector('.skeleton-loading');
            const editableContent = platformInfoContent.querySelector('.editable-content');
            
            if (skeletonLoading) {
                skeletonLoading.style.display = 'none';
            }
            
            if (editableContent) {
                editableContent.style.display = 'block';
            }
        }
    }
    
    // Photos
    const photoListContainer = document.getElementById('photoListContainer');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    
    if (photoListContainer) {
        // Clear previous content
        photoListContainer.innerHTML = '';
        
        if (data.photos && data.photos.length > 0) {
            // Create photo items from template
            const photoTemplate = document.getElementById('photoTemplate');
            if (photoTemplate && photoTemplate.content) {
                data.photos.forEach(photo => {
                    const photoItem = document.importNode(photoTemplate.content, true);
                    
                    // Set photo data
                    const thumbImg = photoItem.querySelector('.photo-thumb-img');
                    if (thumbImg) {
                        thumbImg.src = photo.file_path;
                        thumbImg.setAttribute('data-photo-id', photo.id);
                    }
                    
                    photoItem.querySelector('.photo-platform').value = 
                        typeof data.platform === 'string' 
                            ? data.platform 
                            : (data.platform.platform_name || currentPlatform || 'Unknown');
                    
                    const notesTextarea = photoItem.querySelector('.photo-notes');
                    if (notesTextarea) {
                        notesTextarea.value = photo.notes || '';
                        
                        // Update character counter
                        const counter = photoItem.querySelector('.character-counter .current-count');
                        if (counter) {
                            counter.textContent = (photo.notes || '').length;
                        }
                    }
                    
                    // Add tags
                    const tagsContainer = photoItem.querySelector('.photo-tags-container');
                    if (tagsContainer && photo.tags && photo.tags.length > 0) {
                        photo.tags.forEach(tag => {
                            const tagElement = document.createElement('span');
                            tagElement.className = 'tag';
                            tagElement.textContent = tag;
                            tagsContainer.appendChild(tagElement);
                        });
                    }
                    
                    // Add analysis tags
                    const analysisTagsContainer = photoItem.querySelector('.photo-analysis-tags-container');
                    if (analysisTagsContainer && photo.analysisTags && Object.keys(photo.analysisTags).length > 0) {
                        Object.entries(photo.analysisTags).forEach(([key, value]) => {
                            const tagElement = document.createElement('span');
                            tagElement.className = 'tag analysis-tag';
                            tagElement.textContent = `${key}: ${value}`;
                            analysisTagsContainer.appendChild(tagElement);
                        });
                    }
                    
                    photoListContainer.appendChild(photoItem);
                });
                
                if (noPhotosMessage) {
                    noPhotosMessage.style.display = 'none';
                }
            }
        } else if (noPhotosMessage) {
            noPhotosMessage.style.display = 'block';
        }
        
        // Show editable content
        const photosContent = document.getElementById('photosContent');
        if (photosContent) {
            const skeletonLoading = photosContent.querySelector('.skeleton-loading');
            const editableContent = photosContent.querySelector('.editable-content');
            
            if (skeletonLoading) {
                skeletonLoading.style.display = 'none';
            }
            
            if (editableContent) {
                editableContent.style.display = 'block';
            }
        }
    }
    
    // Threats
    const threatListContainer = document.getElementById('threatListContainer');
    const noThreatsMessage = document.getElementById('noThreatsMessage');
    
    if (threatListContainer) {
        // Clear previous content
        threatListContainer.innerHTML = '';
        
        if (data.threats && data.threats.length > 0) {
            // Create threat items from template
            const threatTemplate = document.getElementById('threatTemplate');
            if (threatTemplate && threatTemplate.content) {
                data.threats.forEach(threat => {
                    const threatItem = document.importNode(threatTemplate.content, true);
                    
                    // Set threat data
                    threatItem.querySelector('.threat-id').textContent = `Threat ID: ${threat.id}`;
                    threatItem.querySelector('.threat-discovery-method').value = threat.discovery_method || '';
                    
                    const contentTextarea = threatItem.querySelector('.threat-content');
                    if (contentTextarea) {
                        contentTextarea.value = threat.content || '';
                    }
                    
                    const languageAnalysisTextarea = threatItem.querySelector('.threat-language-analysis');
                    if (languageAnalysisTextarea) {
                        languageAnalysisTextarea.value = threat.language_analysis || '';
                    }
                    
                    threatListContainer.appendChild(threatItem);
                });
                
                if (noThreatsMessage) {
                    noThreatsMessage.style.display = 'none';
                }
            }
        } else if (noThreatsMessage) {
            noThreatsMessage.style.display = 'block';
        }
        
        // Show editable content
        const threatInfoContent = document.getElementById('threatInfoContent');
        if (threatInfoContent) {
            const skeletonLoading = threatInfoContent.querySelector('.skeleton-loading');
            const editableContent = threatInfoContent.querySelector('.editable-content');
            
            if (skeletonLoading) {
                skeletonLoading.style.display = 'none';
            }
            
            if (editableContent) {
                editableContent.style.display = 'block';
            }
        }
    }
    
    // Show all section content initially
    document.querySelectorAll('.section-content').forEach(content => {
        content.style.display = 'block';
    });
    
    // Show editable content for case info
    const caseInfoContent = document.getElementById('caseInfoContent');
    if (caseInfoContent) {
        const skeletonLoading = caseInfoContent.querySelector('.skeleton-loading');
        const editableContent = caseInfoContent.querySelector('.editable-content');
        
        if (skeletonLoading) {
            skeletonLoading.style.display = 'none';
        }
        
        if (editableContent) {
            editableContent.style.display = 'block';
        }
    }
}

// Show report error
function showReportError(message) {
    reportLoading.style.display = 'none';
    reportPreviewBody.style.display = 'none';
    reportError.style.display = 'flex';
    
    const errorText = reportError.querySelector('.error-text');
    if (errorText) {
        errorText.textContent = message || 'Failed to load report data. Please try again.';
    }
}

// Collect report data from form
function collectReportData() {
    if (!reportData) {
        return null;
    }
    
    // Create a copy of the original data
    const data = JSON.parse(JSON.stringify(reportData));
    
    // Update case information
    data.case.date = document.getElementById('editReportCaseDate').value;
    data.case.team_member_name = document.getElementById('editReportInvestigator').value;
    data.case.organization = document.getElementById('editReportOrganization').value;
    
    // Update SOC information
    const socStudentId = document.querySelector('.soc-student-id');
    const socGrade = document.querySelector('.soc-grade');
    const socSchool = document.querySelector('.soc-school');
    const socStatus = document.querySelector('.soc-status');
    
    if (socStudentId) data.soc.student_id = socStudentId.value;
    if (socGrade) data.soc.grade = socGrade.value;
    if (socSchool) data.soc.school = socSchool.value;
    if (socStatus) data.soc.status = socStatus.value;
    
    // Update platform information
    const platformUsername = document.querySelector('.platform-username');
    const platformDisplayName = document.querySelector('.platform-display-name');
    const platformUrl = document.querySelector('.platform-url');
    
    if (typeof data.platform !== 'string') {
        if (platformUsername) data.platform.username = platformUsername.value;
        if (platformDisplayName) data.platform.display_name = platformDisplayName.value;
        if (platformUrl) data.platform.profile_url = platformUrl.value;
    }
    
    // Update photos
    const photoItems = document.querySelectorAll('.photo-item');
    if (photoItems.length > 0 && data.photos && data.photos.length > 0) {
        photoItems.forEach((item, index) => {
            if (index < data.photos.length) {
                const includeCheckbox = item.querySelector('.include-photo-checkbox');
                const notesTextarea = item.querySelector('.photo-notes');
                
                if (includeCheckbox) {
                    data.photos[index].include = includeCheckbox.checked;
                }
                
                if (notesTextarea) {
                    data.photos[index].notes = notesTextarea.value;
                }
            }
        });
    }
    
    // Update threats
    const threatItems = document.querySelectorAll('.threat-item');
    if (threatItems.length > 0 && data.threats && data.threats.length > 0) {
        threatItems.forEach((item, index) => {
            if (index < data.threats.length) {
                const includeCheckbox = item.querySelector('.include-threat-checkbox');
                const contentTextarea = item.querySelector('.threat-content');
                const languageAnalysisTextarea = item.querySelector('.threat-language-analysis');
                
                if (includeCheckbox) {
                    data.threats[index].include = includeCheckbox.checked;
                }
                
                if (contentTextarea) {
                    data.threats[index].content = contentTextarea.value;
                }
                
                if (languageAnalysisTextarea) {
                    data.threats[index].language_analysis = languageAnalysisTextarea.value;
                }
            }
        });
    }
    
    return data;
}

// Generate report from preview
function generateReportFromPreview() {
    // Collect data from form
    const data = collectReportData();
    
    if (!data) {
        showReportError('Failed to collect report data. Please try again.');
        return;
    }
    
    // Show generation progress
    reportPreviewBody.style.display = 'none';
    generationProgress.style.display = 'block';
    
    // Reset progress bar
    pdfProgressBar.style.width = '0%';
    progressStatus.textContent = 'Preparing data...';
    
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
            pdfProgressBar.style.width = `${progress}%`;
            
            if (progress < 30) {
                progressStatus.textContent = 'Collecting data...';
            } else if (progress < 60) {
                progressStatus.textContent = 'Processing photos...';
            } else {
                progressStatus.textContent = 'Generating PDF...';
            }
        }
    }, 300);
    
    // Generate PDF
    fetch(`/api/soc/${currentSocId}/platform/${currentPlatform}/report/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to generate PDF: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        // Clear interval and complete progress
        clearInterval(progressInterval);
        pdfProgressBar.style.width = '100%';
        progressStatus.textContent = 'PDF generated successfully!';
        
        // Download the PDF
        setTimeout(() => {
            window.location.href = result.url;
            
            // Show success message
            const saveIndicator = document.getElementById('saveIndicator');
            if (saveIndicator) {
                saveIndicator.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    Report generated successfully
                `;
            }
            
            // Hide modal after a delay
            setTimeout(hideReportPreviewModal, 1000);
        }, 500);
    })
    .catch(error => {
        console.error('Error generating PDF:', error);
        clearInterval(progressInterval);
        showReportError('Failed to generate PDF. Please try again.');
    });
}

// Export functions
export {
    initReportPreview,
    showReportPreviewModal,
    hideReportPreviewModal
};
