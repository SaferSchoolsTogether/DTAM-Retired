/**
 * Onboarding Flow Routes
 * Handles routes related to the onboarding process, including:
 * - Welcome page
 * - SOC status selection
 * - Case information entry
 * - Discovery method selection
 * - Safety assessment
 * - Onboarding summary
 */

const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

// Helper functions
function readData() {
  const DATA_FILE = path.join(__dirname, '..', 'data', 'app-data.json');
  return fs.readJsonSync(DATA_FILE);
}

function writeData(data) {
  const DATA_FILE = path.join(__dirname, '..', 'data', 'app-data.json');
  return fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

// Home route - redirect to dashboard or show welcome page
router.get('/', (req, res) => {
  const data = readData();
  
  // If there's existing case data, redirect to dashboard
  if (data.case && data.case.caseId) {
    res.redirect('/dashboard');
  } else {
    // Otherwise show welcome page
    res.render('welcome');
  }
});

// New case route - always show welcome page
router.get('/new-case', (req, res) => {
  // Always render the welcome page to start a new case
  res.render('welcome');
});

// Search tips route
router.get('/tips', (req, res) => {
  res.render('tips');
});

// Onboarding routes
router.post('/soc-status', (req, res) => {
  // In a real app, we would store this in the session
  res.render('soc-status');
});

router.get('/soc-status', (req, res) => {
  // Handle GET request for soc-status
  res.render('soc-status');
});

router.post('/case-info', (req, res) => {
  // Store SOC status in session
  const { socStatus } = req.body;
  
  // In a real app, we would store this in the session
  res.render('case-info');
});

router.get('/case-info', (req, res) => {
  // Handle GET request for case-info
  res.render('case-info');
});

router.post('/discovery-method', (req, res) => {
  // Store SOC status in session
  const { socStatus } = req.body;
  
  // In a real app, we would store this in the session
  res.render('discovery-method');
});

router.get('/discovery-method', (req, res) => {
  // Handle GET request for discovery-method
  res.render('discovery-method');
});

router.post('/safety-assessment', (req, res) => {
  // Store case info in session
  const { caseId, date, investigatorName, organization } = req.body;
  
  // In a real app, we would store this in the session
  res.render('safety-assessment');
});

router.get('/safety-assessment', (req, res) => {
  // Handle GET request for safety-assessment
  res.render('safety-assessment');
});

router.post('/summary', (req, res) => {
  // Store safety assessment or discovery method in session
  const { safetyAssessment, discoveryMethod } = req.body;
  
  // In a real app, we would store this in the session
  res.render('summary');
});

router.get('/summary', (req, res) => {
  // Handle GET request for summary
  res.render('summary');
});

module.exports = router;
