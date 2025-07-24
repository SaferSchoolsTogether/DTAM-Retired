/**
 * Platform Profile JavaScript
 * Handles platform profile panel functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const platformProfilePanel = document.getElementById('platformProfilePanel');
    const platformProfileOverlay = document.getElementById('platformProfileOverlay');
    const platformProfileCloseBtn = document.getElementById('platformProfileCloseBtn');
    const platformInfoToggleBtn = document.getElementById('platformInfoToggleBtn');
    const whatsmynameBtn = document.getElementById('whatsmynameBtn');
    const googleBtn = document.getElementById('googleBtn');
    const searchTipsBtn = document.getElementById('searchTipsBtn');
    const searchTipsModal = document.getElementById('searchTipsModal');
    const closeSearchTipsBtn = document.getElementById('closeSearchTipsBtn');
    const platformIcons = document.querySelectorAll('.platform-icon');
    
    // Initialize
    init();
    
    /**
     * Initialize the platform profile functionality
     */
    function init() {
        // Add event listeners
        if (platformInfoToggleBtn) {
            platformInfoToggleBtn.addEventListener('click', togglePlatformProfile);
        }
        
        if (platformProfileCloseBtn) {
            platformProfileCloseBtn.addEventListener('click', closePlatformProfile);
        }
        
        if (platformProfileOverlay) {
            platformProfileOverlay.addEventListener('click', closePlatformProfile);
        }
        
        // Add click event to platform icons to show profile
        platformIcons.forEach(icon => {
            icon.addEventListener('click', function(e) {
                // Only handle the click if it's the active platform
                if (icon.classList.contains('active')) {
                    e.preventDefault();
                    togglePlatformProfile();
                }
            });
        });
        
        // Search buttons
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
     * Toggle platform profile panel
     */
    function togglePlatformProfile() {
        if (platformProfilePanel && platformProfileOverlay) {
            if (platformProfilePanel.classList.contains('active')) {
                closePlatformProfile();
            } else {
                openPlatformProfile();
            }
        }
    }
    
    /**
     * Open platform profile panel
     */
    function openPlatformProfile() {
        if (platformProfilePanel && platformProfileOverlay) {
            platformProfilePanel.classList.add('active');
            platformProfileOverlay.classList.add('active');
            
            // Add click event listener to the overlay to close the panel when clicked
            platformProfileOverlay.addEventListener('click', function(e) {
                // Only close if the click was directly on the overlay, not on the panel
                if (e.target === platformProfileOverlay) {
                    closePlatformProfile();
                }
            }, { once: true }); // Use once: true to prevent multiple listeners
        }
    }
    
    /**
     * Close platform profile panel
     */
    function closePlatformProfile() {
        if (platformProfilePanel && platformProfileOverlay) {
            platformProfilePanel.classList.remove('active');
            platformProfileOverlay.classList.remove('active');
        }
    }
    
    /**
     * Open WhatsMyName in a new tab
     */
    function openWhatsMyName() {
        window.open('https://whatsmyname.app', '_blank');
    }
    
    /**
     * Open Google search in a new tab
     */
    function openGoogleSearch() {
        // Check if this is an unknown threat
        const isUnknownThreat = document.body.hasAttribute('data-unknown-threat');
        
        // Get search terms based on whether this is an unknown threat or not
        let searchTerms = '';
        
        if (isUnknownThreat) {
            // For unknown threats, use the platform name and "threat evidence"
            const platformTitle = document.querySelector('.platform-title');
            let platformName = '';
            
            if (platformTitle && platformTitle.textContent) {
                platformName = platformTitle.textContent.trim().split(' ')[0]; // Get first word (platform name)
            }
            
            searchTerms = `${platformName} threat evidence analysis`;
        } else {
            // For known SOCs, use the SOC name and platform
            let socName = '';
            const socNameElement = document.querySelector('.case-context-bar .soc-name');
            
            if (socNameElement && socNameElement.textContent) {
                socName = socNameElement.textContent.trim();
            }
            
            // Get platform name
            const platformTitle = document.querySelector('.platform-title');
            let platformName = '';
            
            if (platformTitle && platformTitle.textContent) {
                platformName = platformTitle.textContent.trim().split(' ')[0]; // Get first word (platform name)
            }
            
            searchTerms = `${socName} ${platformName} social media profile`;
        }
        
        // Construct search query
        const searchQuery = encodeURIComponent(searchTerms);
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    }
    
    /**
     * Open search tips modal
     */
    function openSearchTipsModal() {
        if (searchTipsModal) {
            searchTipsModal.classList.add('active');
        }
    }
    
    /**
     * Close search tips modal
     */
    function closeSearchTipsModal() {
        if (searchTipsModal) {
            searchTipsModal.classList.remove('active');
        }
    }
    
    // Export functions for global access
    window.togglePlatformProfile = togglePlatformProfile;
    window.openPlatformProfile = openPlatformProfile;
    window.closePlatformProfile = closePlatformProfile;
});
