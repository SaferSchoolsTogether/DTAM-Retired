/**
 * Navigation functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Active case indicator has been removed as it's no longer relevant
    // checkActiveCase();
    
    // Fetch user session and update UI
    fetchUserSession();
    
    // Set up logout functionality
    setupLogout();
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            // Check if click is outside the mobile menu and the toggle button
            if (!mobileMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                mobileMenu.classList.remove('active');
            }
        }
    });
    
    // Handle dropdown on touch devices
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const parent = this.closest('.nav-dropdown');
            const content = parent.querySelector('.dropdown-content');
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                if (dropdown !== content) {
                    dropdown.style.display = 'none';
                }
            });
            
            // Toggle this dropdown
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    });
    
    // Function to check for active case and display indicator - removed as no longer relevant
    function checkActiveCase() {
        // Functionality removed as active case indicator is no longer needed
        // This empty function is kept to maintain code structure in case other parts of the app reference it
    }
    
    // Fetch user session and update profile display
    async function fetchUserSession() {
        try {
            const response = await fetch('/api/auth/session');
            const data = await response.json();
            
            if (data.authenticated) {
                // Update user name in navigation
                const userFirstNameElement = document.getElementById('userFirstName');
                const mobileUserFirstNameElement = document.getElementById('mobileUserFirstName');
                
                if (userFirstNameElement) {
                    userFirstNameElement.textContent = data.user.firstName;
                }
                
                if (mobileUserFirstNameElement) {
                    mobileUserFirstNameElement.textContent = data.user.firstName;
                }
            } else {
                // Redirect to login if not authenticated and not already on login/register page
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.error('Error fetching user session:', error);
            
            // Handle error - redirect to login if not on login/register page
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/register') {
                window.location.href = '/login';
            }
        }
    }
    
    // Set up logout functionality
    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        
        const handleLogout = async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Redirect to login page after successful logout
                    window.location.href = '/login';
                } else {
                    console.error('Logout failed');
                }
            } catch (error) {
                console.error('Error during logout:', error);
            }
        };
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', handleLogout);
        }
    }
});
