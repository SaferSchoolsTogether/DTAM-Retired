/**
 * Case Management Routes
 * Handles routes related to case management, including:
 * - Dashboard and case listing views
 * - Case data retrieval and storage
 * - Case report generation
 */

const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const supabase = require('../config/supabase');

// Helper functions
function readData() {
  const DATA_FILE = path.join(__dirname, '..', 'data', 'app-data.json');
  return fs.readJsonSync(DATA_FILE);
}

function writeData(data) {
  const DATA_FILE = path.join(__dirname, '..', 'data', 'app-data.json');
  return fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

// Dashboard route
router.get('/dashboard', (req, res) => {
  // Get case data for the dashboard
  const data = readData();
  
  // Format case data for display
  const cases = [];
  if (data.case && data.case.caseId) {
    // Add status field to case data
    const caseWithStatus = {
      ...data.case,
      status: 'Active', // Default status
      socName: data.socs[data.activeSocId]?.name || 'Unknown',
      platforms: {}
    };
    
    // Check which platforms have data
    Object.keys(data.socs[data.activeSocId].platforms).forEach(platform => {
      const platformData = data.socs[data.activeSocId].platforms[platform];
      caseWithStatus.platforms[platform] = platformData.username || platformData.photos.length > 0;
    });
    
    cases.push(caseWithStatus);
  }
  
  res.render('dashboard', { cases });
});

// Cases route
router.get('/cases', (req, res) => {
  // Get case data
  const data = readData();
  
  // Format case data for display
  const cases = [];
  if (data.case && data.case.caseId) {
    // Add status field to case data
    const caseWithStatus = {
      ...data.case,
      status: 'Active', // Default status
      socName: data.socs[data.activeSocId]?.name || 'Unknown',
      platforms: {}
    };
    
    // Check which platforms have data
    Object.keys(data.socs[data.activeSocId].platforms).forEach(platform => {
      const platformData = data.socs[data.activeSocId].platforms[platform];
      caseWithStatus.platforms[platform] = platformData.username || platformData.photos.length > 0;
    });
    
    cases.push(caseWithStatus);
  }
  
  res.render('cases', { cases });
});

// API Routes
// Get case data
router.get('/api/case-data', async (req, res) => {
  try {
    // Get case data from Supabase
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error('Supabase error:', error);
      
      // Fallback to local JSON file if Supabase fails
      const localData = readData();
      if (!localData.case || !localData.case.caseId) {
        return res.status(404).json({ error: 'Case data not found' });
      }
      return res.json({ case: localData.case });
    }
    
    if (!caseData) {
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
    
    // Also update the local JSON file for backward compatibility during migration
    const localData = readData();
    localData.case = {
      caseId: req.body.caseId,
      date: req.body.date,
      team_member_name: req.body.investigatorName,
      organization: req.body.organization,
      socStatus: req.body.socStatus,
      discoveryMethod: req.body.discoveryMethod,
      safetyAssessment: req.body.safetyAssessment,
      studentInfo: req.body.studentInfo
    };
    writeData(localData);
    
    // Return same response format as before
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving case data:', error);
    res.status(500).json({ error: 'Failed to save case data' });
  }
});

module.exports = router;
