const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(morgan('dev')); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public directory

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR);

// Initialize data store if it doesn't exist
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');
if (!fs.existsSync(DATA_FILE)) {
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
  fs.writeJsonSync(DATA_FILE, initialData, { spaces: 2 });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const socId = req.params.socId || 'soc_1';
    const platform = req.params.platform || 'instagram';
    const uploadDir = path.join(__dirname, 'public', 'uploads', socId, platform);
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

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

// Helper function to read data
function readData() {
  return fs.readJsonSync(DATA_FILE);
}

// Helper function to write data
function writeData(data) {
  return fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

// Routes
// Dashboard route
app.get('/dashboard', (req, res) => {
  // Get case data for the dashboard
  const data = readData();
  
  // Format case data for display
  const cases = [];
  if (data.case && data.case.caseId) {
    // Add status field to case data
    const caseWithStatus = {
      ...data.case,
      status: 'Active', // Default status
      socName: data.socs[data.activeSocId]?.name || 'Unknown',
      platforms: {}
    };
    
    // Check which platforms have data
    Object.keys(data.socs[data.activeSocId].platforms).forEach(platform => {
      const platformData = data.socs[data.activeSocId].platforms[platform];
      caseWithStatus.platforms[platform] = platformData.username || platformData.photos.length > 0;
    });
    
    cases.push(caseWithStatus);
  }
  
  res.render('dashboard', { cases });
});

// Cases route
app.get('/cases', (req, res) => {
  // Get case data
  const data = readData();
  
  // Format case data for display
  const cases = [];
  if (data.case && data.case.caseId) {
    // Add status field to case data
    const caseWithStatus = {
      ...data.case,
      status: 'Active', // Default status
      socName: data.socs[data.activeSocId]?.name || 'Unknown',
      platforms: {}
    };
    
    // Check which platforms have data
    Object.keys(data.socs[data.activeSocId].platforms).forEach(platform => {
      const platformData = data.socs[data.activeSocId].platforms[platform];
      caseWithStatus.platforms[platform] = platformData.username || platformData.photos.length > 0;
    });
    
    cases.push(caseWithStatus);
  }
  
  res.render('cases', { cases });
});

// Search tips route
app.get('/tips', (req, res) => {
  res.render('tips');
});

// Home route - redirect to dashboard or show welcome page
app.get('/', (req, res) => {
  const data = readData();
  
  // If there's existing case data, redirect to dashboard
  if (data.case && data.case.caseId) {
    res.redirect('/dashboard');
  } else {
    // Otherwise show welcome page
    res.render('welcome');
  }
});

// New case route - always show welcome page
app.get('/new-case', (req, res) => {
  // Always render the welcome page to start a new case
  res.render('welcome');
});

// Onboarding routes
app.post('/soc-status', (req, res) => {
  // In a real app, we would store this in the session
  res.render('soc-status');
});

app.get('/soc-status', (req, res) => {
  // Handle GET request for soc-status
  res.render('soc-status');
});

app.post('/case-info', (req, res) => {
  // Store SOC status in session
  const { socStatus } = req.body;
  
  // In a real app, we would store this in the session
  res.render('case-info');
});

app.get('/case-info', (req, res) => {
  // Handle GET request for case-info
  res.render('case-info');
});

app.post('/discovery-method', (req, res) => {
  // Store SOC status in session
  const { socStatus } = req.body;
  
  // In a real app, we would store this in the session
  res.render('discovery-method');
});

app.get('/discovery-method', (req, res) => {
  // Handle GET request for discovery-method
  res.render('discovery-method');
});

app.post('/safety-assessment', (req, res) => {
  // Store case info in session
  const { caseId, date, investigatorName, organization } = req.body;
  
  // In a real app, we would store this in the session
  res.render('safety-assessment');
});

app.get('/safety-assessment', (req, res) => {
  // Handle GET request for safety-assessment
  res.render('safety-assessment');
});

app.post('/summary', (req, res) => {
  // Store safety assessment or discovery method in session
  const { safetyAssessment, discoveryMethod } = req.body;
  
  // In a real app, we would store this in the session
  res.render('summary');
});

app.get('/summary', (req, res) => {
  // Handle GET request for summary
  res.render('summary');
});

// Platform workstation route
app.get('/soc/:socId/platform/:platform', (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).send('SOC not found');
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).send('Platform not found');
  }
  
  // Update active SOC
  data.activeSocId = socId;
  writeData(data);
  
  res.render('workstation', {
    socId: socId,
    platform: platform,
    platformData: data.socs[socId].platforms[platform],
    socData: data.socs[socId],
    allPlatforms: Object.keys(data.socs[socId].platforms),
    allSocs: Object.keys(data.socs),
    allSocsData: data.socs,
    activeSocId: data.activeSocId
  });
});

