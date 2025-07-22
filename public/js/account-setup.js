/**
 * Account Setup JavaScript
 * Handles form validation and search tools functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const accountSetupForm = document.getElementById('accountSetupForm');
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const profileUrlInput = document.getElementById('profileUrl');
    const usernameError = document.getElementById('usernameError');
    
    // Search tools buttons
    const whatsmynameBtn = document.getElementById('whatsmynameBtn');
    const googleBtn = document.getElementById('googleBtn');
    const searchTipsBtn = document.getElementById('searchTipsBtn');
    
    // Modal elements
    const searchTipsModal = document.getElementById('searchTipsModal');
    const closeSearchTipsBtn = document.getElementById('closeSearchTipsBtn');
    
    // Case Context Toggle Button
    const caseContextToggleBtn = document.getElementById('caseContextToggleBtn');
    const caseContextBar = document.querySelector('.case-context-bar');
    
    // Initialize
    init();
    
    /**
     * Initialize the page
     */
    function init() {
        // Add event listeners
        if (accountSetupForm) {
            accountSetupForm.addEventListener('submit', handleFormSubmit);
        }
        
        if (usernameInput) {
            usernameInput.addEventListener('input', validateUsername);
        }
        
        if (whatsmynameBtn) {
            whatsmynameBtn.addEventListener('click', openWhatsMyName);
        }
        
        if (googleBtn) {
            googleBtn.addEventListener('click', openGoogleSearch);
        }
        
        if (searchTipsBtn) {
            searchTipsBtn.addEventListener('click', openSearchTipsModal);
        }
        
        if (closeSearchTipsBtn) {
            closeSearchTipsBtn.addEventListener('click', closeSearchTipsModal);
        }
        
        if (caseContextToggleBtn && caseContextBar) {
            caseContextToggleBtn.addEventListener('click', toggleCaseContext);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === searchTipsModal) {
                closeSearchTipsModal();
            }
        });
        
        // Initial validation
        validateUsername();
    }
    
    /**
     * Handle form submission
     */
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Validate username
        if (!validateUsername()) {
            return;
        }
        
        // Get form data
        const formData = {
            username: usernameInput.value.trim(),
            displayName: displayNameInput.value.trim(),
            profileUrl: profileUrlInput.value.trim()
        };
        
        // Get socId and caseId from data attributes
        const socId = document.body.dataset.socId;
        const caseId = document.body.dataset.caseId;
        
        // Get platform from URL
        const urlPath = window.location.pathname;
        const platformMatch = urlPath.match(/\/platform\/([^\/]+)/);
        const platform = platformMatch ? platformMatch[1] : null;
        
        if (!socId || !caseId || !platform) {
            alert('Error: Missing required parameters. Please try again.');
            return;
        }
        
        // Disable submit button and show loading state
        const accessWorkstationBtn = document.getElementById('accessWorkstationBtn');
        if (accessWorkstationBtn) {
            accessWorkstationBtn.disabled = true;
            accessWorkstationBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        }
        
        // Save platform data
        fetch(`/api/soc/${socId}/platform/${platform}?caseId=${caseId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Case-ID': caseId
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save platform data');
            }
            return response.json();
        })
        .then(data => {
            // Redirect to workstation
            window.location.href = `/soc/${socId}/platform/${platform}?caseId=${caseId}`;
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Re-enable submit button
            if (accessWorkstationBtn) {
                accessWorkstationBtn.disabled = false;
                accessWorkstationBtn.textContent = 'Access Workstation';
            }
            
            alert('Failed to save platform data. Please try again.');
        });
    }
    
    /**
     * Validate username field
     */
    function validateUsername() {
        if (!usernameInput || !usernameError) return true;
        
        const username = usernameInput.value.trim();
        
        if (!username) {
            usernameInput.classList.add('error');
            usernameError.classList.add('visible');
            return false;
        } else {
            usernameInput.classList.remove('error');
            usernameError.classList.remove('visible');
            return true;
        }
    }
    
    /**
     * Open WhatsMyName in a new tab with the username if available
     */
    function openWhatsMyName() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        
        if (username) {
            window.open(`https://whatsmyname.app/?q=${encodeURIComponent(username)}`, '_blank');
        } else {
            // Get SOC name from case context if available
            let socName = '';
            const socNameElement = document.querySelector('.case-context-bar .soc-name');
            
            if (socNameElement && socNameElement.textContent) {
                socName = socNameElement.textContent.trim();
                window.open(`https://whatsmyname.app/?q=${encodeURIComponent(socName)}`, '_blank');
            } else {
                window.open('https://whatsmyname.app', '_blank');
            }
        }
    }
    
    /**
     * Open Google search in a new tab with username and platform info
     */
    function openGoogleSearch() {
        // Get platform from URL
        const urlPath = window.location.pathname;
        const platformMatch = urlPath.match(/\/platform\/([^\/]+)/);
        const platform = platformMatch ? platformMatch[1] : '';
        
        // Get username if available
        const username = usernameInput ? usernameInput.value.trim() : '';
        
        // Get SOC name from case context if available
        let socName = '';
        const socNameElement = document.querySelector('.case-context-bar .soc-name');
        
        if (socNameElement && socNameElement.textContent) {
            socName = socNameElement.textContent.trim();
        }
        
        // Construct search query
        let searchQuery;
        if (username) {
            searchQuery = encodeURIComponent(`${username} ${platform}`);
        } else if (socName) {
            searchQuery = encodeURIComponent(`${socName} ${platform}`);
        } else {
            searchQuery = encodeURIComponent(`${platform} profile search`);
        }
        
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    }
    
    /**
     * Open search tips modal
     */
    function openSearchTipsModal() {
        if (searchTipsModal) {
            searchTipsModal.style.display = 'block';
        }
    }
    
    /**
     * Close search tips modal
     */
    function closeSearchTipsModal() {
        if (searchTipsModal) {
            searchTipsModal.style.display = 'none';
        }
    }
    
    /**
     * Toggle case context sidebar
     */
    function toggleCaseContext() {
        if (caseContextBar) {
            caseContextBar.classList.toggle('active');
            
            // Update button text based on state
            if (caseContextBar.classList.contains('active')) {
                caseContextToggleBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Close Info
                `;
            } else {
                caseContextToggleBtn.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    Case Info
                `;
            }
        }
    }
});
