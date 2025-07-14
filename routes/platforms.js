/**
 * Platform-specific Routes
 * Handles routes related to platform management, including:
 * - Platform data retrieval and storage
 * - Platform workstation views
 * - Platform redirects
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

// Workstation landing page route
router.get('/workstation', (req, res) => {
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  // Handle onboarding data if present
  if (req.query.onboardingData) {
    try {
      // Parse the onboarding data
      const onboardingData = JSON.parse(req.query.onboardingData);
      
      // Save the case data
      if (onboardingData.caseInfo) {
        data.case = {
          caseId: onboardingData.caseInfo.caseId,
          date: onboardingData.caseInfo.date,
          investigatorName: onboardingData.caseInfo.investigatorName,
          organization: onboardingData.caseInfo.organization
        };
      }
      
      // Update SOC data if available
      if (onboardingData.studentInfo && activeSocId) {
        data.socs[activeSocId].name = onboardingData.studentInfo.name || '';
        data.socs[activeSocId].studentId = onboardingData.studentInfo.id || '';
        data.socs[activeSocId].grade = onboardingData.studentInfo.grade || '';
        data.socs[activeSocId].school = onboardingData.studentInfo.school || '';
        data.socs[activeSocId].dob = onboardingData.studentInfo.dob || '';
        data.socs[activeSocId].supportPlans = onboardingData.studentInfo.supportPlans || [];
        data.socs[activeSocId].otherPlanText = onboardingData.studentInfo.otherPlanText || '';
        data.socs[activeSocId].status = onboardingData.socStatus || 'known';
      }
      
      // Save the updated data
      writeData(data);
    } catch (error) {
      console.error('Error processing onboarding data:', error);
    }
  }
  
  res.render('workstation-landing', {
    socId: activeSocId,
    allSocs: Object.keys(data.socs),
    allSocsData: data.socs,
    activeSocId: activeSocId
  });
});

// Platform workstation route
router.get('/soc/:socId/platform/:platform', (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).send('SOC not found');
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).send('Platform not found');
  }
  
  // Update active SOC
  data.activeSocId = socId;
  writeData(data);
  
  res.render('workstation', {
    socId: socId,
    platform: platform,
    platformData: data.socs[socId].platforms[platform],
    socData: data.socs[socId],
    allPlatforms: Object.keys(data.socs[socId].platforms),
    allSocs: Object.keys(data.socs),
    allSocsData: data.socs,
    activeSocId: data.activeSocId
  });
});

// Redirect from old route to new route with active SOC
router.get('/platform/:platform', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  res.redirect(`/soc/${activeSocId}/platform/${platform}`);
});

// Get platform data
router.get('/api/soc/:socId/platform/:platform', (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  res.json(data.socs[socId].platforms[platform]);
});

// Update platform info
router.post('/api/soc/:socId/platform/:platform', (req, res) => {
  const { socId, platform } = req.params;
  const { username, displayName, url } = req.body;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  data.socs[socId].platforms[platform].username = username || data.socs[socId].platforms[platform].username;
  data.socs[socId].platforms[platform].displayName = displayName || data.socs[socId].platforms[platform].displayName;
  data.socs[socId].platforms[platform].url = url || data.socs[socId].platforms[platform].url;
  
  writeData(data);
  res.json(data.socs[socId].platforms[platform]);
});

module.exports = router;
