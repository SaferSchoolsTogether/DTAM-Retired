/**
 * General API Utilities
 * Handles general API routes and utilities, including:
 * - Common API functions
 * - Shared middleware
 * - API documentation
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// API status endpoint
router.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/api/docs', (req, res) => {
  res.json({
    message: 'API documentation placeholder',
    endpoints: {
      cases: [
        { method: 'GET', path: '/api/case-data', description: 'Get case data' },
        { method: 'POST', path: '/api/save-case', description: 'Save case data' },
        { method: 'DELETE', path: '/api/case/:caseId', description: 'Delete case and all associated data' },
        { method: 'POST', path: '/api/create-case', description: 'Create new case' }
      ],
      socs: [
        { method: 'GET', path: '/api/soc/:socId', description: 'Get SOC data' },
        { method: 'GET', path: '/api/socs', description: 'Get all SOCs' },
        { method: 'POST', path: '/api/socs', description: 'Create new SOC' },
        { method: 'PUT', path: '/api/soc/:socId', description: 'Update SOC' },
        { method: 'POST', path: '/api/active-soc/:socId', description: 'Set active SOC' },
        { method: 'GET', path: '/api/active-soc', description: 'Get active SOC' }
      ],
      platforms: [
        { method: 'GET', path: '/api/soc/:socId/platform/:platform', description: 'Get platform data' },
        { method: 'POST', path: '/api/soc/:socId/platform/:platform', description: 'Update platform info' }
      ],
      photos: [
        { method: 'POST', path: '/api/soc/:socId/platform/:platform/upload', description: 'Upload photo for SOC' },
        { method: 'GET', path: '/api/soc/:socId/platform/:platform/photo/:photoId', description: 'Get photo for SOC' },
        { method: 'PUT', path: '/api/soc/:socId/platform/:platform/photo/:photoId', description: 'Update photo for SOC' },
        { method: 'DELETE', path: '/api/soc/:socId/platform/:platform/photo/:photoId', description: 'Delete photo for SOC' },
        { method: 'POST', path: '/api/case/:caseId/platform/:platform/upload', description: 'Upload photo directly to case' },
        { method: 'GET', path: '/api/case/:caseId/photos', description: 'Get all photos for a case' },
        { method: 'GET', path: '/api/case/:caseId/platform/:platform/photo/:photoId', description: 'Get case photo' },
        { method: 'PUT', path: '/api/case/:caseId/platform/:platform/photo/:photoId', description: 'Update case photo' },
        { method: 'DELETE', path: '/api/case/:caseId/platform/:platform/photo/:photoId', description: 'Delete case photo' }
      ],
      threats: [
        { method: 'POST', path: '/api/threats', description: 'Create new threat' },
        { method: 'GET', path: '/api/threats/:threatId', description: 'Get threat details' },
        { method: 'PUT', path: '/api/threats/:threatId', description: 'Update threat' },
        { method: 'DELETE', path: '/api/threats/:threatId', description: 'Delete threat' },
        { method: 'GET', path: '/api/case/:caseId/threats', description: 'Get all threats for a case' }
      ],
      threatSocs: [
        { method: 'POST', path: '/api/threats/:threatId/socs', description: 'Link SOC to threat' },
        { method: 'GET', path: '/api/threats/:threatId/socs', description: 'Get all SOCs linked to threat' },
        { method: 'PUT', path: '/api/threat-socs/:relationshipId', description: 'Update SOC relationship' },
        { method: 'DELETE', path: '/api/threat-socs/:relationshipId', description: 'Remove SOC from threat' }
      ],
      reports: [
        { method: 'GET', path: '/api/soc/:socId/platform/:platform/report', description: 'Generate platform report' },
        { method: 'GET', path: '/api/soc/:socId/report', description: 'Generate SOC report' },
        { method: 'GET', path: '/api/case/report', description: 'Generate case report' }
      ],
      admin: [
        { method: 'POST', path: '/api/migrate-to-supabase', description: 'Migrate data to Supabase' },
        { method: 'POST', path: '/api/clear-session', description: 'Clear session data' }
      ]
    }
  });
});

// Get case data endpoint
router.get('/api/case-data', async (req, res) => {
  try {
    // Get case ID from query parameter
    const caseId = req.query.caseId;
    
    if (!caseId) {
      // If no case ID provided, get the most recent case created by the current user
      const { data: caseData, error } = await supabase
        .from('cases')
        .select('*')
        .eq('created_by', req.user.id) // Filter by user ownership
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
    
    // Get specific case data from Supabase, ensuring it belongs to the current user
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Filter by user ownership
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

module.exports = router;
