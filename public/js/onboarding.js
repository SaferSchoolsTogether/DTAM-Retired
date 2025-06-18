/**
 * Onboarding JavaScript
 * Handles client-side functionality for the onboarding process
 */

// Store form data in localStorage when submitting
document.addEventListener('DOMContentLoaded', function() {
    // Case Info Form
    const caseInfoForm = document.getElementById('caseInfoForm');
    if (caseInfoForm) {
        caseInfoForm.addEventListener('submit', function(e) {
            const caseId = document.getElementById('caseId').value;
            const date = document.getElementById('date').value;
            const investigatorName = document.getElementById('investigatorName').value;
            const organization = document.getElementById('organization').value;
            
            // Store in localStorage
            localStorage.setItem('caseId', caseId);
            localStorage.setItem('date', date);
            localStorage.setItem('investigatorName', investigatorName);
            localStorage.setItem('organization', organization);
        });
    }
    
    // SOC Status Form
    const socStatusForm = document.getElementById('socStatusForm');
    if (socStatusForm) {
        socStatusForm.addEventListener('submit', function(e) {
            const socStatus = document.getElementById('socStatusInput').value;
            
            // Store in localStorage
            localStorage.setItem('socStatus', socStatus);
        });
    }
    
    // Safety Assessment Form
    const safetyAssessmentForm = document.getElementById('safetyAssessmentForm');
    if (safetyAssessmentForm) {
        safetyAssessmentForm.addEventListener('submit', function(e) {
            const safetyAssessment = document.getElementById('safetyAssessmentInput').value;
            
            // Store in localStorage
            localStorage.setItem('safetyAssessment', safetyAssessment);
        });
    }
    
    // Platform Info Form
    const platformInfoForm = document.getElementById('platformInfoForm');
    if (platformInfoForm) {
        platformInfoForm.addEventListener('submit', function(e) {
            const platformData = document.getElementById('platformDataInput').value;
            
            // Store in localStorage
            localStorage.setItem('platformData', platformData);
        });
    }
    
    // Pre-fill forms with stored data
    prefillForms();
});

// Pre-fill forms with stored data
function prefillForms() {
    // Case Info Form
    const caseIdInput = document.getElementById('caseId');
    const dateInput = document.getElementById('date');
    const investigatorNameInput = document.getElementById('investigatorName');
    const organizationInput = document.getElementById('organization');
    
    if (caseIdInput && localStorage.getItem('caseId')) {
        caseIdInput.value = localStorage.getItem('caseId');
    }
    
    if (dateInput && localStorage.getItem('date')) {
        dateInput.value = localStorage.getItem('date');
    }
    
    if (investigatorNameInput && localStorage.getItem('investigatorName')) {
        investigatorNameInput.value = localStorage.getItem('investigatorName');
    }
    
    if (organizationInput && localStorage.getItem('organization')) {
        organizationInput.value = localStorage.getItem('organization');
    }
}

// Clear onboarding data
function clearOnboardingData() {
    localStorage.removeItem('caseId');
    localStorage.removeItem('date');
    localStorage.removeItem('investigatorName');
    localStorage.removeItem('organization');
    localStorage.removeItem('socStatus');
    localStorage.removeItem('safetyAssessment');
    localStorage.removeItem('platformData');
    localStorage.removeItem('onboardingData');
}
