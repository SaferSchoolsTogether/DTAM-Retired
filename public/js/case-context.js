// Global variables for case context
let caseContextCollapsed = false;
let helpPanelCollapsed = true;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load case data
    loadCaseData();

    // Check if case context bar state is saved in localStorage
    const savedState = localStorage.getItem('caseContextCollapsed');
    if (savedState === 'true') {
        toggleCaseContext(true);
    }
    
    // Check if help panel state is saved in localStorage
    const helpPanelState = localStorage.getItem('helpPanelCollapsed');
    if (helpPanelState === 'false') {
        toggleHelpPanel(false);
    }

    // Event listeners for case context and help panel
    initCaseContextEventListeners();
});

// Load case data
function loadCaseData() {
    // Get the current SOC ID from the page data
    const socId = document.body.dataset.socId || window.currentSocId || 'soc_1';
    
    // First, fetch the case data
    fetch('/api/case-data')
        .then(response => {
            if (!response.ok) {
                // If no specific endpoint exists, we'll fetch the whole app-data.json
                return fetch('/data/app-data.json');
            }
            return response;
        })
        .then(response => response.json())
        .then(data => {
            // Store the case data
            const caseData = data.case;
            
            // Now fetch the active SOC data
            return fetch(`/api/soc/${socId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch SOC data');
                    }
                    return response.json();
                })
                .then(socData => {
                    // Populate the case context with both case and SOC data
                    populateCaseContext(caseData, socData);
                })
                .catch(error => {
                    console.error('Error loading SOC data:', error);
                    // If we can't get SOC data, still populate with case data
                    populateCaseContext(caseData);
                });
        })
        .catch(error => {
            console.error('Error loading case data:', error);
        });
}

// Populate case context
function populateCaseContext(caseData, socData) {
    // Set case ID and date
    document.getElementById('caseId').textContent = caseData.caseId || 'N/A';
    document.getElementById('caseDate').textContent = caseData.date || 'N/A';
    
    // Set investigator name
    document.getElementById('investigatorName').textContent = caseData.investigatorName || 'N/A';
    
    // Set student info - prioritize SOC data if available
    if (socData && socData.name) {
        document.getElementById('studentName').textContent = socData.name || 'N/A';
        document.getElementById('studentGrade').textContent = socData.grade || 'N/A';
    } else if (caseData.studentInfo) {
        document.getElementById('studentName').textContent = caseData.studentInfo.name || 'N/A';
        document.getElementById('studentGrade').textContent = caseData.studentInfo.grade || 'N/A';
    } else {
        document.getElementById('studentName').textContent = 'N/A';
        document.getElementById('studentGrade').textContent = 'N/A';
    }
    
    // Set SOC status - prioritize SOC data if available
    document.getElementById('socStatus').textContent = (socData && socData.status) ? socData.status : (caseData.socStatus || 'N/A');
}

// Toggle case context
function toggleCaseContext(forceCollapse) {
    const caseContextBar = document.getElementById('caseContextBar');
    const toggleText = document.querySelector('.case-context-toggle-text');
    
    if (forceCollapse === true || !caseContextBar.classList.contains('collapsed')) {
        // Collapse
        caseContextBar.classList.add('collapsed');
        caseContextCollapsed = true;
        if (toggleText) toggleText.textContent = 'Expand';
    } else {
        // Expand
        caseContextBar.classList.remove('collapsed');
        caseContextCollapsed = false;
        if (toggleText) toggleText.textContent = 'Collapse';
    }
    
    // Save state to localStorage
    localStorage.setItem('caseContextCollapsed', caseContextCollapsed);
}

// Toggle help panel
function toggleHelpPanel(forceCollapse) {
    const helpPanel = document.getElementById('helpPanel');
    const toggleText = document.querySelector('.help-panel-toggle-text');
    
    if (forceCollapse === true || !helpPanel.classList.contains('collapsed')) {
        // Collapse
        helpPanel.classList.add('collapsed');
        helpPanelCollapsed = true;
        if (toggleText) toggleText.textContent = 'Expand';
    } else {
        // Expand
        helpPanel.classList.remove('collapsed');
        helpPanelCollapsed = false;
        if (toggleText) toggleText.textContent = 'Collapse';
    }
    
    // Save state to localStorage
    localStorage.setItem('helpPanelCollapsed', helpPanelCollapsed);
}

// Initialize event listeners for case context
function initCaseContextEventListeners() {
    // Case context toggle
    const caseContextToggle = document.getElementById('caseContextToggle');
    if (caseContextToggle) {
        caseContextToggle.addEventListener('click', () => toggleCaseContext());
    }
    
    // Help panel toggle
    const helpPanelToggle = document.getElementById('helpPanelToggle');
    if (helpPanelToggle) {
        helpPanelToggle.addEventListener('click', () => toggleHelpPanel());
    }
}
