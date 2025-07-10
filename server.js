const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// Import route modules
const casesRoutes = require('./routes/cases');
const socsRoutes = require('./routes/socs');
const photosRoutes = require('./routes/photos');
const platformsRoutes = require('./routes/platforms');
const reportsRoutes = require('./routes/reports');
const analysisRoutes = require('./routes/analysis');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const onboardingRoutes = require('./routes/onboarding');

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

// Use route modules
app.use(casesRoutes);
app.use(socsRoutes);
app.use(photosRoutes);
app.use(platformsRoutes);
app.use(reportsRoutes);
app.use(analysisRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use(apiRoutes);
app.use(onboardingRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Ensure data directory exists
  fs.ensureDirSync(DATA_DIR);
  
  // Ensure upload directories exist for each SOC and platform
  const data = fs.readJsonSync(DATA_FILE);
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
