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
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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

// Get SOC data
router.get('/api/soc/:socId', (req, res) => {
  const { socId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  res.json(data.socs[socId]);
});

// Get all SOCs
router.get('/api/socs', (req, res) => {
  const data = readData();
  res.json(data.socs);
});

// Create new SOC
router.post('/api/socs', (req, res) => {
  const { name, studentId, grade, school, dob, supportPlans, otherPlanText, status } = req.body;
  const data = readData();
  
  const socId = `soc_${uuidv4().substring(0, 8)}`;
  
  data.socs[socId] = {
    id: socId,
    name: name || '',
    studentId: studentId || '',
    grade: grade || '',
    school: school || '',
    dob: dob || '',
    supportPlans: supportPlans || [],
    otherPlanText: otherPlanText || '',
    status: status || 'potential',
    platforms: {
      instagram: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      tiktok: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      snapchat: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      x: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      discord: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      facebook: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      other: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      }
    }
  };
  
  // Create directories for the new SOC
  Object.keys(data.socs[socId].platforms).forEach(platform => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', socId, platform);
    fs.ensureDirSync(uploadDir);
  });
  
  writeData(data);
  res.json(data.socs[socId]);
});

// Update SOC
router.put('/api/soc/:socId', (req, res) => {
  const { socId } = req.params;
  const { name, studentId, grade, school, dob, supportPlans, otherPlanText, status } = req.body;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (name) data.socs[socId].name = name;
  if (studentId) data.socs[socId].studentId = studentId;
  if (grade) data.socs[socId].grade = grade;
  if (school) data.socs[socId].school = school;
  if (dob) data.socs[socId].dob = dob;
  if (supportPlans) data.socs[socId].supportPlans = supportPlans;
  if (otherPlanText !== undefined) data.socs[socId].otherPlanText = otherPlanText;
  if (status) data.socs[socId].status = status;
  
  writeData(data);
  res.json(data.socs[socId]);
});

// Set active SOC
router.post('/api/active-soc/:socId', (req, res) => {
  const { socId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  data.activeSocId = socId;
  writeData(data);
  
  res.json({ success: true, activeSocId: socId });
});

// Get active SOC
router.get('/api/active-soc', (req, res) => {
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  if (!data.socs[activeSocId]) {
    return res.status(404).json({ error: 'Active SOC not found' });
  }
  
  res.json({ 
    activeSocId: activeSocId,
    socData: data.socs[activeSocId]
  });
});

// Generate report for a SOC (all platforms)
router.get('/api/soc/:socId/report', (req, res) => {
  const { socId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  // For now, just return the SOC data
  // In the future, this would generate a PDF with all platforms
  res.json(data.socs[socId]);
});

module.exports = router;
