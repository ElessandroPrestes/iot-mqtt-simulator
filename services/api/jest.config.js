module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 85, statements: 90 },
  },
  testMatch: ['**/tests/**/*.test.js'],
};
