/**
 * Authentication Routes
 * Handles routes related to user authentication, including:
 * - User login
 * - User registration
 * - Password reset
 * - Session management
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const cookieParser = require('cookie-parser');

// Middleware
router.use(cookieParser());

// Authentication middleware
const requireAuth = async (req, res, next) => {
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
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.clearCookie('authToken');
    res.redirect('/login');
  }
};

// Login page route
router.get('/login', (req, res) => {
  res.render('login');
});

// Registration page route
router.get('/register', (req, res) => {
  res.render('register');
});

// Login endpoint
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ message: error.message });
    }
    
    // Set auth token in cookie
    res.cookie('authToken', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Get user metadata from Supabase Auth
    const userData = data.user.user_metadata || {};
    
    // Return success with user data
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: userData.first_name || '',
        lastName: userData.last_name || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Registration endpoint
router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create user in Supabase Auth
    console.log('Attempting to create user with email:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });
    
    if (authError) {
      console.error('Supabase Auth signup error:', authError);
      return res.status(400).json({ message: authError.message });
    }
    
    console.log('Supabase Auth signup response:', JSON.stringify(authData, null, 2));
    
    if (!authData || !authData.user || !authData.user.id) {
      console.error('No user data returned from Supabase Auth');
      return res.status(500).json({ message: 'Failed to create user account' });
    }
    
    // User metadata is already stored in the Supabase Auth user
    // We don't need to create a separate user_profiles entry
    console.log('User created in Supabase Auth with metadata:', authData.user.id);
    
    // Check if session exists (if not, email confirmation is required)
    if (authData.session) {
      // Set auth token in cookie
      res.cookie('authToken', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Return success with user data
      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: authData.user.id,
          email,
          firstName,
          lastName
        }
      });
    } else {
      // Email confirmation required
      res.status(201).json({
        message: 'Account created! Please check your email to confirm your account, then return here to log in.',
        requiresEmailConfirmation: true
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
});

// Session validation endpoint
router.get('/api/auth/session', async (req, res) => {
  try {
    const token = req.cookies.authToken;
    
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.clearCookie('authToken');
      return res.status(401).json({ authenticated: false });
    }
    
    // Get user metadata from Supabase Auth
    const userData = user.user_metadata || {};
    
    // Return user data
    res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: userData.first_name || '',
        lastName: userData.last_name || ''
      }
    });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ message: 'An error occurred during session validation' });
  }
});

// Logout endpoint
router.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.cookies.authToken;
    
    if (token) {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear the cookie
      res.clearCookie('authToken');
    }
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'An error occurred during logout' });
  }
});

// Export the router and middleware
module.exports = {
  router,
  requireAuth
};
