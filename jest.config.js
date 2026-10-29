'use strict';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  clearMocks: true,
  verbose: true,
  testTimeout: 20000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/database/schema.js',
  ],
  coverageDirectory: 'coverage',
};