// Redirect from old route to new route with active SOC
app.get('/platform/:platform', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  res.redirect(`/soc/${activeSocId}/platform/${platform}`);
});

// API Routes
// Get case data
app.get('/api/case-data', (req, res) => {
  try {
    const data = readData();
    
    if (!data.case) {
      return res.status(404).json({ error: 'Case data not found' });
    }
    
    res.json({ case: data.case });
  } catch (error) {
    console.error('Error fetching case data:', error);
    res.status(500).json({ error: 'Failed to fetch case data' });
  }
});

// Save case data
app.post('/api/save-case', (req, res) => {
  try {
    const data = readData();
    
    // Add case section while preserving platforms
    data.case = {
      caseId: req.body.caseId,
      date: req.body.date,
      investigatorName: req.body.investigatorName,
      organization: req.body.organization,
      socStatus: req.body.socStatus,
      discoveryMethod: req.body.discoveryMethod,
      safetyAssessment: req.body.safetyAssessment,
      studentInfo: req.body.studentInfo
    };
    
    writeData(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving case data:', error);
    res.status(500).json({ error: 'Failed to save case data' });
  }
});

// Get platform data
app.get('/api/soc/:socId/platform/:platform', (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  res.json(data.socs[socId].platforms[platform]);
});

// Update platform info
app.post('/api/soc/:socId/platform/:platform', (req, res) => {
  const { socId, platform } = req.params;
  const { username, displayName, url } = req.body;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  data.socs[socId].platforms[platform].username = username || data.socs[socId].platforms[platform].username;
  data.socs[socId].platforms[platform].displayName = displayName || data.socs[socId].platforms[platform].displayName;
  data.socs[socId].platforms[platform].url = url || data.socs[socId].platforms[platform].url;
  
  writeData(data);
  res.json(data.socs[socId].platforms[platform]);
});

// Get SOC data
app.get('/api/soc/:socId', (req, res) => {
  const { socId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  res.json(data.socs[socId]);
});

// Get all SOCs
app.get('/api/socs', (req, res) => {
  const data = readData();
  res.json(data.socs);
});

// Create new SOC
app.post('/api/socs', (req, res) => {
  const { name, studentId, grade, school, dob, supportPlans, otherPlanText, status } = req.body;
  const data = readData();
  
  const socId = `soc_${uuidv4().substring(0, 8)}`;
  
  data.socs[socId] = {
    id: socId,
    name: name || '',
    studentId: studentId || '',
    grade: grade || '',
    school: school || '',
    dob: dob || '',
    supportPlans: supportPlans || [],
    otherPlanText: otherPlanText || '',
    status: status || 'potential',
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
  
  // Create directories for the new SOC
  Object.keys(data.socs[socId].platforms).forEach(platform => {
    const uploadDir = path.join(__dirname, 'public', 'uploads', socId, platform);
    fs.ensureDirSync(uploadDir);
  });
  
  writeData(data);
  res.json(data.socs[socId]);
});

// Update SOC
app.put('/api/soc/:socId', (req, res) => {
  const { socId } = req.params;
  const { name, studentId, grade, school, dob, supportPlans, otherPlanText, status } = req.body;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (name) data.socs[socId].name = name;
  if (studentId) data.socs[socId].studentId = studentId;
  if (grade) data.socs[socId].grade = grade;
  if (school) data.socs[socId].school = school;
  if (dob) data.socs[socId].dob = dob;
  if (supportPlans) data.socs[socId].supportPlans = supportPlans;
  if (otherPlanText !== undefined) data.socs[socId].otherPlanText = otherPlanText;
  if (status) data.socs[socId].status = status;
  
  writeData(data);
  res.json(data.socs[socId]);
});

// Set active SOC
app.post('/api/active-soc/:socId', (req, res) => {
  const { socId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  data.activeSocId = socId;
  writeData(data);
  
  res.json({ success: true, activeSocId: socId });
});

// Get active SOC
app.get('/api/active-soc', (req, res) => {
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  if (!data.socs[activeSocId]) {
    return res.status(404).json({ error: 'Active SOC not found' });
  }
  
  res.json({ 
    activeSocId: activeSocId,
    socData: data.socs[activeSocId]
  });
});

// Upload photo
app.post('/api/soc/:socId/platform/:platform/upload', upload.single('photo'), (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const photoId = uuidv4();
  const photoPath = `/uploads/${socId}/${platform}/${req.file.filename}`;
  
  const newPhoto = {
    id: photoId,
    path: photoPath,
    thumbnail: photoPath, // For now, using the same path for thumbnail
    uploadDate: new Date().toISOString(),
    tags: [],
    analysisTags: {},
    notes: '',
    metadata: {
      posted: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: 0,
      engagementRate: '0%'
    }
  };
  
  data.socs[socId].platforms[platform].photos.push(newPhoto);
  writeData(data);
  
  res.json(newPhoto);
});

// Get photo
app.get('/api/soc/:socId/platform/:platform/photo/:photoId', (req, res) => {
  const { socId, platform, photoId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  const photo = data.socs[socId].platforms[platform].photos.find(p => p.id === photoId);
  
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  res.json(photo);
});

// Update photo
app.put('/api/soc/:socId/platform/:platform/photo/:photoId', (req, res) => {
  const { socId, platform, photoId } = req.params;
  const { tags, analysisTags, notes, metadata } = req.body;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  const photoIndex = data.socs[socId].platforms[platform].photos.findIndex(p => p.id === photoId);
  
  if (photoIndex === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const photo = data.socs[socId].platforms[platform].photos[photoIndex];
  
  if (tags) photo.tags = tags;
  if (analysisTags) photo.analysisTags = { ...photo.analysisTags, ...analysisTags };
  if (notes) photo.notes = notes;
  if (metadata) photo.metadata = { ...photo.metadata, ...metadata };
  
  data.socs[socId].platforms[platform].photos[photoIndex] = photo;
  writeData(data);
  
  res.json(photo);
});

// Delete photo
app.delete('/api/soc/:socId/platform/:platform/photo/:photoId', (req, res) => {
  const { socId, platform, photoId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  const photoIndex = data.socs[socId].platforms[platform].photos.findIndex(p => p.id === photoId);
  
  if (photoIndex === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const photo = data.socs[socId].platforms[platform].photos[photoIndex];
  
  // Remove the file
  try {
    const filePath = path.join(__dirname, 'public', photo.path);
    fs.removeSync(filePath);
  } catch (err) {
    console.error('Error removing file:', err);
  }
  
  // Remove from data
  data.socs[socId].platforms[platform].photos.splice(photoIndex, 1);
  writeData(data);
  
  res.json({ success: true });
});

// Generate report for a platform
app.get('/api/soc/:socId/platform/:platform/report', (req, res) => {
  const { socId, platform } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  if (!data.socs[socId].platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  // For now, just return the platform data
  // In the future, this would generate a PDF
  res.json(data.socs[socId].platforms[platform]);
});

// Generate report for a SOC (all platforms)
app.get('/api/soc/:socId/report', (req, res) => {
  const { socId } = req.params;
  const data = readData();
  
  if (!data.socs[socId]) {
    return res.status(404).json({ error: 'SOC not found' });
  }
  
  // For now, just return the SOC data
  // In the future, this would generate a PDF with all platforms
  res.json(data.socs[socId]);
});

// Generate report for the entire case
app.get('/api/case/report', (req, res) => {
  const data = readData();
  
  if (!data.case) {
    return res.status(404).json({ error: 'Case data not found' });
  }
  
  // For now, just return the case data with SOCs
  // In the future, this would generate a comprehensive PDF
  res.json({
    case: data.case,
    socs: data.socs
  });
});

// Redirect from old report endpoint
app.get('/api/platform/:platform/report', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  const activeSocId = data.activeSocId || Object.keys(data.socs)[0] || 'soc_1';
  
  res.redirect(`/api/soc/${activeSocId}/platform/${platform}/report`);
});

// Clear session - delete all data and reset to initial state
app.post('/api/clear-session', async (req, res) => {
  try {
    // Delete all uploaded photos
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    
    // Keep the directory but remove all files and subdirectories
    await fs.emptyDir(uploadDir);
    
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
        const platformDir = path.join(__dirname, 'public', 'uploads', socId, platform);
        fs.ensureDirSync(platformDir);
      });
    });
    
    // Return success
    res.json({ success: true, message: 'Session cleared successfully' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Ensure data directory exists
  fs.ensureDirSync(DATA_DIR);
  
  // Ensure upload directories exist for each SOC and platform
  const data = readData();
  if (data.socs) {
    Object.keys(data.socs).forEach(socId => {
      if (data.socs[socId].platforms) {
        Object.keys(data.socs[socId].platforms).forEach(platform => {
          fs.ensureDirSync(path.join(__dirname, 'public', 'uploads', socId, platform));
        });
      }
    });
  }
  
  console.log('Server is ready to handle requests');
});
