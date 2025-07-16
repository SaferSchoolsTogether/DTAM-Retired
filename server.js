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

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
fs.ensureDirSync(UPLOADS_DIR);

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
  
  // Ensure upload directories exist for common platforms
  const platforms = ['instagram', 'tiktok', 'snapchat', 'x', 'discord', 'facebook', 'other'];
  
  // Create default upload directories
  fs.ensureDirSync(UPLOADS_DIR);
  
  console.log('Server is ready to handle requests');
});
