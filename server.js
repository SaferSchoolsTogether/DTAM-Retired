const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import route modules
const casesRoutes = require('./routes/cases');
const socsRoutes = require('./routes/socs');
const photosRoutes = require('./routes/photos');
const platformsRoutes = require('./routes/platforms');
const reportsRoutes = require('./routes/reports');
const analysisRoutes = require('./routes/analysis');
const { router: authRoutes, requireAuth } = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const onboardingRoutes = require('./routes/onboarding');
const threatsRoutes = require('./routes/threats');
const threatSocsRoutes = require('./routes/threat-socs');

// Import Supabase client for direct database access
const supabase = require('./config/supabase');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(morgan('dev')); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public')); // Serve static files from public directory

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Root route - redirect to login or dashboard
app.get('/', async (req, res) => {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Clear invalid token
      res.clearCookie('authToken');
      return res.redirect('/login');
    }
    
    // User is authenticated, redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Root route error:', error);
    res.clearCookie('authToken');
    res.redirect('/login');
  }
});

// Use auth routes (no auth required)
app.use(authRoutes);

// Protected routes (require authentication)
app.use(requireAuth, casesRoutes);
app.use(requireAuth, socsRoutes);
app.use(requireAuth, photosRoutes);
app.use(requireAuth, platformsRoutes);
app.use(requireAuth, reportsRoutes);
app.use(requireAuth, analysisRoutes);
app.use(requireAuth, adminRoutes);
app.use(requireAuth, apiRoutes);
app.use(requireAuth, onboardingRoutes);
app.use(requireAuth, threatsRoutes);
app.use(requireAuth, threatSocsRoutes);

// Mini-workstation route for analyzing unknown threats
app.get('/mini-workstation', async (req, res) => {
  const { caseId, threatId } = req.query;
  
  if (!caseId || !threatId) {
    return res.status(400).render('error', { 
      message: 'Missing required parameters. Both caseId and threatId are required.' 
    });
  }
  
  try {
    // Get threat data
    const { data: threatData, error: threatError } = await supabase
      .from('threats')
      .select('*')
      .eq('id', threatId)
      .single();
      
    if (threatError || !threatData) {
      console.error('Error fetching threat data:', threatError);
      return res.status(404).render('error', { message: 'Threat not found' });
    }
    
    // Determine platform based on discovery method
    let platform = 'threat_evidence'; // Default platform for physical threats
    
    if (threatData.discovery_method === 'social') {
      // For social media threats, use the actual platform from the threat data
      platform = threatData.sourcePlatform || 'other';
    }
    
    // Get photos for this case and platform
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('platform', platform);
      
    if (photosError) {
      console.error('Error fetching photos:', photosError);
      // Continue without photos
    }
    
    // Format photos data
    const photos = photosData ? photosData.map(photo => {
      // Parse tags if it's a string
      let tags = photo.tags || [];
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          console.error('Error parsing tags:', e);
          tags = [];
        }
      }
      
      // Parse analysis_tags if it's a string
      let analysisTags = photo.analysis_tags || {};
      if (typeof analysisTags === 'string') {
        try {
          analysisTags = JSON.parse(analysisTags);
        } catch (e) {
          console.error('Error parsing analysis_tags:', e);
          analysisTags = {};
        }
      }
      
      // Parse metadata if it's a string
      let metadata = photo.metadata || {};
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Error parsing metadata:', e);
          metadata = {};
        }
      }
      
      return {
        id: photo.id,
        file_path: photo.file_path,
        notes: photo.notes || '',
        tags: tags,
        analysisTags: analysisTags,
        metadata: metadata
      };
    }) : [];
    
    // Render the mini-workstation view
    res.render('mini-workstation', { 
      caseId,
      threatId,
      platform,
      photos,
      threatContent: threatData.content || ''
    });
  } catch (error) {
    console.error('Error in mini-workstation route:', error);
    res.status(500).render('error', { message: 'An error occurred while loading the mini workstation' });
  }
});

// Export the app for serverless deployment (Vercel)
module.exports = app;

// For local development, start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Server is ready to handle requests');
  });
}
