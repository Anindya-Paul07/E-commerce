export default {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/test/setup-env.js'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'controller/**/*.js',
    'lib/**/*.js',
    'middlewares/**/*.js',
    'model/**/*.js',
    'router/**/*.js',
    '!**/__tests__/**',
  ],
};
