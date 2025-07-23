/**
 * Workstation Landing Page JavaScript
 * Handles interactions for the workstation landing page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Case Context Toggle Button
    const caseContextToggleBtn = document.getElementById('caseContextToggleBtn');
    const caseContextBar = document.querySelector('.case-context-bar');
    
    // Search tools buttons
    const whatsmynameBtn = document.getElementById('whatsmynameBtn');
    const googleBtn = document.getElementById('googleBtn');
    const searchTipsBtn = document.getElementById('searchTipsBtn');
    
    // Modal elements
    const searchTipsModal = document.getElementById('searchTipsModal');
    const closeSearchTipsBtn = document.getElementById('closeSearchTipsBtn');
    
    // Initialize
    init();
    
    /**
     * Initialize the page
     */
    function init() {
        // Add event listeners
        if (caseContextToggleBtn && caseContextBar) {
            caseContextToggleBtn.addEventListener('click', toggleCaseContext);
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
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === searchTipsModal) {
                closeSearchTipsModal();
            }
        });
    }
    
    /**
     * Open WhatsMyName in a new tab
     */
    function openWhatsMyName() {
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
    
    /**
     * Open Google search in a new tab
     */
    function openGoogleSearch() {
        // Get SOC name from case context if available
        let socName = '';
        const socNameElement = document.querySelector('.case-context-bar .soc-name');
        
        if (socNameElement && socNameElement.textContent) {
            socName = socNameElement.textContent.trim();
            window.open(`https://www.google.com/search?q=${encodeURIComponent(socName + " social media")}`, '_blank');
        } else {
            window.open('https://www.google.com', '_blank');
        }
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
