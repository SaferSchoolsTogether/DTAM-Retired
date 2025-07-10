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
const fs = require('fs-extra');
const path = require('path');
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

// Migrate data from JSON to Supabase
router.post('/api/migrate-to-supabase', async (req, res) => {
  try {
    console.log('Starting migration to Supabase...');
    const data = readData();
    
    // Migrate case data
    if (data.case && data.case.caseId) {
      const caseData = {
        id: data.case.caseId,
        date: data.case.date,
        team_member_name: data.case.investigatorName,
        organization: data.case.organization,
        soc_status: data.case.socStatus,
        discovery_method: data.case.discoveryMethod,
        safety_assessment: data.case.safetyAssessment,
        student_info: data.case.studentInfo ? JSON.stringify(data.case.studentInfo) : null
      };
      
      const { error: caseError } = await supabase
        .from('cases')
        .upsert(caseData);
        
      if (caseError) {
        console.error('Error migrating case:', caseError);
      } else {
        console.log('Case data migrated successfully');
      }
    }
    
    // Migrate SOCs and platforms
    for (const [socId, soc] of Object.entries(data.socs)) {
      // Insert SOC
      const socData = {
        id: socId,
        name: soc.name,
        student_id: soc.studentId,
        grade: soc.grade,
        school: soc.school,
        dob: soc.dob,
        support_plans: JSON.stringify(soc.supportPlans),
        other_plan_text: soc.otherPlanText,
        status: soc.status
      };
      
      const { error: socError } = await supabase
        .from('socs')
        .upsert(socData);
        
      if (socError) {
        console.error(`Error migrating SOC ${socId}:`, socError);
        continue;
      } else {
        console.log(`SOC ${socId} migrated successfully`);
      }
      
      // Migrate platforms
      for (const [platformName, platform] of Object.entries(soc.platforms)) {
        const platformData = {
          soc_id: socId,
          name: platformName,
          username: platform.username,
          display_name: platform.displayName,
          url: platform.url
        };
        
        const { error: platformError } = await supabase
          .from('platforms')
          .upsert(platformData, { 
            onConflict: 'soc_id,name' 
          });
          
        if (platformError) {
          console.error(`Error migrating platform ${platformName} for SOC ${socId}:`, platformError);
          continue;
        } else {
          console.log(`Platform ${platformName} for SOC ${socId} migrated successfully`);
        }
        
        // Migrate photos
        for (const photo of platform.photos) {
          try {
            // Check if photo already exists in Supabase
            const { data: existingPhoto } = await supabase
              .from('photos')
              .select('id')
              .eq('id', photo.id)
              .single();
              
            if (existingPhoto) {
              console.log(`Photo ${photo.id} already exists in Supabase, skipping`);
              continue;
            }
            
            // Upload file to Supabase storage if it exists locally
            const localFilePath = path.join(__dirname, '..', 'public', photo.path);
            let photoPath = photo.path;
            
            if (fs.existsSync(localFilePath)) {
              const fileBuffer = await fs.readFile(localFilePath);
              const fileExt = path.extname(photo.path);
              const storagePath = `${socId}/${platformName}/${photo.id}${fileExt}`;
              
              const { error: storageError } = await supabase.storage
                .from('dtam-photos')
                .upload(storagePath, fileBuffer, {
                  contentType: `image/${fileExt.substring(1)}`,
                  upsert: true
                });
                
              if (storageError) {
                console.error(`Error uploading photo ${photo.id}:`, storageError);
                continue;
              }
              
              // Get public URL
              const { data: publicUrlData } = supabase.storage
                .from('dtam-photos')
                .getPublicUrl(storagePath);
                
              photoPath = publicUrlData.publicUrl;
            }
            
            // Insert photo metadata
            const photoData = {
              id: photo.id,
              soc_id: socId,
              platform: platformName,
              file_path: photoPath,
              thumbnail: photo.thumbnail || photoPath,
              upload_date: photo.uploadDate,
              tags: JSON.stringify(photo.tags || []),
              analysis_tags: JSON.stringify(photo.analysisTags || {}),
              notes: photo.notes || '',
              metadata: JSON.stringify(photo.metadata || {})
            };
            
            const { error: photoError } = await supabase
              .from('photos')
              .upsert(photoData);
              
            if (photoError) {
              console.error(`Error migrating photo ${photo.id}:`, photoError);
            } else {
              console.log(`Photo ${photo.id} migrated successfully`);
            }
          } catch (photoError) {
            console.error(`Error processing photo ${photo.id}:`, photoError);
          }
        }
      }
    }
    
    console.log('Migration completed successfully');
    res.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

// Clear session - delete all data and reset to initial state
router.post('/api/clear-session', async (req, res) => {
  try {
    console.log('Clearing session data...');
    
    // Delete all uploaded photos from local filesystem
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    
    // Keep the directory but remove all files and subdirectories
    await fs.emptyDir(uploadDir);
    
    // Clear Supabase data
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
      
      // Delete all SOCs except soc_1
      const { error: deleteSocsError } = await supabase
        .from('socs')
        .delete()
        .neq('id', 'soc_1');
        
      if (deleteSocsError) {
        console.error('Error deleting SOCs from Supabase:', deleteSocsError);
      } else {
        console.log('Deleted all SOCs from Supabase database');
      }
      
      // Reset soc_1 to initial state
      const initialSoc = {
        id: 'soc_1',
        name: '',
        student_id: '',
        grade: '',
        school: '',
        dob: '',
        support_plans: JSON.stringify([]),
        other_plan_text: '',
        status: 'known'
      };
      
      const { error: resetSocError } = await supabase
        .from('socs')
        .upsert(initialSoc);
        
      if (resetSocError) {
        console.error('Error resetting soc_1 in Supabase:', resetSocError);
      } else {
        console.log('Reset soc_1 to initial state in Supabase');
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
    
    // Reset app-data.json to initial state
    const initialData = {
      case: {
        caseId: '',
        date: '',
        investigatorName: '',
        organization: '',
        discoveryMethod: '',
        safetyAssessment: ''
      },
      socs: {
        soc_1: {
          id: 'soc_1',
          name: '',
          studentId: '',
          grade: '',
          school: '',
          dob: '',
          supportPlans: [],
          otherPlanText: '',
          status: 'known',
          platforms: {
            instagram: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            },
            tiktok: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            },
            snapchat: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            },
            x: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            },
            discord: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            },
            facebook: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            },
            other: {
              username: '',
              displayName: '',
              url: '',
              photos: []
            }
          }
        }
      },
      activeSocId: 'soc_1'
    };
    
    // Write the reset data
    writeData(initialData);
    
    // Create directories for the SOC platforms
    Object.keys(initialData.socs).forEach(socId => {
      Object.keys(initialData.socs[socId].platforms).forEach(platform => {
        const platformDir = path.join(__dirname, '..', 'public', 'uploads', socId, platform);
        fs.ensureDirSync(platformDir);
      });
    });
    
    console.log('Session cleared successfully');
    
    // Return success
    res.json({ success: true, message: 'Session cleared successfully' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

module.exports = router;
