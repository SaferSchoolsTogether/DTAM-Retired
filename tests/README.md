# DTAM Testing Suite

This directory contains acceptance tests to validate the project builds properly before Vercel deployment.

## Test Structure

```
tests/
├── acceptance/
│   └── build-validation.test.js    # Main build validation tests
├── setup/
│   └── test-setup.js               # Test environment configuration
├── utils/
│   └── build-checker.js            # Build validation utilities
└── README.md                       # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Build Validation Only
```bash
npm run test:build
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Test Categories

### 1. Environment Configuration
- Validates required environment variables
- Checks Supabase URL format
- Ensures all configuration is present

### 2. File Structure Validation
- Verifies all required files exist
- Checks route files are present
- Validates public assets structure
- Ensures view templates are available

### 3. Package Dependencies
- Validates package.json structure
- Checks all required dependencies
- Tests for known vulnerabilities

### 4. Vercel Configuration
- Validates vercel.json format
- Checks build configuration
- Verifies routing setup

### 5. Server Startup
- Tests server initialization
- Validates API endpoints
- Checks static file serving

### 6. Database Connection
- Tests Supabase connectivity
- Validates database access
- Checks storage bucket access

### 7. Memory and Performance
- Monitors memory usage
- Tests response times
- Validates Vercel limits

### 8. Security Validation
- Checks for exposed secrets
- Validates CORS configuration
- Tests security headers

### 9. Error Handling
- Tests missing routes
- Validates malformed requests
- Checks graceful error responses

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
```

3. Install test dependencies:
```bash
npm install
```

## Continuous Integration

The tests are configured to run automatically before deployment:

- `prestart` script runs build validation before starting the server
- `prebuild` script runs validation before any build process
- Tests can be integrated into GitHub Actions or other CI systems

## Troubleshooting

### Missing Environment Variables
Ensure your `.env` file contains all required variables from `.env.example`.

### Supabase Connection Issues
- Verify your Supabase URL is correct
- Check that the service key has proper permissions
- Ensure Supabase project is accessible

### Test Failures
- Run individual test suites to isolate issues
- Check the test output for specific error messages
- Verify all required files are present in the project

### Memory Issues
- Monitor test output for memory warnings
- Ensure tests clean up properly after execution
- Check for memory leaks in application code

## Configuration Files

- `jest.config.js` - Jest test runner configuration
- `tests/setup/test-setup.js` - Global test setup and helpers
- `.env.example` - Template for environment variables