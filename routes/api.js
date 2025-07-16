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
        { method: 'POST', path: '/api/save-case', description: 'Save case data' }
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
        { method: 'POST', path: '/api/soc/:socId/platform/:platform/upload', description: 'Upload photo' },
        { method: 'GET', path: '/api/soc/:socId/platform/:platform/photo/:photoId', description: 'Get photo' },
        { method: 'PUT', path: '/api/soc/:socId/platform/:platform/photo/:photoId', description: 'Update photo' },
        { method: 'DELETE', path: '/api/soc/:socId/platform/:platform/photo/:photoId', description: 'Delete photo' }
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

module.exports = router;
