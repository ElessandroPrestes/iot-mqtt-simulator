/** @type {import('jest').Config} */
export default {
  transform: {},
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 85, statements: 90 },
  },
  testMatch: ['**/tests/**/*.test.js'],
};
