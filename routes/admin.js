/**
 * Admin and Settings Routes
 * Handles routes related to administrative functions, including:
 * - Session clearing
 * - Data migration
 * - System settings
 * 
 * Note: Some of these routes may require authentication in the future.
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');


// Clear session - delete all data and reset to initial state (Supabase only)
router.post('/api/clear-session', async (req, res) => {
  try {
    console.log('Clearing session data...');
    
    // Clear Supabase data only - no local file system operations
    try {
      // Get all photos to find storage paths
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*');
        
      if (!photosError && photos && photos.length > 0) {
        // Collect all storage paths to delete
        const storagePaths = [];
        
        for (const photo of photos) {
          const photoUrl = photo.file_path;
          const storagePathMatch = photoUrl.match(/\/([^\/]+\/[^\/]+\/[^\/]+)$/);
          
          if (storagePathMatch && storagePathMatch[1]) {
            storagePaths.push(storagePathMatch[1]);
          }
        }
        
        // Delete files from storage in batches of 100 (Supabase limit)
        if (storagePaths.length > 0) {
          for (let i = 0; i < storagePaths.length; i += 100) {
            const batch = storagePaths.slice(i, i + 100);
            await supabase.storage
              .from('dtam-photos')
              .remove(batch);
          }
          console.log(`Deleted ${storagePaths.length} files from Supabase storage`);
        }
      }
      
      // Delete all photos
      const { error: deletePhotosError } = await supabase
        .from('photos')
        .delete()
        .neq('id', 'dummy_value_to_delete_all');
        
      if (deletePhotosError) {
        console.error('Error deleting photos from Supabase:', deletePhotosError);
      } else {
        console.log('Deleted all photos from Supabase database');
      }
      
      // Delete all platforms
      const { error: deletePlatformsError } = await supabase
        .from('platforms')
        .delete()
        .neq('soc_id', 'dummy_value_to_delete_all');
        
      if (deletePlatformsError) {
        console.error('Error deleting platforms from Supabase:', deletePlatformsError);
      } else {
        console.log('Deleted all platforms from Supabase database');
      }
      
      // Delete all SOCs
      const { error: deleteSocsError } = await supabase
        .from('socs')
        .delete()
        .neq('id', 'dummy_value_to_delete_all');
        
      if (deleteSocsError) {
        console.error('Error deleting SOCs from Supabase:', deleteSocsError);
      } else {
        console.log('Deleted all SOCs from Supabase database');
      }
      
      // Delete all cases
      const { error: deleteCasesError } = await supabase
        .from('cases')
        .delete()
        .neq('id', 'dummy_value_to_delete_all');
        
      if (deleteCasesError) {
        console.error('Error deleting cases from Supabase:', deleteCasesError);
      } else {
        console.log('Deleted all cases from Supabase database');
      }
    } catch (supabaseError) {
      console.error('Error clearing Supabase data:', supabaseError);
    }
    
    console.log('Session cleared successfully');
    
    // Return success
    res.json({ success: true, message: 'Session cleared successfully' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

module.exports = router;
