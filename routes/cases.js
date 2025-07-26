/**
 * Case Management Routes
 * Handles routes related to case management, including:
 * - Dashboard and case listing views
 * - Case data retrieval and storage
 * - Case report generation
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Dashboard route
router.get('/dashboard', async (req, res) => {
  // If caseId is present, redirect to workstation landing page
  if (req.query.caseId) {
    return res.redirect(`/workstation?caseId=${req.query.caseId}`);
  }
  
  try {
    // Get only cases created by the current user
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('created_by', req.user.id) // Filter by user ownership
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).render('error', { message: 'Failed to load cases from database' });
    }
    
    // Format case data for display
    const cases = [];
    
    for (const caseData of casesData) {
      // Parse student info if available
      const studentInfo = caseData.student_info ? JSON.parse(caseData.student_info) : null;
      
      // Format case data
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status || 'Unknown',
        studentName: studentInfo?.name || 'Unknown',
        status: 'Active', // Default status
      };
      
      cases.push(formattedCase);
    }
    
    // Get the most recent case ID for active case highlighting
    const activeCaseId = casesData.length > 0 ? casesData[0].id : null;
    
    res.render('dashboard', { cases, activeCaseId });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
});

// Cases route
router.get('/cases', async (req, res) => {
  try {
    // Get only cases created by the current user
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('created_by', req.user.id) // Filter by user ownership
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).render('error', { message: 'Failed to load cases from database' });
    }
    
    // Format case data for display
    const cases = [];
    
    for (const caseData of casesData) {
      // Parse student info if available
      const studentInfo = caseData.student_info ? JSON.parse(caseData.student_info) : null;
      
      // Get platforms data for this case
      const { data: socsData, error: socsError } = await supabase
        .from('socs')
        .select('id')
        .eq('case_id', caseData.id);
        
      // Initialize platforms object
      const platforms = {
        instagram: false,
        tiktok: false,
        snapchat: false,
        x: false,
        discord: false,
        facebook: false,
        other: false
      };
      
      // If we have SOCs, check for platform data
      if (!socsError && socsData && socsData.length > 0) {
        for (const soc of socsData) {
          // Get platforms for this SOC
          const { data: platformsData, error: platformsError } = await supabase
            .from('platforms')
            .select('platform_name, username')
            .eq('soc_id', soc.id);
            
          if (!platformsError && platformsData) {
            // Mark platforms that have data
            for (const platform of platformsData) {
              if (platforms.hasOwnProperty(platform.platform_name)) {
                platforms[platform.platform_name] = !!platform.username;
              }
            }
          }
          
          // Check for photos
          const { data: photosData, error: photosError } = await supabase
            .from('photos')
            .select('platform')
            .eq('case_id', caseData.id)
            .eq('soc_id', soc.id);
            
          if (!photosError && photosData && photosData.length > 0) {
            // Mark platforms that have photos
            for (const photo of photosData) {
              if (platforms.hasOwnProperty(photo.platform)) {
                platforms[photo.platform] = true;
              }
            }
          }
        }
      }
      
      // Format case data
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status || 'Unknown',
        socName: studentInfo?.name || 'Unknown',
        status: 'Active', // Default status
        platforms: platforms
      };
      
      cases.push(formattedCase);
    }
    
    // Get the most recent case ID for active case highlighting
    const activeCaseId = casesData.length > 0 ? casesData[0].id : null;
    
    res.render('cases', { cases, activeCaseId });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).render('error', { message: 'Failed to load cases' });
  }
});

// API Routes
// Get all cases API endpoint
router.get('/api/cases', async (req, res) => {
  try {
    // Get only cases created by the current user
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('created_by', req.user.id) // Filter by user ownership
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch cases' });
    }
    
    // Format case data for response
    const cases = [];
    
    for (const caseData of casesData) {
      // Parse student info if available
      const studentInfo = caseData.student_info ? JSON.parse(caseData.student_info) : null;
      
      // Format case data
      const formattedCase = {
        caseId: caseData.id,
        date: caseData.date,
        investigatorName: caseData.team_member_name,
        organization: caseData.organization,
        socStatus: caseData.soc_status || 'Unknown',
        studentName: studentInfo?.name || 'Unknown',
        status: 'Active', // Default status
      };
      
      cases.push(formattedCase);
    }
    
    res.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Get case data
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

// Set active case route
router.get('/set-active-case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const redirect = req.query.redirect || '/dashboard';
    
    // Get case data from Supabase, ensuring it belongs to the current user
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Filter by user ownership
      .single();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).redirect('/dashboard?error=Case+not+found');
    }
    
    // Redirect to workstation with the case ID
    res.redirect(`${redirect}?caseId=${caseId}`);
  } catch (error) {
    console.error('Error setting active case:', error);
    res.status(500).redirect('/dashboard?error=Failed+to+set+active+case');
  }
});

// Save case data
router.post('/api/save-case', async (req, res) => {
  try {
    // Log the request body to see what data is being sent
    console.log('Save case request body:', JSON.stringify(req.body, null, 2));
    
    // Check if this is an unknown threat - only based on socStatus
    // This prevents the entire case from being marked as unknown threat when just viewing unknown threat platform
    const isUnknownThreat = req.body.socStatus === 'unknown';
    console.log('Is unknown threat:', isUnknownThreat);
    
    // Validate required fields
    const requiredFields = ['caseId', 'date', 'investigatorName', 'organization'];
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        console.error(`Missing required field: ${field}`);
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Format case data for Supabase
    const caseData = {
      id: req.body.caseId,
      date: req.body.date,
      team_member_name: req.body.investigatorName,
      organization: req.body.organization,
      soc_status: req.body.socStatus,
      discovery_method: req.body.discoveryMethod,
      safety_assessment: req.body.safetyAssessment,
      // Store student info as JSON
      student_info: req.body.studentInfo ? JSON.stringify(req.body.studentInfo) : null,
      created_by: req.user.id // Add user ownership
    };
    
    console.log('Formatted case data for Supabase:', caseData);
    
    // Upsert to Supabase (insert or update)
    const { data, error } = await supabase
      .from('cases')
      .upsert(caseData)
      .select();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save case data', 
        details: error.message 
      });
    }
    
    // If this is an unknown threat, we don't need to create or update an SOC
    // But if it's a known or potential threat, we should ensure an SOC exists
    if (!isUnknownThreat && data && data.length > 0) {
      try {
        // Check if an SOC already exists for this case
        const { data: existingSocs, error: socQueryError } = await supabase
          .from('socs')
          .select('id')
          .eq('case_id', req.body.caseId);
          
        if (socQueryError) {
          console.error('Error checking for existing SOCs:', socQueryError);
          // Continue even if SOC query fails
        }
        
        // If no SOC exists, create one
        if (!existingSocs || existingSocs.length === 0) {
          console.log('No existing SOC found, creating new SOC for case:', req.body.caseId);
          
          const socResult = await supabase
            .from('socs')
            .insert({
              case_id: req.body.caseId,
              name: req.body.studentInfo?.name || '',
              student_id: req.body.studentInfo?.id || '',
              grade: req.body.studentInfo?.grade || '',
              school: req.body.studentInfo?.school || '',
              dob: req.body.studentInfo?.dob || '',
              support_plans: req.body.studentInfo?.supportPlans ? JSON.stringify(req.body.studentInfo.supportPlans) : JSON.stringify([]),
              other_plan_text: req.body.studentInfo?.otherPlanText || '',
              status: req.body.socStatus || 'known'
            })
            .select();
            
          if (socResult.error) {
            console.error('Error creating SOC:', socResult.error);
            // Continue even if SOC creation fails
          } else {
            console.log('Successfully created SOC:', socResult.data);
          }
        } else {
          console.log('Existing SOC found for case:', existingSocs);
        }
      } catch (socError) {
        console.error('Error handling SOC data:', socError);
        // Continue even if SOC handling fails
      }
    }
    
    // Return same response format as before
    res.json({ success: true, caseId: data[0].id });
  } catch (error) {
    console.error('Error saving case data:', error);
    res.status(500).json({ error: 'Failed to save case data' });
  }
});

// Delete case route
router.delete('/api/case/:caseId', async (req, res) => {
  try {
    // Get case ID from URL parameter
    const { caseId } = req.params;
    
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if the case exists and belongs to the current user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('created_by', req.user.id) // Verify user ownership
      .single();
      
    if (caseError || !caseData) {
      console.error('Case not found:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Authorization check (can be expanded based on your auth system)
    // For now, we'll assume all users can delete cases they can see
    
    // Get all SOCs associated with this case
    const { data: socsData, error: socsError } = await supabase
      .from('socs')
      .select('id')
      .eq('case_id', caseId);
      
    if (socsError) {
      console.error('Error fetching SOCs:', socsError);
      return res.status(500).json({ error: 'Failed to fetch associated SOCs' });
    }
    
    // For each SOC, get platforms and photos
    const socIds = socsData ? socsData.map(soc => soc.id) : [];
    const platformsToDelete = [];
    const photosToDelete = [];
    
    // If there are SOCs, get their platforms and photos
    if (socIds.length > 0) {
      // Get platforms for these SOCs
      const { data: platformsData, error: platformsError } = await supabase
        .from('platforms')
        .select('id, platform_name, soc_id')
        .in('soc_id', socIds);
        
      if (platformsError) {
        console.error('Error fetching platforms:', platformsError);
        return res.status(500).json({ error: 'Failed to fetch associated platforms' });
      }
      
      if (platformsData) {
        platformsToDelete.push(...platformsData);
      }
      
      // Get photos for these SOCs
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('id, file_path, platform, soc_id')
        .in('soc_id', socIds);
        
      if (photosError) {
        console.error('Error fetching photos:', photosError);
        return res.status(500).json({ error: 'Failed to fetch associated photos' });
      }
      
      if (photosData) {
        photosToDelete.push(...photosData);
      }
    }
    
    // Start a transaction to delete all related records
    // Note: Supabase doesn't support true transactions, so we'll delete in order
    
    // 1. Delete photos first (both files and database records)
    if (photosToDelete.length > 0) {
      // Delete photo files
      const fs = require('fs');
      const path = require('path');
      
      // Create an array of promises for file deletion
      const fileDeletePromises = photosToDelete.map(photo => {
        return new Promise((resolve) => {
          // Only attempt to delete if we have a file path
          if (photo.file_path) {
            // Convert URL to file path if needed
            let filePath = photo.file_path;
            if (filePath.startsWith('/')) {
              // Remove leading slash if present
              filePath = filePath.substring(1);
            }
            
            // Get absolute path
            const absolutePath = path.join(process.cwd(), 'public', filePath);
            
            // Delete file if it exists
            fs.unlink(absolutePath, (err) => {
              if (err) {
                // Log error but don't fail the operation
                console.error(`Failed to delete file ${absolutePath}:`, err);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
      
      // Wait for all file deletions to complete
      await Promise.all(fileDeletePromises);
      
      // Delete photo records from database
      const { error: deletePhotosError } = await supabase
        .from('photos')
        .delete()
        .in('id', photosToDelete.map(photo => photo.id));
        
      if (deletePhotosError) {
        console.error('Error deleting photos from database:', deletePhotosError);
        return res.status(500).json({ error: 'Failed to delete photos from database' });
      }
      
      // Clean up empty directories
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Group photos by SOC and platform
        const directories = new Set();
        photosToDelete.forEach(photo => {
          if (photo.soc_id && photo.platform) {
            directories.add(path.join(process.cwd(), 'public', 'uploads', photo.soc_id, photo.platform));
            directories.add(path.join(process.cwd(), 'public', 'uploads', photo.soc_id));
          }
        });
        
        // Check each directory and remove if empty
        directories.forEach(dir => {
          try {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir);
              if (files.length === 0) {
                fs.rmdirSync(dir);
              }
            }
          } catch (err) {
            // Log but don't fail
            console.error(`Failed to clean up directory ${dir}:`, err);
          }
        });
      } catch (err) {
        // Log but don't fail
        console.error('Error cleaning up directories:', err);
      }
    }
    
    // 2. Delete platforms
    if (platformsToDelete.length > 0) {
      const { error: deletePlatformsError } = await supabase
        .from('platforms')
        .delete()
        .in('id', platformsToDelete.map(platform => platform.id));
        
      if (deletePlatformsError) {
        console.error('Error deleting platforms:', deletePlatformsError);
        return res.status(500).json({ error: 'Failed to delete platforms' });
      }
    }
    
    // 3. Delete SOCs
    if (socIds.length > 0) {
      const { error: deleteSocsError } = await supabase
        .from('socs')
        .delete()
        .in('id', socIds);
        
      if (deleteSocsError) {
        console.error('Error deleting SOCs:', deleteSocsError);
        return res.status(500).json({ error: 'Failed to delete SOCs' });
      }
    }
    
    // 4. Finally, delete the case
    const { error: deleteCaseError } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);
      
    if (deleteCaseError) {
      console.error('Error deleting case:', deleteCaseError);
      return res.status(500).json({ error: 'Failed to delete case' });
    }
    
    // Return success response
    res.json({ 
      success: true, 
      message: 'Case and all associated data deleted successfully',
      caseId: caseId
    });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ 
      error: 'Failed to delete case', 
      details: error.message 
    });
  }
});

// Create new case route
router.post('/api/create-case', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['date', 'investigatorName', 'organization'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Generate a unique case ID if not provided
    const caseId = req.body.caseId || `CASE-${Date.now()}`;
    
    // Format case data for Supabase
    const caseData = {
      id: caseId,
      date: req.body.date,
      team_member_name: req.body.investigatorName,
      organization: req.body.organization,
      soc_status: req.body.socStatus || null,
      discovery_method: req.body.discoveryMethod || null,
      safety_assessment: req.body.safetyAssessment || null,
      // Store student info as JSON
      student_info: req.body.studentInfo ? JSON.stringify(req.body.studentInfo) : null,
      created_by: req.user.id // Add user ownership
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('cases')
      .insert(caseData)
      .select();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to create case', 
        details: error.message 
      });
    }
    
    // Only create an SOC if the socStatus is 'known' or 'potential'
    let socData = null;
    let socError = null;
    
    if (req.body.socStatus !== 'unknown') {
      const socResult = await supabase
        .from('socs')
        .insert({
          case_id: caseId,
          name: req.body.studentInfo?.name || '',
          student_id: req.body.studentInfo?.id || '',
          grade: req.body.studentInfo?.grade || '',
          school: req.body.studentInfo?.school || '',
          dob: req.body.studentInfo?.dob || '',
          support_plans: req.body.studentInfo?.supportPlans ? JSON.stringify(req.body.studentInfo.supportPlans) : JSON.stringify([]),
          other_plan_text: req.body.studentInfo?.otherPlanText || '',
          status: req.body.socStatus || 'known'
        })
        .select();
        
      socData = socResult.data;
      socError = socResult.error;
      
      if (socError) {
        console.error('Error creating SOC:', socError);
        // Continue even if SOC creation fails
      }
    } else {
      console.log('Skipping SOC creation for unknown threatmaker');
    }
    
    // Return success response with case ID
    res.json({ 
      success: true, 
      caseId: data[0].id,
      socId: socData && socData.length > 0 ? socData[0].id : null
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

module.exports = router;
