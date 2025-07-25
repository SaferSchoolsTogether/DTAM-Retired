/**
 * Threat Management Routes
 * Handles routes related to threat management, including:
 * - Threat data retrieval and storage
 * - Threat creation and updates
 * - Threat deletion
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

// Create new threat
router.post('/api/threats', async (req, res) => {
  try {
    const { 
      caseId, 
      discoveryMethod, 
      location, 
      content, 
      languageAnalysis, 
      reverseImageResults, 
      evidencePhotos 
    } = req.body;
    
    // Validate required fields
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if case exists and belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Supabase error checking case:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Generate a unique ID for the threat
    const threatId = `threat_${uuidv4().substring(0, 8)}`;
    
    // Create new threat in Supabase
    const { data: threatData, error: threatError } = await supabase
      .from('threats')
      .insert({
        id: threatId,
        case_id: caseId,
        discovery_method: discoveryMethod || null,
        location: location || '',
        content: content || '',
        language_analysis: languageAnalysis || '',
        reverse_image_results: reverseImageResults || '',
        evidence_photos: evidencePhotos || '',
        created_by: req.user.id // Add user ownership
      })
      .select();
      
    if (threatError) {
      console.error('Supabase error creating threat:', threatError);
      return res.status(500).json({ 
        error: 'Failed to create threat', 
        details: threatError.message 
      });
    }
    
    // Format response to match the expected format by the frontend
    const formattedThreat = {
      id: threatData[0].id,
      caseId: threatData[0].case_id,
      discoveryMethod: threatData[0].discovery_method || null,
      location: threatData[0].location || '',
      content: threatData[0].content || '',
      languageAnalysis: threatData[0].language_analysis || '',
      reverseImageResults: threatData[0].reverse_image_results || '',
      evidencePhotos: threatData[0].evidence_photos || '',
      createdAt: threatData[0].created_at,
      updatedAt: threatData[0].updated_at
    };
    
    res.status(201).json(formattedThreat);
  } catch (error) {
    console.error('Error creating threat:', error);
    res.status(500).json({ error: 'Failed to create threat' });
  }
});

// Get threat details
router.get('/api/threats/:threatId', async (req, res) => {
  try {
    const { threatId } = req.params;
    
    // Get threat data from Supabase, ensuring it belongs to a case owned by the current user
    const { data: threatData, error } = await supabase
      .from('threats')
      .select('*, cases!inner(created_by)')
      .eq('id', threatId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (error || !threatData) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Threat not found' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedThreat = {
      id: threatData.id,
      caseId: threatData.case_id,
      discoveryMethod: threatData.discovery_method || null,
      location: threatData.location || '',
      content: threatData.content || '',
      languageAnalysis: threatData.language_analysis || '',
      reverseImageResults: threatData.reverse_image_results || '',
      evidencePhotos: threatData.evidence_photos || '',
      createdAt: threatData.created_at,
      updatedAt: threatData.updated_at
    };
    
    res.json(formattedThreat);
  } catch (error) {
    console.error('Error fetching threat data:', error);
    res.status(500).json({ error: 'Failed to fetch threat data' });
  }
});

// Update threat
router.put('/api/threats/:threatId', async (req, res) => {
  try {
    const { threatId } = req.params;
    const { 
      discoveryMethod, 
      location, 
      content, 
      languageAnalysis, 
      reverseImageResults, 
      evidencePhotos 
    } = req.body;
    
    // First verify the threat belongs to a case owned by the current user
    const { data: threatCheck, error: threatCheckError } = await supabase
      .from('threats')
      .select('*, cases!inner(created_by)')
      .eq('id', threatId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (threatCheckError || !threatCheck) {
      console.error('Threat not found or not owned by user:', threatCheckError);
      return res.status(404).json({ error: 'Threat not found or you do not have permission to update it' });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (discoveryMethod !== undefined) updateData.discovery_method = discoveryMethod;
    if (location !== undefined) updateData.location = location;
    if (content !== undefined) updateData.content = content;
    if (languageAnalysis !== undefined) updateData.language_analysis = languageAnalysis;
    if (reverseImageResults !== undefined) updateData.reverse_image_results = reverseImageResults;
    if (evidencePhotos !== undefined) updateData.evidence_photos = evidencePhotos;
    
    // Update threat in Supabase
    const { data: threatData, error } = await supabase
      .from('threats')
      .update(updateData)
      .eq('id', threatId)
      .select();
      
    if (error) {
      console.error('Supabase error updating threat:', error);
      return res.status(500).json({ 
        error: 'Failed to update threat', 
        details: error.message 
      });
    }
    
    if (!threatData || threatData.length === 0) {
      return res.status(404).json({ error: 'Threat not found' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedThreat = {
      id: threatData[0].id,
      caseId: threatData[0].case_id,
      discoveryMethod: threatData[0].discovery_method || null,
      location: threatData[0].location || '',
      content: threatData[0].content || '',
      languageAnalysis: threatData[0].language_analysis || '',
      reverseImageResults: threatData[0].reverse_image_results || '',
      evidencePhotos: threatData[0].evidence_photos || '',
      createdAt: threatData[0].created_at,
      updatedAt: threatData[0].updated_at
    };
    
    res.json(formattedThreat);
  } catch (error) {
    console.error('Error updating threat:', error);
    res.status(500).json({ error: 'Failed to update threat' });
  }
});

// Delete threat
router.delete('/api/threats/:threatId', async (req, res) => {
  try {
    const { threatId } = req.params;
    
    // First verify the threat belongs to a case owned by the current user
    const { data: threatCheck, error: threatCheckError } = await supabase
      .from('threats')
      .select('*, cases!inner(created_by)')
      .eq('id', threatId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (threatCheckError || !threatCheck) {
      console.error('Threat not found or not owned by user:', threatCheckError);
      return res.status(404).json({ error: 'Threat not found or you do not have permission to delete it' });
    }
    
    // First, delete all threat-soc relationships
    const { error: relationshipError } = await supabase
      .from('threat_socs')
      .delete()
      .eq('threat_id', threatId);
      
    if (relationshipError) {
      console.error('Supabase error deleting threat-soc relationships:', relationshipError);
      // Continue with threat deletion even if relationship deletion fails
    }
    
    // Delete the threat
    const { error: threatError } = await supabase
      .from('threats')
      .delete()
      .eq('id', threatId);
      
    if (threatError) {
      console.error('Supabase error deleting threat:', threatError);
      return res.status(500).json({ 
        error: 'Failed to delete threat', 
        details: threatError.message 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting threat:', error);
    res.status(500).json({ error: 'Failed to delete threat' });
  }
});

// Get all threats for a case
router.get('/api/case/:caseId/threats', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // First verify the case belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Case not found or not owned by user:', caseError);
      return res.status(404).json({ error: 'Case not found or you do not have permission to access it' });
    }
    
    // Get threats from Supabase
    const { data: threatsData, error } = await supabase
      .from('threats')
      .select('*')
      .eq('case_id', caseId);
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch threats' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedThreats = threatsData.map(threat => ({
      id: threat.id,
      caseId: threat.case_id,
      discoveryMethod: threat.discovery_method || null,
      location: threat.location || '',
      content: threat.content || '',
      languageAnalysis: threat.language_analysis || '',
      reverseImageResults: threat.reverse_image_results || '',
      evidencePhotos: threat.evidence_photos || '',
      createdAt: threat.created_at,
      updatedAt: threat.updated_at
    }));
    
    res.json(formattedThreats);
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({ error: 'Failed to fetch threats' });
  }
});

module.exports = router;
