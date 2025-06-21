module.exports = {
  testEnvironment: 'node',
  testTimeout: 20000,
  rootDir: './',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
