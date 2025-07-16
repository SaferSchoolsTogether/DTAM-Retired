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
const supabase = require('../config/supabase');

// Home route - redirect to dashboard or show welcome page
router.get('/', async (req, res) => {
  try {
    // Check if there are any cases in Supabase
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Supabase error:', error);
      return res.render('welcome');
    }
    
    // If there are existing cases, redirect to dashboard
    if (casesData && casesData.length > 0) {
      res.redirect('/dashboard');
    } else {
      // Otherwise show welcome page
      res.render('welcome');
    }
  } catch (error) {
    console.error('Error checking for cases:', error);
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
