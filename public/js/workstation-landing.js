/**
 * Workstation Landing Page JavaScript
 * Handles interactions for the workstation landing page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Case Context Toggle Button
    const caseContextToggleBtn = document.getElementById('caseContextToggleBtn');
    const caseContextBar = document.querySelector('.case-context-bar');
    
    if (caseContextToggleBtn && caseContextBar) {
        caseContextToggleBtn.addEventListener('click', function() {
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
        });
    }
    
    // Help button - placeholder for future functionality
    const helpButton = document.querySelector('.help-button');
    if (helpButton) {
        helpButton.addEventListener('click', function() {
            // This will be implemented in a future phase
            alert('Account search functionality will be implemented in a future update.');
        });
    }
});
