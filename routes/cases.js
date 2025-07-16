/**
 * Case Management Routes
 * Handles routes related to case management, including:
 * - Dashboard and case listing views
 * - Case data retrieval and storage
 * - Case report generation
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Dashboard route
router.get('/dashboard', async (req, res) => {
  // If caseId is present, redirect to workstation landing page
  if (req.query.caseId) {
    return res.redirect(`/workstation?caseId=${req.query.caseId}`);
  }
  
  try {
    // Get all cases from Supabase
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).render('error', { message: 'Failed to load cases from database' });
    }
    
    // Format case data for display
    const cases = [];
    
    for (const caseData of casesData) {
      // Parse student info if available
      const studentInfo = caseData.student_info ? JSON.parse(caseData.student_info) : null;
      
      // Format case data
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status || 'Unknown',
        studentName: studentInfo?.name || 'Unknown',
        status: 'Active', // Default status
      };
      
      cases.push(formattedCase);
    }
    
    // Get the most recent case ID for active case highlighting
    const activeCaseId = casesData.length > 0 ? casesData[0].id : null;
    
    res.render('dashboard', { cases, activeCaseId });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
});

// Cases route
router.get('/cases', async (req, res) => {
  try {
    // Get all cases from Supabase
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).render('error', { message: 'Failed to load cases from database' });
    }
    
    // Format case data for display
    const cases = [];
    
    for (const caseData of casesData) {
      // Parse student info if available
      const studentInfo = caseData.student_info ? JSON.parse(caseData.student_info) : null;
      
      // Get platforms data for this case
      const { data: socsData, error: socsError } = await supabase
        .from('socs')
        .select('id')
        .eq('case_id', caseData.id);
        
      // Initialize platforms object
      const platforms = {
        instagram: false,
        tiktok: false,
        snapchat: false,
        x: false,
        discord: false,
        facebook: false,
        other: false
      };
      
      // If we have SOCs, check for platform data
      if (!socsError && socsData && socsData.length > 0) {
        for (const soc of socsData) {
          // Get platforms for this SOC
          const { data: platformsData, error: platformsError } = await supabase
            .from('platforms')
            .select('platform_name, username')
            .eq('soc_id', soc.id);
            
          if (!platformsError && platformsData) {
            // Mark platforms that have data
            for (const platform of platformsData) {
              if (platforms.hasOwnProperty(platform.platform_name)) {
                platforms[platform.platform_name] = !!platform.username;
              }
            }
          }
          
          // Check for photos
          const { data: photosData, error: photosError } = await supabase
            .from('photos')
            .select('platform')
            .eq('case_id', caseData.id)
            .eq('soc_id', soc.id);
            
          if (!photosError && photosData && photosData.length > 0) {
            // Mark platforms that have photos
            for (const photo of photosData) {
              if (platforms.hasOwnProperty(photo.platform)) {
                platforms[photo.platform] = true;
              }
            }
          }
        }
      }
      
      // Format case data
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status || 'Unknown',
        socName: studentInfo?.name || 'Unknown',
        status: 'Active', // Default status
        platforms: platforms
      };
      
      cases.push(formattedCase);
    }
    
    // Get the most recent case ID for active case highlighting
    const activeCaseId = casesData.length > 0 ? casesData[0].id : null;
    
    res.render('cases', { cases, activeCaseId });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).render('error', { message: 'Failed to load cases' });
  }
});

// API Routes
// Get all cases API endpoint
router.get('/api/cases', async (req, res) => {
  try {
    // Get all cases from Supabase
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch cases' });
    }
    
    // Format case data for response
    const cases = [];
    
    for (const caseData of casesData) {
      // Parse student info if available
      const studentInfo = caseData.student_info ? JSON.parse(caseData.student_info) : null;
      
      // Format case data
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status || 'Unknown',
        studentName: studentInfo?.name || 'Unknown',
        status: 'Active', // Default status
      };
      
      cases.push(formattedCase);
    }
    
    res.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Get case data
router.get('/api/case-data', async (req, res) => {
  try {
    // Get case ID from query parameter
    const caseId = req.query.caseId;
    
    if (!caseId) {
      // If no case ID provided, get the most recent case
      const { data: caseData, error } = await supabase
        .from('cases')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();
        
      if (error || !caseData) {
        console.error('Supabase error:', error);
        return res.status(404).json({ error: 'Case data not found' });
      }
      
      // Format response to match the expected format by the frontend
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status,
        discoveryMethod: caseData.discovery_method,
        safetyAssessment: caseData.safety_assessment,
        studentInfo: caseData.student_info ? JSON.parse(caseData.student_info) : null
      };
      
      return res.json({ case: formattedCase });
    }
    
    // Get specific case data from Supabase
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
      
    if (error || !caseData) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Case data not found' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedCase = {
      caseId: caseData.id,
      date: caseData.date,
      investigatorName: caseData.team_member_name,
      organization: caseData.organization,
      socStatus: caseData.soc_status,
      discoveryMethod: caseData.discovery_method,
      safetyAssessment: caseData.safety_assessment,
      studentInfo: caseData.student_info ? JSON.parse(caseData.student_info) : null
    };
    
    res.json({ case: formattedCase });
  } catch (error) {
    console.error('Error fetching case data:', error);
    res.status(500).json({ error: 'Failed to fetch case data' });
  }
});

// Set active case route
router.get('/set-active-case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const redirect = req.query.redirect || '/dashboard';
    
    // Get case data from Supabase
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).redirect('/dashboard?error=Case+not+found');
    }
    
    // Redirect to workstation with the case ID
    res.redirect(`${redirect}?caseId=${caseId}`);
  } catch (error) {
    console.error('Error setting active case:', error);
    res.status(500).redirect('/dashboard?error=Failed+to+set+active+case');
  }
});

// Save case data
router.post('/api/save-case', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['caseId', 'date', 'investigatorName', 'organization'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Format case data for Supabase
    const caseData = {
      id: req.body.caseId,
      date: req.body.date,
      team_member_name: req.body.investigatorName,
      organization: req.body.organization,
      soc_status: req.body.socStatus,
      discovery_method: req.body.discoveryMethod,
      safety_assessment: req.body.safetyAssessment,
      // Store student info as JSON
      student_info: req.body.studentInfo ? JSON.stringify(req.body.studentInfo) : null
    };
    
    // Upsert to Supabase (insert or update)
    const { data, error } = await supabase
      .from('cases')
      .upsert(caseData)
      .select();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save case data', 
        details: error.message 
      });
    }
    
    // Return same response format as before
    res.json({ success: true, caseId: data[0].id });
  } catch (error) {
    console.error('Error saving case data:', error);
    res.status(500).json({ error: 'Failed to save case data' });
  }
});

// Create new case route
router.post('/api/create-case', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['date', 'investigatorName', 'organization'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Generate a unique case ID if not provided
    const caseId = req.body.caseId || `CASE-${Date.now()}`;
    
    // Format case data for Supabase
    const caseData = {
      id: caseId,
      date: req.body.date,
      team_member_name: req.body.investigatorName,
      organization: req.body.organization,
      soc_status: req.body.socStatus || null,
      discovery_method: req.body.discoveryMethod || null,
      safety_assessment: req.body.safetyAssessment || null,
      // Store student info as JSON
      student_info: req.body.studentInfo ? JSON.stringify(req.body.studentInfo) : null
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('cases')
      .insert(caseData)
      .select();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to create case', 
        details: error.message 
      });
    }
    
    // Create a default SOC for this case
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .insert({
        case_id: caseId,
        name: req.body.studentInfo?.name || '',
        student_id: req.body.studentInfo?.id || '',
        grade: req.body.studentInfo?.grade || '',
        school: req.body.studentInfo?.school || '',
        dob: req.body.studentInfo?.dob || '',
        support_plans: req.body.studentInfo?.supportPlans ? JSON.stringify(req.body.studentInfo.supportPlans) : JSON.stringify([]),
        other_plan_text: req.body.studentInfo?.otherPlanText || '',
        status: req.body.socStatus || 'known'
      })
      .select();
      
    if (socError) {
      console.error('Error creating SOC:', socError);
      // Continue even if SOC creation fails
    }
    
    // Return success response with case ID
    res.json({ 
      success: true, 
      caseId: data[0].id,
      socId: socData && socData.length > 0 ? socData[0].id : null
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

module.exports = router;
