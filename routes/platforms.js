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
    
    // Get case data from Supabase, ensuring it belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Error fetching case:', caseError);
      return res.redirect('/dashboard?error=Case+not+found');
    }
    
    // Get SOCs associated with this case
    let { data: socsData, error: socsError } = await supabase
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
          status: 'known',
          created_by: req.user.id // Add user ownership
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

// Account setup route
router.get('/soc/:socId/platform/:platform/setup', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    
    // Get the case ID from the query parameter
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.redirect('/dashboard');
    }
    
    // Get SOC data from Supabase, ensuring it belongs to a case owned by the current user
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('*, cases!inner(created_by)')
      .eq('id', socId)
      .eq('case_id', caseId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (socError || !socData) {
      console.error('Error fetching SOC:', socError);
      return res.redirect(`/workstation?caseId=${caseId}&error=SOC+not+found`);
    }
    
    // Get platform data from Supabase if it exists
    const { data: platformData, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform_name', platform)
      .single();
      
    // Format platform data for the template
    let platformInfo = null;
    if (!platformError && platformData) {
      platformInfo = {
        username: platformData.username || '',
        displayName: platformData.display_name || '',
        profileUrl: platformData.profile_url || ''
      };
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
    
    res.render('account-setup', {
      caseId: caseId,
      socId: socId,
      platform: platform,
      platformData: platformInfo,
      socData: formattedSoc
    });
  } catch (error) {
    console.error('Error in account setup:', error);
    res.status(500).send('Server error');
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
    
    // Get SOC data from Supabase, ensuring it belongs to a case owned by the current user
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('*, cases!inner(created_by)')
      .eq('id', socId)
      .eq('case_id', caseId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
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
      
    // Check if platform exists
    let platformInfo;
    if (platformError || !platformData) {
      // Redirect to account setup if platform doesn't exist
      return res.redirect(`/soc/${socId}/platform/${platform}/setup?caseId=${caseId}`);
    } else {
      platformInfo = {
        username: platformData.username || '',
        displayName: platformData.display_name || '',
        profileUrl: platformData.profile_url || '',
        photos: []
      };
    }
    
    // Get photos for this platform - simple query by soc_id and platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform', platform);
    
    console.log('Raw photos data from workstation route:', JSON.stringify(photosData, null, 2));
      
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
      
      console.log('Transformed photos data for frontend:', JSON.stringify(platformInfo.photos, null, 2));
    } else {
      console.log('No photos found or error occurred:', photosError);
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
    
    // Get all platforms for this SOC - only include platforms that have been set up
    const { data: allPlatformsData, error: allPlatformsError } = await supabase
      .from('platforms')
      .select('platform_name')
      .eq('soc_id', socId);
      
    // Only include platforms that have been set up through the account setup flow
    let allPlatforms = [];
    
    if (!allPlatformsError && allPlatformsData) {
      // Use only platforms that exist in the database
      allPlatforms = allPlatformsData.map(p => p.platform_name);
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

// Edit platform route - redirects to setup with existing data
router.get('/soc/:socId/platform/:platform/edit', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    
    // Get the case ID from the query parameter
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.redirect('/dashboard');
    }
    
    // Redirect to setup page
    res.redirect(`/soc/${socId}/platform/${platform}/setup?caseId=${caseId}`);
  } catch (error) {
    console.error('Error in platform edit redirect:', error);
    res.status(500).redirect('/dashboard?error=Server+error');
  }
});

// New route for unknown threat evidence (direct to workstation without SOC)
router.get('/case/:caseId/platform/unknown-threat', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Check if case exists and belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Error fetching case:', caseError);
      return res.redirect('/dashboard?error=Case+not+found');
    }
    
    // Get photos for this case with platform = 'unknown-threat'
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('platform', 'unknown-threat')
      .is('soc_id', null);
    
    console.log('Raw photos data for unknown threat:', JSON.stringify(photosData, null, 2));
      
    // Format photos for the frontend
    let formattedPhotos = [];
    
    if (!photosError && photosData) {
      formattedPhotos = photosData.map(photo => ({
        id: photo.id,
        file_path: photo.file_path,
        thumbnail: photo.thumbnail,
        uploadDate: photo.upload_date,
        tags: photo.tags ? JSON.parse(photo.tags) : [],
        analysisTags: photo.analysis_tags ? JSON.parse(photo.analysis_tags) : {},
        notes: photo.notes || '',
        metadata: photo.metadata ? JSON.parse(photo.metadata) : {}
      }));
      
      console.log('Transformed photos data for unknown threat:', JSON.stringify(formattedPhotos, null, 2));
    } else {
      console.log('No photos found or error occurred:', photosError);
    }
    
    // Format platform data for the template
    const platformInfo = {
      username: 'Unknown Threat',
      displayName: 'Unknown Threat Evidence',
      profileUrl: '',
      photos: formattedPhotos
    };
    
    // Get all SOCs for this case (for navigation purposes)
    const { data: allSocsData, error: allSocsError } = await supabase
      .from('socs')
      .select('*')
      .eq('case_id', caseId);
      
    // Format all SOCs data
    const formattedAllSocs = {};
    const allSocIds = [];
    
    if (!allSocsError && allSocsData) {
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
    }
    
    // Get all platforms for all SOCs in this case
    let allPlatforms = ['unknown-threat']; // Always include unknown-threat
    
    if (allSocIds.length > 0) {
      // Get all platforms for all SOCs in this case
      const { data: allPlatformsData, error: allPlatformsError } = await supabase
        .from('platforms')
        .select('platform_name, soc_id')
        .in('soc_id', allSocIds);
        
      if (!allPlatformsError && allPlatformsData && allPlatformsData.length > 0) {
        // Add unique platforms from all SOCs
        const socPlatforms = allPlatformsData.map(p => p.platform_name);
        // Combine with unknown-threat and remove duplicates
        allPlatforms = [...new Set([...allPlatforms, ...socPlatforms])];
      }
    }
    
    console.log('All platforms for unknown threat view:', allPlatforms);
    
    // Render the workstation view with unknown threat data
    res.render('workstation', {
      caseId: caseId,
      socId: null, // No SOC for unknown threats
      platform: 'unknown-threat',
      platformData: platformInfo,
      socData: null, // No SOC data
      allPlatforms: allPlatforms, // Include all platforms from all SOCs + unknown-threat
      allSocs: allSocIds,
      allSocsData: formattedAllSocs,
      activeSocId: null, // No active SOC
      isUnknownThreat: true // Flag to indicate this is an unknown threat
    });
  } catch (error) {
    console.error('Error in unknown threat workstation:', error);
    res.status(500).redirect('/dashboard?error=Server+error');
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
    
    // First verify the case belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Case not found or not owned by user:', caseError);
      return res.redirect('/dashboard?error=Case+not+found+or+access+denied');
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
    
    // First verify the SOC belongs to a case owned by the current user
    const { data: socCheck, error: socCheckError } = await supabase
      .from('socs')
      .select('*, cases!inner(created_by)')
      .eq('id', socId)
      .eq('case_id', caseId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
      .single();
      
    if (socCheckError || !socCheck) {
      console.error('SOC not found or not owned by user:', socCheckError);
      return res.status(404).json({ error: 'SOC not found or you do not have permission to access it' });
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
    
    // Get photos for this platform - simple query by soc_id and platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform', platform);
    
    console.log('Raw photos data from API route:', JSON.stringify(photosData, null, 2));
      
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
      
      console.log('Transformed photos data for API response:', JSON.stringify(response.photos, null, 2));
    } else {
      console.log('No photos found or error occurred in API route:', photosError);
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching platform data:', error);
    res.status(500).json({ error: 'Failed to fetch platform data' });
  }
});

// Get unknown threat platform data (case-level, no SOC)
router.get('/api/case/:caseId/platform/unknown-threat', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Check if case exists and belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Error checking case:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get photos for this case with platform = 'unknown-threat'
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('platform', 'unknown-threat')
      .is('soc_id', null);
    
    console.log('Raw photos data from unknown threat API route:', JSON.stringify(photosData, null, 2));
      
    // Format response
    const response = {
      username: 'Unknown Threat',
      displayName: 'Unknown Threat Evidence',
      profileUrl: '',
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
      
      console.log('Transformed photos data for unknown threat API response:', JSON.stringify(response.photos, null, 2));
    } else {
      console.log('No photos found or error occurred in unknown threat API route:', photosError);
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching unknown threat platform data:', error);
    res.status(500).json({ error: 'Failed to fetch unknown threat platform data' });
  }
});

// Update platform info
router.post('/api/soc/:socId/platform/:platform', async (req, res) => {
  try {
    const { socId, platform } = req.params;
    // Ensure req.body exists before destructuring to prevent TypeError
    const body = req.body || {};
    const { username, displayName, profileUrl } = body;
    
    // Get the case ID from the query parameter or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if SOC exists, belongs to the case, and the case belongs to the current user
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('id, cases!inner(created_by)')
      .eq('id', socId)
      .eq('case_id', caseId)
      .eq('cases.created_by', req.user.id) // Verify user ownership via case relationship
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
          profile_url: profileUrl || '',
          created_by: req.user.id // Add user ownership
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
    
    // Get photos for this platform - simple query by soc_id and platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('soc_id', socId)
      .eq('platform', platform);
    
    console.log('Raw photos data from platform update route:', JSON.stringify(photosData, null, 2));
      
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
      
      console.log('Transformed photos data for platform update response:', JSON.stringify(response.photos, null, 2));
    } else {
      console.log('No photos found or error occurred in platform update route:', photosError);
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error updating platform info:', error);
    res.status(500).json({ error: 'Failed to update platform info' });
  }
});

module.exports = router;
