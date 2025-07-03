const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure directories exist
fs.ensureDirSync(DATA_DIR);

// Read current data
console.log('Reading current app-data.json...');
const currentData = fs.readJsonSync(DATA_FILE);

// Create new data structure
console.log('Creating new data structure...');
const newData = {
  case: {
    caseId: currentData.case.caseId || '',
    date: currentData.case.date || '',
    investigatorName: currentData.case.investigatorName || '',
    organization: currentData.case.organization || '',
    discoveryMethod: currentData.case.discoveryMethod || '',
    safetyAssessment: currentData.case.safetyAssessment || ''
  },
  socs: {},
  activeSocId: 'soc_1'
};

// Create first SOC with existing student info
const socId = 'soc_1';
newData.socs[socId] = {
  id: socId,
  name: currentData.case.studentInfo?.name || '',
  studentId: currentData.case.studentInfo?.id || '',
  grade: currentData.case.studentInfo?.grade || '',
  school: currentData.case.studentInfo?.school || '',
  dob: currentData.case.studentInfo?.dob || '',
  supportPlans: currentData.case.studentInfo?.supportPlans || [],
  otherPlanText: currentData.case.studentInfo?.otherPlanText || '',
  status: currentData.case.socStatus || 'known',
  platforms: {
    instagram: {
      username: currentData.platforms.instagram?.username || '',
      displayName: currentData.platforms.instagram?.displayName || '',
      url: currentData.platforms.instagram?.url || '',
      photos: []
    },
    tiktok: {
      username: currentData.platforms.tiktok?.username || '',
      displayName: currentData.platforms.tiktok?.displayName || '',
      url: currentData.platforms.tiktok?.url || '',
      photos: []
    },
    snapchat: {
      username: '',
      displayName: '',
      url: '',
      photos: []
    },
    x: {
      username: currentData.platforms.twitter?.username || '',
      displayName: currentData.platforms.twitter?.displayName || '',
      url: currentData.platforms.twitter?.url || '',
      photos: []
    },
    discord: {
      username: '',
      displayName: '',
      url: '',
      photos: []
    },
    facebook: {
      username: currentData.platforms.facebook?.username || '',
      displayName: currentData.platforms.facebook?.displayName || '',
      url: currentData.platforms.facebook?.url || '',
      photos: []
    },
    other: {
      username: currentData.platforms.youtube?.username || '',
      displayName: currentData.platforms.youtube?.displayName || '',
      url: currentData.platforms.youtube?.url || '',
      photos: []
    }
  }
};

// Migrate photos for each platform
console.log('Migrating photos...');
const platformMap = {
  'instagram': 'instagram',
  'tiktok': 'tiktok',
  'twitter': 'x',
  'facebook': 'facebook',
  'youtube': 'other'
};

// Process each platform's photos
Object.keys(currentData.platforms).forEach(oldPlatform => {
  const newPlatform = platformMap[oldPlatform] || 'other';
  
  // Skip if platform doesn't exist in the old data
  if (!currentData.platforms[oldPlatform]) return;
  
  // Process photos
  if (currentData.platforms[oldPlatform].photos && Array.isArray(currentData.platforms[oldPlatform].photos)) {
    currentData.platforms[oldPlatform].photos.forEach(photo => {
      // Create new photo object with updated path
      const oldPath = photo.path;
      const filename = path.basename(oldPath);
      const newPath = `/uploads/${socId}/${newPlatform}/${filename}`;
      const newThumbnail = `/uploads/${socId}/${newPlatform}/${filename}`;
      
      const newPhoto = {
        ...photo,
        path: newPath,
        thumbnail: newThumbnail
      };
      
      // Add to new data structure
      newData.socs[socId].platforms[newPlatform].photos.push(newPhoto);
      
      // Create directory for the new platform if it doesn't exist
      const newDir = path.join(UPLOADS_DIR, socId, newPlatform);
      fs.ensureDirSync(newDir);
      
      // Move the file if it exists
      const oldFilePath = path.join(__dirname, '..', 'public', oldPath);
      const newFilePath = path.join(__dirname, '..', 'public', newPath);
      
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.copySync(oldFilePath, newFilePath);
          console.log(`Copied ${oldFilePath} to ${newFilePath}`);
        } catch (err) {
          console.error(`Error copying file: ${err.message}`);
        }
      } else {
        console.warn(`Warning: Original file not found: ${oldFilePath}`);
      }
    });
  }
});

// Create a second empty SOC as an example
const soc2Id = 'soc_2';
newData.socs[soc2Id] = {
  id: soc2Id,
  name: 'Example Student',
  studentId: '',
  grade: '',
  school: '',
  dob: '',
  supportPlans: [],
  otherPlanText: '',
  status: 'potential',
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
};

// Write new data structure to file
console.log('Writing new data structure to app-data.json...');
fs.writeJsonSync(DATA_FILE, newData, { spaces: 2 });

console.log('Migration complete!');
console.log('New data structure has been written to app-data.json');
console.log('Photo files have been copied to their new locations');
console.log('You may want to delete the old photo files after verifying everything works correctly');
