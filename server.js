const express = require('express');
  const path = require('path');
  const fs = require('fs-extra');
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

  // Additional static file handling for Vercel deployment
  app.use('/css', express.static(path.join(__dirname, 'public/css')));
  app.use('/js', express.static(path.join(__dirname, 'public/js')));
  app.use('/reports', express.static(path.join(__dirname, 'public/reports')));
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

  // Debug route to check static file serving
  app.get('/debug/static-files', (req, res) => {
    const fs = require('fs');
    const staticFiles = {
      'styles.css': fs.existsSync(path.join(__dirname, 'public/css/styles.css')),
      'onboarding.css': fs.existsSync(path.join(__dirname, 'public/css/onboarding.css')),
      'navigation.css': fs.existsSync(path.join(__dirname, 'public/css/components/navigation.css')),
      'typography.css': fs.existsSync(path.join(__dirname, 'public/css/base/typography.css')),
      'layout.css': fs.existsSync(path.join(__dirname, 'public/css/base/layout.css'))
    };

    res.json({
      message: 'Static file check',
      files: staticFiles,
      publicPath: path.join(__dirname, 'public'),
      cssPath: path.join(__dirname, 'public/css')
    });
  });

  // Set up EJS as the view engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Ensure uploads directory exists (only for local development)
  const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
  if (process.env.NODE_ENV !== 'production') {
    fs.ensureDirSync(UPLOADS_DIR);
  }

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

  // Export app for Vercel serverless function
  module.exports = app;

  // Start the server (only for local development)
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);

      // Ensure upload directories exist for common platforms (local only)
      const platforms = ['instagram', 'tiktok', 'snapchat', 'x', 'discord', 'facebook', 'other'];

      // Create default upload directories
      fs.ensureDirSync(UPLOADS_DIR);

      console.log('Server is ready to handle requests');
    });
  }