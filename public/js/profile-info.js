// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile info event listeners
    initProfileInfoEventListeners();
});

// Initialize profile info event listeners
function initProfileInfoEventListeners() {
    // Profile info fields
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const profileUrlInput = document.getElementById('profileUrl');
    
    // Add event listeners for profile info fields
    if (usernameInput) {
        usernameInput.addEventListener('change', function() {
            saveProfileInfo();
        });
    }
    
    if (displayNameInput) {
        displayNameInput.addEventListener('change', function() {
            saveProfileInfo();
        });
    }
    
    if (profileUrlInput) {
        profileUrlInput.addEventListener('change', function() {
            saveProfileInfo();
        });
    }
}

// Save profile info
function saveProfileInfo() {
    const username = document.getElementById('username').value.trim();
    const displayName = document.getElementById('displayName').value.trim();
    const url = document.getElementById('profileUrl').value.trim();
    
    const saveIndicator = document.getElementById('saveIndicator');
    
    // Get the full platform name from the URL instead of the abbreviated text
    const platformUrl = document.querySelector('.platform-icon.active').getAttribute('href');
    const platform = platformUrl.split('/').pop(); // Extract platform name from URL
    
    // Show saving indicator
    saveIndicator.innerHTML = `
        <span class="loading-spinner"></span>
        Saving profile info...
    `;
    
    fetch(`/api/platform/${platform}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            displayName,
            url
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update profile info');
        }
        return response.json();
    })
    .then(data => {
        // Show saved indicator
        saveIndicator.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Profile info saved
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
            Failed to save profile info
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
