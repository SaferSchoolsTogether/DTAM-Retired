/**
 * Jest Configuration for DTAM Build Validation Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'server.js',
    'config/**/*.js',
    'routes/**/*.js',
    '!node_modules/**',
    '!tests/**'
  ],
  
  // Module paths
  modulePaths: ['<rootDir>'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/',
    '/views/'
  ],
  
  // Verbose output
  verbose: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './tests/reports',
      outputName: 'test-results.xml'
    }]
  ]
};