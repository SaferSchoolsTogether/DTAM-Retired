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
    platforms: {
      instagram: {
        username: 'test_user',
        displayName: 'Test User',
        url: 'instagram.com/test_user',
        photos: []
      },
      facebook: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      },
      twitter: {
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
      youtube: {
        username: '',
        displayName: '',
        url: '',
        photos: []
      }
    }
  };
  fs.writeJsonSync(DATA_FILE, initialData, { spaces: 2 });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const platform = req.params.platform || 'instagram';
    const uploadDir = path.join(__dirname, 'public', 'uploads', platform);
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
// Home route - show welcome page
app.get('/', (req, res) => {
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
app.get('/platform/:platform', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).send('Platform not found');
  }
  
  res.render('workstation', {
    platform: platform,
    platformData: data.platforms[platform],
    allPlatforms: Object.keys(data.platforms)
  });
});

// API Routes
// Get platform data
app.get('/api/platform/:platform', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  res.json(data.platforms[platform]);
});

// Update platform info
app.post('/api/platform/:platform', (req, res) => {
  const platform = req.params.platform;
  const { username, displayName, url } = req.body;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  data.platforms[platform].username = username || data.platforms[platform].username;
  data.platforms[platform].displayName = displayName || data.platforms[platform].displayName;
  data.platforms[platform].url = url || data.platforms[platform].url;
  
  writeData(data);
  res.json(data.platforms[platform]);
});

// Upload photo
app.post('/api/platform/:platform/upload', upload.single('photo'), (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const photoId = uuidv4();
  const photoPath = `/uploads/${platform}/${req.file.filename}`;
  
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
  
  data.platforms[platform].photos.push(newPhoto);
  writeData(data);
  
  res.json(newPhoto);
});

// Get photo
app.get('/api/platform/:platform/photo/:photoId', (req, res) => {
  const { platform, photoId } = req.params;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  const photo = data.platforms[platform].photos.find(p => p.id === photoId);
  
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  res.json(photo);
});

// Update photo
app.put('/api/platform/:platform/photo/:photoId', (req, res) => {
  const { platform, photoId } = req.params;
  const { tags, analysisTags, notes, metadata } = req.body;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  const photoIndex = data.platforms[platform].photos.findIndex(p => p.id === photoId);
  
  if (photoIndex === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const photo = data.platforms[platform].photos[photoIndex];
  
  if (tags) photo.tags = tags;
  if (analysisTags) photo.analysisTags = { ...photo.analysisTags, ...analysisTags };
  if (notes) photo.notes = notes;
  if (metadata) photo.metadata = { ...photo.metadata, ...metadata };
  
  data.platforms[platform].photos[photoIndex] = photo;
  writeData(data);
  
  res.json(photo);
});

// Delete photo
app.delete('/api/platform/:platform/photo/:photoId', (req, res) => {
  const { platform, photoId } = req.params;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  const photoIndex = data.platforms[platform].photos.findIndex(p => p.id === photoId);
  
  if (photoIndex === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const photo = data.platforms[platform].photos[photoIndex];
  
  // Remove the file
  try {
    const filePath = path.join(__dirname, 'public', photo.path);
    fs.removeSync(filePath);
  } catch (err) {
    console.error('Error removing file:', err);
  }
  
  // Remove from data
  data.platforms[platform].photos.splice(photoIndex, 1);
  writeData(data);
  
  res.json({ success: true });
});

// Generate report
app.get('/api/platform/:platform/report', (req, res) => {
  const platform = req.params.platform;
  const data = readData();
  
  if (!data.platforms[platform]) {
    return res.status(404).json({ error: 'Platform not found' });
  }
  
  // For now, just return the platform data
  // In the future, this would generate a PDF
  res.json(data.platforms[platform]);
});

// Clear session - delete all data and reset to initial state
app.post('/api/clear-session', async (req, res) => {
  try {
    // Delete all uploaded photos
    const platforms = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube'];
    
    // Delete all files in upload directories
    for (const platform of platforms) {
      const uploadDir = path.join(__dirname, 'public', 'uploads', platform);
      // Keep the directory but remove all files
      await fs.emptyDir(uploadDir);
    }
    
    // Reset app-data.json to initial state
    const initialData = {
      platforms: {
        instagram: {
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
        twitter: {
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
        youtube: {
          username: '',
          displayName: '',
          url: '',
          photos: []
        }
      }
    };
    
    // Write the reset data
    writeData(initialData);
    
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
  
  // Ensure upload directories exist
  Object.keys(readData().platforms).forEach(platform => {
    fs.ensureDirSync(path.join(__dirname, 'public', 'uploads', platform));
  });
});
