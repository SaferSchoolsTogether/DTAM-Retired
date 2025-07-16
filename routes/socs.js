/**
 * SOC Management Routes
 * Handles routes related to Student of Concern (SOC) management, including:
 * - SOC data retrieval and storage
 * - SOC creation and updates
 * - Active SOC management
 * - SOC report generation
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

// Get SOC data
router.get('/api/soc/:socId', async (req, res) => {
  try {
    const { socId } = req.params;
    
    // Get SOC data from Supabase
    const { data: socData, error } = await supabase
      .from('socs')
      .select('*')
      .eq('id', socId)
      .single();
      
    if (error || !socData) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'SOC not found' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedSoc = {
      id: socData.id,
      name: socData.name || '',
      studentId: socData.student_id || '',
      grade: socData.grade || '',
      school: socData.school || '',
      dob: socData.dob || '',
      supportPlans: socData.support_plans || [],
      otherPlanText: socData.other_plan_text || '',
      status: socData.status || 'known'
    };
    
    res.json(formattedSoc);
  } catch (error) {
    console.error('Error fetching SOC data:', error);
    res.status(500).json({ error: 'Failed to fetch SOC data' });
  }
});

// Get all SOCs
router.get('/api/socs', async (req, res) => {
  try {
    // Get case ID from query parameter
    const caseId = req.query.caseId;
    
    // Get SOCs from Supabase
    let query = supabase.from('socs').select('*');
    
    // Filter by case ID if provided
    if (caseId) {
      query = query.eq('case_id', caseId);
    }
    
    const { data: socsData, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch SOCs' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedSocs = {};
    
    for (const soc of socsData) {
      formattedSocs[soc.id] = {
        id: soc.id,
        name: soc.name || '',
        studentId: soc.student_id || '',
        grade: soc.grade || '',
        school: soc.school || '',
        dob: soc.dob || '',
        supportPlans: soc.support_plans || [],
        otherPlanText: soc.other_plan_text || '',
        status: soc.status || 'known'
      };
    }
    
    res.json(formattedSocs);
  } catch (error) {
    console.error('Error fetching SOCs:', error);
    res.status(500).json({ error: 'Failed to fetch SOCs' });
  }
});

// Create new SOC
router.post('/api/socs', async (req, res) => {
  try {
    const { name, studentId, grade, school, dob, supportPlans, otherPlanText, status, caseId } = req.body;
    
    // Validate required fields
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if case exists
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .single();
      
    if (caseError || !caseData) {
      console.error('Supabase error checking case:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Create new SOC in Supabase
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .insert({
        case_id: caseId,
        name: name || '',
        student_id: studentId || '',
        grade: grade || '',
        school: school || '',
        dob: dob || '',
        support_plans: supportPlans || [],
        other_plan_text: otherPlanText || '',
        status: status || 'potential'
      })
      .select();
      
    if (socError) {
      console.error('Supabase error creating SOC:', socError);
      return res.status(500).json({ 
        error: 'Failed to create SOC', 
        details: socError.message 
      });
    }
    
    // Create default platform entries for this SOC
    const platforms = ['instagram', 'tiktok', 'snapchat', 'x', 'discord', 'facebook', 'other'];
    
    for (const platform of platforms) {
      const { error: platformError } = await supabase
        .from('platforms')
        .insert({
          soc_id: socData[0].id,
          platform_name: platform,
          username: '',
          display_name: '',
          profile_url: ''
        });
        
      if (platformError) {
        console.error(`Error creating platform ${platform}:`, platformError);
        // Continue even if platform creation fails
      }
    }
    
    // Create upload directories for the new SOC
    const fs = require('fs-extra');
    const path = require('path');
    
    platforms.forEach(platform => {
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', socData[0].id, platform);
      fs.ensureDirSync(uploadDir);
    });
    
    // Format response to match the expected format by the frontend
    const formattedSoc = {
      id: socData[0].id,
      name: socData[0].name || '',
      studentId: socData[0].student_id || '',
      grade: socData[0].grade || '',
      school: socData[0].school || '',
      dob: socData[0].dob || '',
      supportPlans: socData[0].support_plans || [],
      otherPlanText: socData[0].other_plan_text || '',
      status: socData[0].status || 'potential'
    };
    
    res.json(formattedSoc);
  } catch (error) {
    console.error('Error creating SOC:', error);
    res.status(500).json({ error: 'Failed to create SOC' });
  }
});

// Update SOC
router.put('/api/soc/:socId', async (req, res) => {
  try {
    const { socId } = req.params;
    const { name, studentId, grade, school, dob, supportPlans, otherPlanText, status } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (studentId !== undefined) updateData.student_id = studentId;
    if (grade !== undefined) updateData.grade = grade;
    if (school !== undefined) updateData.school = school;
    if (dob !== undefined) updateData.dob = dob;
    if (supportPlans !== undefined) updateData.support_plans = supportPlans;
    if (otherPlanText !== undefined) updateData.other_plan_text = otherPlanText;
    if (status !== undefined) updateData.status = status;
    
    // Update SOC in Supabase
    const { data: socData, error } = await supabase
      .from('socs')
      .update(updateData)
      .eq('id', socId)
      .select();
      
    if (error) {
      console.error('Supabase error updating SOC:', error);
      return res.status(500).json({ 
        error: 'Failed to update SOC', 
        details: error.message 
      });
    }
    
    if (!socData || socData.length === 0) {
      return res.status(404).json({ error: 'SOC not found' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedSoc = {
      id: socData[0].id,
      name: socData[0].name || '',
      studentId: socData[0].student_id || '',
      grade: socData[0].grade || '',
      school: socData[0].school || '',
      dob: socData[0].dob || '',
      supportPlans: socData[0].support_plans || [],
      otherPlanText: socData[0].other_plan_text || '',
      status: socData[0].status || 'known'
    };
    
    res.json(formattedSoc);
  } catch (error) {
    console.error('Error updating SOC:', error);
    res.status(500).json({ error: 'Failed to update SOC' });
  }
});

// Set active SOC
router.post('/api/active-soc/:socId', async (req, res) => {
  try {
    const { socId } = req.params;
    const { caseId } = req.body;
    
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if SOC exists and belongs to the case
    const { data: socData, error } = await supabase
      .from('socs')
      .select('id')
      .eq('id', socId)
      .eq('case_id', caseId)
      .single();
      
    if (error || !socData) {
      console.error('Supabase error checking SOC:', error);
      return res.status(404).json({ error: 'SOC not found or does not belong to this case' });
    }
    
    // We don't need to store the active SOC in the database
    // The client can keep track of it in the session
    
    res.json({ success: true, activeSocId: socId });
  } catch (error) {
    console.error('Error setting active SOC:', error);
    res.status(500).json({ error: 'Failed to set active SOC' });
  }
});

// Get active SOC
router.get('/api/active-soc', async (req, res) => {
  try {
    const { caseId } = req.query;
    
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Get the first SOC for this case
    const { data: socData, error } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId)
      .order('id', { ascending: true })
      .limit(1)
      .single();
      
    if (error) {
      console.error('Supabase error fetching SOC:', error);
      return res.status(404).json({ error: 'No SOCs found for this case' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedSoc = {
      id: socData.id,
      name: socData.name || '',
      studentId: socData.student_id || '',
      grade: socData.grade || '',
      school: socData.school || '',
      dob: socData.dob || '',
      supportPlans: socData.support_plans || [],
      otherPlanText: socData.other_plan_text || '',
      status: socData.status || 'known'
    };
    
    res.json({ 
      activeSocId: socData.id,
      socData: formattedSoc
    });
  } catch (error) {
    console.error('Error fetching active SOC:', error);
    res.status(500).json({ error: 'Failed to fetch active SOC' });
  }
});

// Generate report for a SOC (all platforms)
router.get('/api/soc/:socId/report', async (req, res) => {
  try {
    const { socId } = req.params;
    
    // Get SOC data from Supabase
    const { data: socData, error } = await supabase
      .from('socs')
      .select('*')
      .eq('id', socId)
      .single();
      
    if (error || !socData) {
      console.error('Supabase error fetching SOC:', error);
      return res.status(404).json({ error: 'SOC not found' });
    }
    
    // Get platforms for this SOC
    const { data: platformsData, error: platformsError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId);
      
    if (platformsError) {
      console.error('Supabase error fetching platforms:', platformsError);
      return res.status(500).json({ error: 'Failed to fetch platforms' });
    }
    
    // Format platforms data
    const platforms = {};
    
    for (const platform of platformsData) {
      platforms[platform.platform_name] = {
        username: platform.username || '',
        displayName: platform.display_name || '',
        profileUrl: platform.profile_url || ''
      };
    }
    
    // Format response to match the expected format by the frontend
    const formattedSoc = {
      id: socData.id,
      name: socData.name || '',
      studentId: socData.student_id || '',
      grade: socData.grade || '',
      school: socData.school || '',
      dob: socData.dob || '',
      supportPlans: socData.support_plans || [],
      otherPlanText: socData.other_plan_text || '',
      status: socData.status || 'known',
      platforms: platforms
    };
    
    // For now, just return the SOC data
    // In the future, this would generate a PDF with all platforms
    res.json(formattedSoc);
  } catch (error) {
    console.error('Error generating SOC report:', error);
    res.status(500).json({ error: 'Failed to generate SOC report' });
  }
});

module.exports = router;
