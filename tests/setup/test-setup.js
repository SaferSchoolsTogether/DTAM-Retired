/**
 * Test Setup Configuration
 * Configures the test environment for acceptance tests
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global test helpers
global.testHelpers = {
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to check if running in CI
  isCI: () => process.env.CI === 'true',
  
  // Helper to get test database URL (if different from production)
  getTestSupabaseUrl: () => process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL,
  
  // Helper to validate environment
  validateTestEnvironment: () => {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Validate environment before tests run
beforeAll(() => {
  global.testHelpers.validateTestEnvironment();
});

// Clean up after tests
afterAll(() => {
  // Clean up any test artifacts if needed
});