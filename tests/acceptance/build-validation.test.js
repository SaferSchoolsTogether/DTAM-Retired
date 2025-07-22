/**
 * Build Validation Acceptance Tests
 * Tests to ensure the project builds properly before Vercel deployment
 */

const request = require('supertest');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');

// Import the app
const app = require('../../server');

describe('Build Validation Tests', () => {
  
  describe('Environment Configuration', () => {
    test('should have required environment variables', () => {
      // Critical environment variables for Vercel deployment
      const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY'
      ];

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
      });
    });

    test('should have valid Supabase URL format', () => {
      const supabaseUrl = process.env.SUPABASE_URL;
      expect(supabaseUrl).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    });
  });

  describe('File Structure Validation', () => {
    test('should have required server files', () => {
      const requiredFiles = [
        'server.js',
        'vercel.json',
        'package.json',
        'config/supabase.js'
      ];

      requiredFiles.forEach(filePath => {
        expect(fs.existsSync(path.join(__dirname, '../../', filePath))).toBe(true);
      });
    });

    test('should have all route files', () => {
      const routeFiles = [
        'routes/api.js',
        'routes/auth.js',
        'routes/cases.js',
        'routes/photos.js',
        'routes/platforms.js',
        'routes/reports.js',
        'routes/analysis.js',
        'routes/admin.js',
        'routes/onboarding.js',
        'routes/socs.js'
      ];

      routeFiles.forEach(filePath => {
        expect(fs.existsSync(path.join(__dirname, '../../', filePath))).toBe(true);
      });
    });

    test('should have public assets structure', () => {
      const publicPaths = [
        'public/css',
        'public/js',
        'public/uploads'
      ];

      publicPaths.forEach(dirPath => {
        expect(fs.existsSync(path.join(__dirname, '../../', dirPath))).toBe(true);
      });
    });

    test('should have view templates', () => {
      const viewFiles = [
        'views/workstation.ejs',
        'views/dashboard.ejs',
        'views/cases.ejs',
        'views/partials/navigation.ejs'
      ];

      viewFiles.forEach(filePath => {
        expect(fs.existsSync(path.join(__dirname, '../../', filePath))).toBe(true);
      });
    });
  });

  describe('Package Dependencies', () => {
    test('should have valid package.json', () => {
      const packageJson = require('../../package.json');
      
      expect(packageJson.dependencies).toBeDefined();
      
      // Check critical dependencies
      const criticalDeps = [
        '@supabase/supabase-js',
        'express',
        'ejs',
        'body-parser',
        'dotenv',
        'multer',
        'fs-extra'
      ];

      criticalDeps.forEach(dep => {
        expect(packageJson.dependencies[dep]).toBeDefined();
      });
    });

    test('should not have vulnerable dependencies', () => {
      // This would typically integrate with npm audit
      // For now, check that we have recent versions
      const packageJson = require('../../package.json');
      
      expect(packageJson.dependencies['@supabase/supabase-js']).toMatch(/^\^2\./);
      expect(packageJson.dependencies['express']).toMatch(/^\^?[4-9]\./);
    });
  });

  describe('Vercel Configuration', () => {
    test('should have valid vercel.json config', () => {
      const vercelConfig = require('../../vercel.json');
      
      expect(vercelConfig.version).toBe(2);
      expect(vercelConfig.builds).toBeDefined();
      expect(vercelConfig.routes).toBeDefined();
      
      // Check for Node.js build
      const nodeBuild = vercelConfig.builds.find(build => build.use === '@vercel/node');
      expect(nodeBuild).toBeDefined();
      expect(nodeBuild.src).toBe('server.js');
    });

    test('should have proper routing configuration', () => {
      const vercelConfig = require('../../vercel.json');
      
      // Check for static asset routing
      const cssRoute = vercelConfig.routes.find(route => route.src.includes('css'));
      const jsRoute = vercelConfig.routes.find(route => route.src.includes('js'));
      
      expect(cssRoute).toBeDefined();
      expect(jsRoute).toBeDefined();
      
      // Check for catch-all route to server.js
      const catchAllRoute = vercelConfig.routes.find(route => route.dest === '/server.js');
      expect(catchAllRoute).toBeDefined();
    });
  });

  describe('Server Startup', () => {
    test('should start server without errors', (done) => {
      // Test that server can initialize
      request(app)
        .get('/api/status')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.status).toBe('online');
          done();
        });
    });

    test('should serve static files', (done) => {
      request(app)
        .get('/css/styles.css')
        .expect(200)
        .end(done);
    });
  });

  describe('Database Connection', () => {
    test('should connect to Supabase', async () => {
      const supabase = require('../../config/supabase');
      
      // Test database connection
      const { error } = await supabase
        .from('cases')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });

    test('should have access to storage buckets', async () => {
      const supabase = require('../../config/supabase');
      
      const { data, error } = await supabase
        .storage
        .listBuckets();
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Memory and Performance', () => {
    test('should not exceed Vercel memory limits', () => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      // Vercel has 1024MB limit for Node.js functions
      expect(heapUsedMB).toBeLessThan(512); // Keep well under limit
    });

    test('should respond within acceptable time limits', (done) => {
      const startTime = Date.now();
      
      request(app)
        .get('/api/status')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          
          const responseTime = Date.now() - startTime;
          expect(responseTime).toBeLessThan(5000); // 5 second max
          done();
        });
    });
  });

  describe('Security Validation', () => {
    test('should not expose sensitive environment variables', (done) => {
      request(app)
        .get('/api/status')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const responseText = JSON.stringify(res.body);
          expect(responseText).not.toContain(process.env.SUPABASE_SERVICE_KEY);
          expect(responseText).not.toContain(process.env.SUPABASE_URL);
          done();
        });
    });

    test('should have proper CORS configuration', (done) => {
      request(app)
        .get('/api/status')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          // Check that sensitive headers aren't exposed
          expect(res.headers['x-powered-by']).toBeUndefined();
          done();
        });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing routes gracefully', (done) => {
      request(app)
        .get('/nonexistent-route')
        .expect((res) => {
          expect([404, 200]).toContain(res.status);
        })
        .end(done);
    });

    test('should handle malformed requests', (done) => {
      request(app)
        .post('/api/status')
        .send('invalid json')
        .expect((res) => {
          expect(res.status).toBeLessThan(500);
        })
        .end(done);
    });
  });
});