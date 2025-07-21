/**
 * Build Checker Utility
 * Utility functions for validating build requirements
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class BuildChecker {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Check if all required files exist
   */
  checkRequiredFiles() {
    const requiredFiles = [
      'server.js',
      'package.json',
      'vercel.json',
      'config/supabase.js'
    ];

    const missingFiles = [];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    return {
      valid: missingFiles.length === 0,
      missingFiles,
      message: missingFiles.length > 0 
        ? `Missing required files: ${missingFiles.join(', ')}` 
        : 'All required files present'
    };
  }

  /**
   * Validate package.json dependencies
   */
  validateDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        valid: false,
        message: 'package.json not found'
      };
    }

    const packageJson = require(packageJsonPath);
    const requiredDeps = [
      '@supabase/supabase-js',
      'express',
      'ejs',
      'body-parser',
      'dotenv'
    ];

    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

    return {
      valid: missingDeps.length === 0,
      missingDependencies: missingDeps,
      message: missingDeps.length > 0 
        ? `Missing dependencies: ${missingDeps.join(', ')}` 
        : 'All required dependencies present'
    };
  }

  /**
   * Validate Vercel configuration
   */
  validateVercelConfig() {
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    
    if (!fs.existsSync(vercelConfigPath)) {
      return {
        valid: false,
        message: 'vercel.json not found'
      };
    }

    try {
      const vercelConfig = require(vercelConfigPath);
      const issues = [];

      // Check version
      if (vercelConfig.version !== 2) {
        issues.push('vercel.json should use version 2');
      }

      // Check for builds
      if (!vercelConfig.builds || vercelConfig.builds.length === 0) {
        issues.push('vercel.json missing builds configuration');
      }

      // Check for Node.js build
      const hasNodeBuild = vercelConfig.builds?.some(build => build.use === '@vercel/node');
      if (!hasNodeBuild) {
        issues.push('vercel.json missing Node.js build configuration');
      }

      // Check for routes
      if (!vercelConfig.routes || vercelConfig.routes.length === 0) {
        issues.push('vercel.json missing routes configuration');
      }

      return {
        valid: issues.length === 0,
        issues,
        message: issues.length > 0 
          ? `Vercel config issues: ${issues.join(', ')}` 
          : 'Vercel configuration valid'
      };
    } catch (error) {
      return {
        valid: false,
        message: `Invalid vercel.json: ${error.message}`
      };
    }
  }

  /**
   * Check environment variables
   */
  checkEnvironmentVariables() {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    return {
      valid: missingVars.length === 0,
      missingVariables: missingVars,
      message: missingVars.length > 0 
        ? `Missing environment variables: ${missingVars.join(', ')}` 
        : 'All required environment variables present'
    };
  }

  /**
   * Test syntax of main JavaScript files
   */
  checkSyntax() {
    const filesToCheck = [
      'server.js',
      'config/supabase.js'
    ];

    const syntaxErrors = [];

    for (const file of filesToCheck) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        continue;
      }

      try {
        // Use Node.js to check syntax
        execSync(`node -c "${filePath}"`, { stdio: 'ignore' });
      } catch (error) {
        syntaxErrors.push({
          file,
          error: error.message
        });
      }
    }

    return {
      valid: syntaxErrors.length === 0,
      syntaxErrors,
      message: syntaxErrors.length > 0 
        ? `Syntax errors in: ${syntaxErrors.map(e => e.file).join(', ')}` 
        : 'No syntax errors found'
    };
  }

  /**
   * Run all build checks
   */
  runAllChecks() {
    const checks = [
      { name: 'Required Files', check: () => this.checkRequiredFiles() },
      { name: 'Dependencies', check: () => this.validateDependencies() },
      { name: 'Vercel Config', check: () => this.validateVercelConfig() },
      { name: 'Environment Variables', check: () => this.checkEnvironmentVariables() },
      { name: 'Syntax Check', check: () => this.checkSyntax() }
    ];

    const results = [];
    let allValid = true;

    for (const { name, check } of checks) {
      try {
        const result = check();
        results.push({
          name,
          ...result
        });

        if (!result.valid) {
          allValid = false;
        }
      } catch (error) {
        results.push({
          name,
          valid: false,
          message: `Check failed: ${error.message}`
        });
        allValid = false;
      }
    }

    return {
      valid: allValid,
      results,
      summary: allValid 
        ? 'All build validation checks passed' 
        : 'Some build validation checks failed'
    };
  }
}

module.exports = BuildChecker;