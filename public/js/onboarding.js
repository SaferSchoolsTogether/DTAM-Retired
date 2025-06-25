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
            
            // Get student information if section is visible
            if (document.getElementById('studentInfoSection').style.display !== 'none') {
                const studentName = document.getElementById('studentName').value;
                const studentId = document.getElementById('studentId').value;
                const grade = document.getElementById('grade').value;
                const school = document.getElementById('school').value;
                const dob = document.getElementById('dob').value;
                
                // Get selected support plans
                const supportPlans = [];
                document.querySelectorAll('input[name="supportPlans"]:checked').forEach(checkbox => {
                    supportPlans.push(checkbox.value);
                });
                
                // Get "Other" plan text if applicable
                const otherPlanText = document.getElementById('otherPlanText').value;
                
                // Store student info in localStorage
                const studentInfo = {
                    name: studentName,
                    id: studentId,
                    grade: grade,
                    school: school,
                    dob: dob,
                    supportPlans: supportPlans,
                    otherPlanText: otherPlanText
                };
                
                localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
            }
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
    
    // Discovery Method Form
    const discoveryMethodForm = document.getElementById('discoveryMethodForm');
    if (discoveryMethodForm) {
        discoveryMethodForm.addEventListener('submit', function(e) {
            const discoveryMethod = document.getElementById('discoveryMethodInput').value;
            
            // Store in localStorage
            localStorage.setItem('discoveryMethod', discoveryMethod);
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
    
    // Student Info Form
    const studentInfoSection = document.getElementById('studentInfoSection');
    if (studentInfoSection && localStorage.getItem('studentInfo')) {
        const studentInfo = JSON.parse(localStorage.getItem('studentInfo'));
        
        // Fill in student info fields
        if (document.getElementById('studentName')) {
            document.getElementById('studentName').value = studentInfo.name || '';
        }
        
        if (document.getElementById('studentId')) {
            document.getElementById('studentId').value = studentInfo.id || '';
        }
        
        if (document.getElementById('grade')) {
            document.getElementById('grade').value = studentInfo.grade || '';
        }
        
        if (document.getElementById('school')) {
            document.getElementById('school').value = studentInfo.school || '';
        }
        
        if (document.getElementById('dob')) {
            document.getElementById('dob').value = studentInfo.dob || '';
        }
        
        // Check support plan checkboxes
        if (studentInfo.supportPlans && studentInfo.supportPlans.length > 0) {
            studentInfo.supportPlans.forEach(plan => {
                const checkbox = document.querySelector(`input[name="supportPlans"][value="${plan}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    
                    // Show "Other" text field if applicable
                    if (plan === 'Other' && document.getElementById('otherPlanText')) {
                        document.getElementById('otherPlanText').style.display = 'inline-block';
                        document.getElementById('otherPlanText').value = studentInfo.otherPlanText || '';
                    }
                }
            });
        }
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
    localStorage.removeItem('discoveryMethod');
    localStorage.removeItem('onboardingData');
    localStorage.removeItem('studentInfo');
}
