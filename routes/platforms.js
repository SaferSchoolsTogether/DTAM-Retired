/**
 * Platform-specific Routes
 * Handles routes related to platform management, including:
 * - Platform data retrieval and storage
 * - Platform workstation views
 * - Platform redirects
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Workstation landing page route
router.get('/workstation', async (req, res) => {
  try {
    // Get the case ID from the query parameter
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.redirect('/dashboard');
    }
    
    // Get case data from Supabase
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
      
    if (caseError || !caseData) {
      console.error('Error fetching case:', caseError);
      return res.redirect('/dashboard?error=Case+not+found');
    }
    
    // Get SOCs associated with this case
    const { data: socsData, error: socsError } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId);
      
    if (socsError) {
      console.error('Error fetching SOCs:', socsError);
      return res.redirect('/dashboard?error=Failed+to+load+SOCs');
    }
    
    // If no SOCs exist for this case, create a default one
    let activeSocId;
    if (!socsData || socsData.length === 0) {
      // Create a default SOC for this case
      const { data: newSoc, error: createError } = await supabase
        .from('socs')
        .insert({
          case_id: caseId,
          name: '',
          status: 'known'
        })
        .select();
        
      if (createError) {
        console.error('Error creating SOC:', createError);
        return res.redirect('/dashboard?error=Failed+to+create+SOC');
      }
      
      activeSocId = newSoc[0].id;
      socsData = [newSoc[0]];
    } else {
      activeSocId = socsData[0].id;
    }
    
    // Onboarding data is now handled directly in the summary page
    
    // Format SOCs data for the template
    const formattedSocs = {};
    const allSocIds = [];
    
    for (const soc of socsData) {
      allSocIds.push(soc.id);
      formattedSocs[soc.id] = {
        id: soc.id,
        name: soc.name || '',
        studentId: soc.student_id || '',
        grade: soc.grade || '',
        school: soc.school || '',
        dob: soc.dob || '',
        supportPlans: soc.support_plans || [],
        otherPlanText: soc.other_plan_text || '',
        status: soc.status || 'known'
      };
    }
    
    res.render('workstation-landing', {
      caseId: caseId,
      socId: activeSocId,
      allSocs: allSocIds,
      allSocsData: formattedSocs,
      activeSocId: activeSocId
    });
  } catch (error) {
    console.error('Error in workstation landing:', error);
    res.status(500).redirect('/dashboard?error=Server+error');
  }
});

// Platform workstation route
router.get('/soc/:socId/platform/:platform', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    
    // Get the case ID from the query parameter
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.redirect('/dashboard');
    }
    
    // Get SOC data from Supabase
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('*')
      .eq('id', socId)
      .eq('case_id', caseId)
      .single();
      
    if (socError || !socData) {
      console.error('Error fetching SOC:', socError);
      return res.redirect(`/workstation?caseId=${caseId}&error=SOC+not+found`);
    }
    
    // Get platform data from Supabase
    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .single();
      
    // If platform doesn't exist, create it
    let platformInfo;
    if (platformError || !platformData) {
      // Create a new platform entry
      const { data: newPlatform, error: createError } = await supabase
        .from('platforms')
        .insert({
          soc_id: socId,
          platform_name: platform,
          username: '',
          display_name: '',
          profile_url: ''
        })
        .select();
        
      if (createError) {
        console.error('Error creating platform:', createError);
        return res.redirect(`/workstation?caseId=${caseId}&error=Failed+to+create+platform`);
      }
      
      platformInfo = {
        username: '',
        displayName: '',
        profileUrl: '',
        photos: []
      };
    } else {
      platformInfo = {
        username: platformData.username || '',
        displayName: platformData.display_name || '',
        profileUrl: platformData.profile_url || '',
        photos: []
      };
    }
    
    // Get photos for this platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('soc_id', socId)
      .eq('platform', platform);
      
    if (!photosError && photosData) {
      // Format photos for the frontend
      platformInfo.photos = photosData.map(photo => ({
        id: photo.id,
        file_path: photo.file_path,
        thumbnail: photo.thumbnail,
        uploadDate: photo.upload_date,
        tags: photo.tags ? JSON.parse(photo.tags) : [],
        analysisTags: photo.analysis_tags ? JSON.parse(photo.analysis_tags) : {},
        notes: photo.notes || '',
        metadata: photo.metadata ? JSON.parse(photo.metadata) : {}
      }));
    }
    
    // Get all SOCs for this case
    const { data: allSocsData, error: allSocsError } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId);
      
    if (allSocsError) {
      console.error('Error fetching all SOCs:', allSocsError);
      return res.redirect(`/workstation?caseId=${caseId}&error=Failed+to+load+SOCs`);
    }
    
    // Format SOC data
    const formattedSoc = {
      id: socData.id,
      name: socData.name || '',
      studentId: socData.student_id || '',
      grade: socData.grade || '',
      school: socData.school || '',
      dob: socData.dob || '',
      supportPlans: socData.support_plans || [],
      otherPlanText: socData.other_plan_text || '',
      status: socData.status || 'known'
    };
    
    // Format all SOCs data
    const formattedAllSocs = {};
    const allSocIds = [];
    
    for (const soc of allSocsData) {
      allSocIds.push(soc.id);
      formattedAllSocs[soc.id] = {
        id: soc.id,
        name: soc.name || '',
        studentId: soc.student_id || '',
        grade: soc.grade || '',
        school: soc.school || '',
        dob: soc.dob || '',
        supportPlans: soc.support_plans || [],
        otherPlanText: soc.other_plan_text || '',
        status: soc.status || 'known'
      };
    }
    
    // Get all platforms for this SOC
    const { data: allPlatformsData, error: allPlatformsError } = await supabase
      .from('platforms')
      .select('platform_name')
      .eq('soc_id', socId);
      
    let allPlatforms = ['instagram', 'tiktok', 'snapchat', 'x', 'discord', 'facebook', 'other'];
    
    if (!allPlatformsError && allPlatformsData) {
      // Add any platforms that exist in the database
      const dbPlatforms = allPlatformsData.map(p => p.platform_name);
      allPlatforms = [...new Set([...allPlatforms, ...dbPlatforms])];
    }
    
    res.render('workstation', {
      caseId: caseId,
      socId: socId,
      platform: platform,
      platformData: platformInfo,
      socData: formattedSoc,
      allPlatforms: allPlatforms,
      allSocs: allSocIds,
      allSocsData: formattedAllSocs,
      activeSocId: socId
    });
  } catch (error) {
    console.error('Error in platform workstation:', error);
    res.status(500).send('Server error');
  }
});

// Redirect from old route to new route with active SOC
router.get('/platform/:platform', async (req, res) => {
  try {
    const platform = req.params.platform;
    
    // Get the case ID from the query parameter
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.redirect('/dashboard');
    }
    
    // Get the first SOC for this case
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('id')
      .eq('case_id', caseId)
      .limit(1)
      .single();
      
    if (socError || !socData) {
      console.error('Error fetching SOC:', socError);
      return res.redirect(`/workstation?caseId=${caseId}&error=No+SOCs+found`);
    }
    
    res.redirect(`/soc/${socData.id}/platform/${platform}?caseId=${caseId}`);
  } catch (error) {
    console.error('Error in platform redirect:', error);
    res.status(500).redirect('/dashboard?error=Server+error');
  }
});

// Get platform data
router.get('/api/soc/:socId/platform/:platform', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    
    // Get the case ID from the query parameter or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Get platform data from Supabase
    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .single();
      
    // If platform doesn't exist, return empty data
    if (platformError) {
      return res.json({
        username: '',
        displayName: '',
        url: '',
        photos: []
      });
    }
    
    // Get photos for this platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('soc_id', socId)
      .eq('platform', platform);
      
    // Format response
    const response = {
      username: platformData.username || '',
      displayName: platformData.display_name || '',
      profileUrl: platformData.profile_url || '',
      photos: []
    };
    
    if (!photosError && photosData) {
      // Format photos for the frontend
      response.photos = photosData.map(photo => ({
        id: photo.id,
        file_path: photo.file_path,
        thumbnail: photo.thumbnail,
        uploadDate: photo.upload_date,
        tags: photo.tags ? JSON.parse(photo.tags) : [],
        analysisTags: photo.analysis_tags ? JSON.parse(photo.analysis_tags) : {},
        notes: photo.notes || '',
        metadata: photo.metadata ? JSON.parse(photo.metadata) : {}
      }));
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching platform data:', error);
    res.status(500).json({ error: 'Failed to fetch platform data' });
  }
});

// Update platform info
router.post('/api/soc/:socId/platform/:platform', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    const { username, displayName, profileUrl } = req.body;
    
    // Get the case ID from the query parameter or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if SOC exists and belongs to the case
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('id')
      .eq('id', socId)
      .eq('case_id', caseId)
      .single();
      
    if (socError || !socData) {
      console.error('Error checking SOC:', socError);
      return res.status(404).json({ error: 'SOC not found or does not belong to this case' });
    }
    
    // Check if platform exists
    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .single();
      
    if (platformError) {
      // If platform doesn't exist, create it
      const { data: newPlatform, error: createError } = await supabase
        .from('platforms')
        .insert({
          soc_id: socId,
          platform_name: platform,
          username: username || '',
          display_name: displayName || '',
          profile_url: profileUrl || ''
        })
        .select();
        
      if (createError) {
        console.error('Error creating platform:', createError);
        return res.status(500).json({ error: 'Failed to create platform' });
      }
      
      return res.json({
        username: newPlatform[0].username || '',
        displayName: newPlatform[0].display_name || '',
        profileUrl: newPlatform[0].profile_url || '',
        photos: []
      });
    }
    
    // Update platform data
    const { data: updatedPlatform, error: updateError } = await supabase
      .from('platforms')
      .update({
        username: username || platformData.username,
        display_name: displayName || platformData.display_name,
        profile_url: profileUrl || platformData.profile_url
      })
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .select();
      
    if (updateError) {
      console.error('Error updating platform:', updateError);
      return res.status(500).json({ error: 'Failed to update platform' });
    }
    
    // Get photos for this platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('soc_id', socId)
      .eq('platform', platform);
      
    // Format response
    const response = {
      username: updatedPlatform[0].username || '',
      displayName: updatedPlatform[0].display_name || '',
      profileUrl: updatedPlatform[0].profile_url || '',
      photos: []
    };
    
    if (!photosError && photosData) {
      // Format photos for the frontend
      response.photos = photosData.map(photo => ({
        id: photo.id,
        file_path: photo.file_path,
        thumbnail: photo.thumbnail,
        uploadDate: photo.upload_date,
        tags: photo.tags ? JSON.parse(photo.tags) : [],
        analysisTags: photo.analysis_tags ? JSON.parse(photo.analysis_tags) : {},
        notes: photo.notes || '',
        metadata: photo.metadata ? JSON.parse(photo.metadata) : {}
      }));
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error updating platform info:', error);
    res.status(500).json({ error: 'Failed to update platform info' });
  }
});

module.exports = router;
