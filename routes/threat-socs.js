/**
 * Threat-SOC Relationship Management Routes
 * Handles routes related to the relationship between threats and SOCs, including:
 * - Linking SOCs to threats
 * - Retrieving SOCs linked to a threat
 * - Updating relationship details
 * - Removing SOC from threat
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Link SOC to threat
router.post('/api/threats/:threatId/socs', async (req, res) => {
  try {
    const { threatId } = req.params;
    const { 
      socId, 
      relationshipType, 
      priorityLevel, 
      notes 
    } = req.body;
    
    // Validate required fields
    if (!socId) {
      return res.status(400).json({ error: 'SOC ID is required' });
    }
    
    if (!relationshipType) {
      return res.status(400).json({ error: 'Relationship type is required' });
    }
    
    // Check if threat exists and belongs to a case owned by the current user
    const { data: threatData, error: threatError } = await supabase
      .from('threats')
      .select('id, cases!inner(created_by)')
      .eq('id', threatId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (threatError || !threatData) {
      console.error('Supabase error checking threat:', threatError);
      return res.status(404).json({ error: 'Threat not found' });
    }
    
    // Check if SOC exists and belongs to a case owned by the current user
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('id, cases!inner(created_by)')
      .eq('id', socId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (socError || !socData) {
      console.error('Supabase error checking SOC:', socError);
      return res.status(404).json({ error: 'SOC not found' });
    }
    
    // Check if relationship already exists
    const { data: existingRelationship, error: relationshipError } = await supabase
      .from('threat_socs')
      .select('id')
      .eq('threat_id', threatId)
      .eq('soc_id', socId)
      .single();
      
    if (existingRelationship) {
      return res.status(409).json({ 
        error: 'Relationship already exists', 
        relationshipId: existingRelationship.id 
      });
    }
    
    // Create new relationship in Supabase
    const { data: newRelationship, error: createError } = await supabase
      .from('threat_socs')
      .insert({
        threat_id: threatId,
        soc_id: socId,
        relationship_type: relationshipType,
        priority_level: priorityLevel || 'medium',
        notes: notes || '',
        created_by: req.user.id // Add user ownership
      })
      .select();
      
    if (createError) {
      console.error('Supabase error creating relationship:', createError);
      return res.status(500).json({ 
        error: 'Failed to create relationship', 
        details: createError.message 
      });
    }
    
    // Format response
    const formattedRelationship = {
      id: newRelationship[0].id,
      threatId: newRelationship[0].threat_id,
      socId: newRelationship[0].soc_id,
      relationshipType: newRelationship[0].relationship_type,
      priorityLevel: newRelationship[0].priority_level,
      notes: newRelationship[0].notes || '',
      createdAt: newRelationship[0].created_at
    };
    
    res.status(201).json(formattedRelationship);
  } catch (error) {
    console.error('Error linking SOC to threat:', error);
    res.status(500).json({ error: 'Failed to link SOC to threat' });
  }
});

// Get all SOCs linked to threat
router.get('/api/threats/:threatId/socs', async (req, res) => {
  try {
    const { threatId } = req.params;
    
    // Check if threat exists and belongs to a case owned by the current user
    const { data: threatData, error: threatError } = await supabase
      .from('threats')
      .select('id, cases!inner(created_by)')
      .eq('id', threatId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (threatError || !threatData) {
      console.error('Supabase error checking threat:', threatError);
      return res.status(404).json({ error: 'Threat not found' });
    }
    
    // Get all relationships for this threat
    const { data: relationships, error: relationshipsError } = await supabase
      .from('threat_socs')
      .select(`
        id,
        threat_id,
        soc_id,
        relationship_type,
        priority_level,
        notes,
        created_at,
        socs:soc_id (
          id,
          name,
          student_id,
          grade,
          school,
          dob,
          status
        )
      `)
      .eq('threat_id', threatId);
      
    if (relationshipsError) {
      console.error('Supabase error fetching relationships:', relationshipsError);
      return res.status(500).json({ 
        error: 'Failed to fetch relationships', 
        details: relationshipsError.message 
      });
    }
    
    // Format response
    const formattedRelationships = relationships.map(rel => ({
      id: rel.id,
      threatId: rel.threat_id,
      socId: rel.soc_id,
      relationshipType: rel.relationship_type,
      priorityLevel: rel.priority_level,
      notes: rel.notes || '',
      createdAt: rel.created_at,
      soc: {
        id: rel.socs.id,
        name: rel.socs.name || '',
        studentId: rel.socs.student_id || '',
        grade: rel.socs.grade || '',
        school: rel.socs.school || '',
        dob: rel.socs.dob || '',
        status: rel.socs.status || 'known'
      }
    }));
    
    res.json(formattedRelationships);
  } catch (error) {
    console.error('Error fetching SOCs linked to threat:', error);
    res.status(500).json({ error: 'Failed to fetch SOCs linked to threat' });
  }
});

// Update SOC relationship
router.put('/api/threat-socs/:relationshipId', async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { 
      relationshipType, 
      priorityLevel, 
      notes 
    } = req.body;
    
    // First verify the relationship belongs to a threat that belongs to a case owned by the current user
    const { data: relationshipCheck, error: relationshipCheckError } = await supabase
      .from('threat_socs')
      .select('*, threats!inner(cases!inner(created_by))')
      .eq('id', relationshipId)
      .eq('threats.cases.created_by', req.user.id) // Verify user ownership via threat->case relationship
      .single();
      
    if (relationshipCheckError || !relationshipCheck) {
      console.error('Relationship not found or not owned by user:', relationshipCheckError);
      return res.status(404).json({ error: 'Relationship not found or you do not have permission to update it' });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (relationshipType !== undefined) updateData.relationship_type = relationshipType;
    if (priorityLevel !== undefined) updateData.priority_level = priorityLevel;
    if (notes !== undefined) updateData.notes = notes;
    
    // Update relationship in Supabase
    const { data: updatedRelationship, error } = await supabase
      .from('threat_socs')
      .update(updateData)
      .eq('id', relationshipId)
      .select();
      
    if (error) {
      console.error('Supabase error updating relationship:', error);
      return res.status(500).json({ 
        error: 'Failed to update relationship', 
        details: error.message 
      });
    }
    
    if (!updatedRelationship || updatedRelationship.length === 0) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    // Format response
    const formattedRelationship = {
      id: updatedRelationship[0].id,
      threatId: updatedRelationship[0].threat_id,
      socId: updatedRelationship[0].soc_id,
      relationshipType: updatedRelationship[0].relationship_type,
      priorityLevel: updatedRelationship[0].priority_level,
      notes: updatedRelationship[0].notes || '',
      createdAt: updatedRelationship[0].created_at
    };
    
    res.json(formattedRelationship);
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ error: 'Failed to update relationship' });
  }
});

// Remove SOC from threat
router.delete('/api/threat-socs/:relationshipId', async (req, res) => {
  try {
    const { relationshipId } = req.params;
    
    // First verify the relationship belongs to a threat that belongs to a case owned by the current user
    const { data: relationshipCheck, error: relationshipCheckError } = await supabase
      .from('threat_socs')
      .select('*, threats!inner(cases!inner(created_by))')
      .eq('id', relationshipId)
      .eq('threats.cases.created_by', req.user.id) // Verify user ownership via threat->case relationship
      .single();
      
    if (relationshipCheckError || !relationshipCheck) {
      console.error('Relationship not found or not owned by user:', relationshipCheckError);
      return res.status(404).json({ error: 'Relationship not found or you do not have permission to delete it' });
    }
    
    // Delete the relationship
    const { error } = await supabase
      .from('threat_socs')
      .delete()
      .eq('id', relationshipId);
      
    if (error) {
      console.error('Supabase error deleting relationship:', error);
      return res.status(500).json({ 
        error: 'Failed to delete relationship', 
        details: error.message 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing SOC from threat:', error);
    res.status(500).json({ error: 'Failed to remove SOC from threat' });
  }
});

module.exports = router;
