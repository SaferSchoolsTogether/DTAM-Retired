/**
 * Photo Management Routes
 * Handles routes related to photo management, including:
 * - Photo upload
 * - Photo retrieval
 * - Photo metadata updates
 * - Photo deletion
 */

const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
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

// Set up multer for file uploads - using memory storage for Supabase
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload photo
router.post('/api/soc/:socId/platform/:platform/upload', upload.single('photo'), async (req, res) => {
  const { socId, platform } = req.params;
  
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get the active case ID from the request query or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Check if case exists in Supabase
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId.toString())
      .single();
      
    if (caseError || !caseData) {
      console.error('Supabase error checking case:', caseError);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Check if SOC exists in Supabase
    const { data: socData, error: socError } = await supabase
      .from('socs')
      .select('id')
      .eq('id', socId.toString()) // Ensure socId is treated as string
      .single();
      
    if (socError) {
      console.error('Supabase error checking SOC:', socError);
      return res.status(404).json({ error: 'SOC not found' });
    }
    
    // Generate unique filename
    const photoId = uuidv4();
    const fileExt = path.extname(req.file.originalname);
    const filename = `${photoId}${fileExt}`;
    // Include caseId in the storage path to isolate photos between cases
    const storagePath = `${caseId}/${socId}/${platform}/${filename}`;
    
    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('dtam-photos')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
      
    if (storageError) {
      console.error('Supabase storage error:', storageError);
      return res.status(500).json({ 
        error: 'Failed to upload photo to storage', 
        details: storageError.message 
      });
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('dtam-photos')
      .getPublicUrl(storagePath);
      
    const photoPath = publicUrlData.publicUrl;
    
    // Current date in ISO format
    const uploadDate = new Date().toISOString();
    const postedDate = uploadDate.split('T')[0];
    
    // Create metadata for the photo
    const photoMetadata = {
      posted: postedDate,
      likes: 0,
      comments: 0,
      engagementRate: '0%'
    };
    
    // Create photo record in database
    const newPhotoRecord = {
      id: photoId,
      case_id: caseId, // Associate photo with specific case
      soc_id: socId,
      platform: platform,
      file_path: photoPath,
      thumbnail: photoPath, // For now, using the same path for thumbnail
      upload_date: uploadDate,
      tags: JSON.stringify([]),
      analysis_tags: JSON.stringify({}),
      notes: '',
      metadata: JSON.stringify(photoMetadata)
    };
    
    const { data: photoData, error: photoError } = await supabase
      .from('photos')
      .insert(newPhotoRecord)
      .select();
      
    if (photoError) {
      console.error('Supabase database error:', photoError);
      return res.status(500).json({ 
        error: 'Failed to save photo metadata', 
        details: photoError.message 
      });
    }
    
    // Format response to match the expected format by the frontend
    const newPhoto = {
      id: photoId,
      file_path: photoPath, // Changed from path to file_path for consistency
      thumbnail: photoPath,
      uploadDate: uploadDate,
      tags: [],
      analysisTags: {},
      notes: '',
      metadata: photoMetadata
    };
    
    // No longer updating local JSON file - using Supabase as single source of truth
    
    res.json(newPhoto);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photo
router.get('/api/soc/:socId/platform/:platform/photo/:photoId', async (req, res) => {
  const { socId, platform, photoId } = req.params;
  
  try {
    // Get the case ID from the request query or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // Get photo data from Supabase
    const { data: photoData, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .eq('case_id', caseId.toString()) // Filter by case ID to ensure isolation
      .eq('soc_id', socId.toString())
      .eq('platform', platform)
      .single();
      
    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (!photoData) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Format response to match the expected format by the frontend
    const formattedPhoto = {
      id: photoData.id,
      file_path: photoData.file_path, // Changed from path to file_path for consistency
      thumbnail: photoData.thumbnail,
      uploadDate: photoData.upload_date,
      tags: photoData.tags ? JSON.parse(photoData.tags) : [],
      analysisTags: photoData.analysis_tags ? JSON.parse(photoData.analysis_tags) : {},
      notes: photoData.notes || '',
      metadata: photoData.metadata ? JSON.parse(photoData.metadata) : {
        posted: new Date().toISOString().split('T')[0],
        likes: 0,
        comments: 0,
        engagementRate: '0%'
      }
    };
    
    res.json(formattedPhoto);
  } catch (error) {
    console.error('Error fetching photo data:', error);
    res.status(500).json({ error: 'Failed to fetch photo data' });
  }
});

// Update photo
router.put('/api/soc/:socId/platform/:platform/photo/:photoId', async (req, res) => {
  const { socId, platform, photoId } = req.params;
  const { tags, analysisTags, notes, metadata } = req.body;
  
  try {
    // Get the case ID from the request query or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // First, get the current photo data from Supabase
    const { data: photoData, error: getError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .eq('case_id', caseId.toString()) // Filter by case ID to ensure isolation
      .eq('soc_id', socId.toString())
      .eq('platform', platform)
      .single();
      
    if (getError) {
      console.error('Supabase error getting photo:', getError);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (!photoData) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (tags) updateData.tags = JSON.stringify(tags);
    if (analysisTags) {
      const currentAnalysisTags = photoData.analysis_tags ? JSON.parse(photoData.analysis_tags) : {};
      updateData.analysis_tags = JSON.stringify({ ...currentAnalysisTags, ...analysisTags });
    }
    if (notes !== undefined) updateData.notes = notes;
    if (metadata) {
      const currentMetadata = photoData.metadata ? JSON.parse(photoData.metadata) : {};
      updateData.metadata = JSON.stringify({ ...currentMetadata, ...metadata });
    }
    
    // Update in Supabase
    const { data: updatedData, error: updateError } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', photoId)
      .eq('soc_id', socId.toString()) // Ensure socId is treated as string
      .eq('platform', platform)
      .select();
      
    if (updateError) {
      console.error('Supabase error updating photo:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update photo', 
        details: updateError.message 
      });
    }
    
    // Format response to match the expected format by the frontend
    const formattedPhoto = {
      id: photoData.id,
      file_path: photoData.file_path, // Changed from path to file_path for consistency
      thumbnail: photoData.thumbnail,
      uploadDate: photoData.upload_date,
      tags: tags || (photoData.tags ? JSON.parse(photoData.tags) : []),
      analysisTags: analysisTags ? 
        { ...(photoData.analysis_tags ? JSON.parse(photoData.analysis_tags) : {}), ...analysisTags } : 
        (photoData.analysis_tags ? JSON.parse(photoData.analysis_tags) : {}),
      notes: notes !== undefined ? notes : (photoData.notes || ''),
      metadata: metadata ? 
        { ...(photoData.metadata ? JSON.parse(photoData.metadata) : {}), ...metadata } : 
        (photoData.metadata ? JSON.parse(photoData.metadata) : {})
    };
    
    // No longer updating local JSON file - using Supabase as single source of truth
    
    res.json(formattedPhoto);
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete photo
router.delete('/api/soc/:socId/platform/:platform/photo/:photoId', async (req, res) => {
  const { socId, platform, photoId } = req.params;
  
  try {
    // Get the case ID from the request query or header
    const caseId = req.query.caseId || req.headers['x-case-id'];
    if (!caseId) {
      return res.status(400).json({ error: 'Case ID is required' });
    }
    
    // First, get the photo data from Supabase to get the storage path
    const { data: photoData, error: getError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .eq('case_id', caseId.toString()) // Filter by case ID to ensure isolation
      .eq('soc_id', socId.toString())
      .eq('platform', platform)
      .single();
      
    if (getError) {
      console.error('Supabase error getting photo:', getError);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (!photoData) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Extract the storage path from the URL
    const photoUrl = photoData.file_path;
    const storagePathMatch = photoUrl.match(/\/([^\/]+\/[^\/]+\/[^\/]+)$/);
    
    if (storagePathMatch && storagePathMatch[1]) {
      const storagePath = storagePathMatch[1];
      
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('dtam-photos')
        .remove([storagePath]);
        
      if (storageError) {
        console.error('Supabase storage error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete from Supabase Database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('soc_id', socId.toString()) // Ensure socId is treated as string
      .eq('platform', platform);
      
    if (dbError) {
      console.error('Supabase database error:', dbError);
      return res.status(500).json({ 
        error: 'Failed to delete photo from database', 
        details: dbError.message 
      });
    }
    
    // No longer updating local JSON file - using Supabase as single source of truth
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
