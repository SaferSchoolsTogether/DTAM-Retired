/**
 * Onboarding JavaScript
 * Handles client-side functionality for the onboarding process
 */

// Store form data in sessionStorage when submitting
document.addEventListener('DOMContentLoaded', function() {
    // Case Info Form
    const caseInfoForm = document.getElementById('caseInfoForm');
    if (caseInfoForm) {
        caseInfoForm.addEventListener('submit', function(e) {
            const caseId = document.getElementById('caseId').value;
            const date = document.getElementById('date').value;
            const investigatorName = document.getElementById('investigatorName').value;
            const organization = document.getElementById('organization').value;
            
            // Store in sessionStorage
            const caseInfo = {
                caseId: caseId,
                date: date,
                investigatorName: investigatorName,
                organization: organization
            };
            sessionStorage.setItem('caseInfo', JSON.stringify(caseInfo));
            
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
                
                // Store student info in sessionStorage
                const studentInfo = {
                    name: studentName,
                    id: studentId,
                    grade: grade,
                    school: school,
                    dob: dob,
                    supportPlans: supportPlans,
                    otherPlanText: otherPlanText
                };
                sessionStorage.setItem('studentInfo', JSON.stringify(studentInfo));
            }
        });
    }
    
    // SOC Status Form
    const socStatusForm = document.getElementById('socStatusForm');
    if (socStatusForm) {
        socStatusForm.addEventListener('submit', function(e) {
            const socStatus = document.getElementById('socStatusInput').value;
            
            // Store in sessionStorage
            sessionStorage.setItem('socStatus', socStatus);
        });
    }
    
    // Discovery Method Form
    const discoveryMethodForm = document.getElementById('discoveryMethodForm');
    if (discoveryMethodForm) {
        discoveryMethodForm.addEventListener('submit', function(e) {
            const discoveryMethodValue = document.getElementById('discoveryMethodInput').value;
            
            // Parse the JSON string to get the object
            try {
                const discoveryMethod = JSON.parse(discoveryMethodValue);
                
                // Store in sessionStorage
                sessionStorage.setItem('discoveryMethod', JSON.stringify(discoveryMethod));
            } catch (error) {
                console.error('Error parsing discovery method:', error);
                // Store as a simple object with method property
                sessionStorage.setItem('discoveryMethod', JSON.stringify({
                    method: discoveryMethodValue
                }));
            }
        });
    }
    
    // Safety Assessment Form
    const safetyAssessmentForm = document.getElementById('safetyAssessmentForm');
    if (safetyAssessmentForm) {
        safetyAssessmentForm.addEventListener('submit', function(e) {
            const safetyAssessmentValue = document.getElementById('safetyAssessmentInput').value;
            
            // Parse the JSON string to get the object
            try {
                const safetyAssessment = JSON.parse(safetyAssessmentValue);
                
                // Store in sessionStorage
                sessionStorage.setItem('safetyAssessment', JSON.stringify(safetyAssessment));
            } catch (error) {
                console.error('Error parsing safety assessment:', error);
                sessionStorage.setItem('safetyAssessment', JSON.stringify({
                    enforcement: 'no',
                    means: 'no'
                }));
            }
        });
    }

    // Summary Form is now handled directly in summary.ejs
    
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
    
    // Try to get case info from sessionStorage
    let caseInfo = null;
    try {
        if (sessionStorage.getItem('caseInfo')) {
            caseInfo = JSON.parse(sessionStorage.getItem('caseInfo'));
        }
    } catch (error) {
        console.error('Error parsing case info from sessionStorage:', error);
    }
    
    if (caseIdInput && caseInfo?.caseId) {
        caseIdInput.value = caseInfo.caseId;
    }
    
    if (dateInput && caseInfo?.date) {
        dateInput.value = caseInfo.date;
    }
    
    if (investigatorNameInput && caseInfo?.investigatorName) {
        investigatorNameInput.value = caseInfo.investigatorName;
    }
    
    if (organizationInput && caseInfo?.organization) {
        organizationInput.value = caseInfo.organization;
    }
    
    // Student Info Form
    const studentInfoSection = document.getElementById('studentInfoSection');
    
    // Try to get student info from sessionStorage
    let studentInfo = null;
    try {
        if (sessionStorage.getItem('studentInfo')) {
            studentInfo = JSON.parse(sessionStorage.getItem('studentInfo'));
        }
    } catch (error) {
        console.error('Error parsing student info from sessionStorage:', error);
    }
    
    if (studentInfoSection && studentInfo) {
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
    // Clear sessionStorage
    sessionStorage.clear();
}
