/**
 * Report Generation Routes
 * Handles routes related to report generation, including:
 * - Platform-specific reports
 * - SOC reports
 * - Case reports
 * - Report redirects
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

// Generate report for a platform
router.get('/api/soc/:socId/platform/:platform/report', (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  // For now, just return the platform data
  // In the future, this would generate a PDF
  res.json(data.socs[socId].platforms[platform]);
});

// Generate report for the entire case
router.get('/api/case/report', (req, res) => {
  const data = readData();
  
  if (!data.case) {
    return res.status(404).json({ error: 'Case data not found' });
  }
  
  // For now, just return the case data with SOCs
  // In the future, this would generate a comprehensive PDF
  res.json({
    case: data.case,
    socs: data.socs
  });
});

// Redirect from old report endpoint
router.get('/api/platform/:platform/report', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  res.redirect(`/api/soc/${activeSocId}/platform/${platform}/report`);
});

module.exports = router;
