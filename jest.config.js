/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages/tests/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@fll/db$': '<rootDir>/packages/db/src',
    '^@fll/core$': '<rootDir>/packages/core/src',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/packages/tests/src/setup.ts'],
  maxWorkers: 1, // Para evitar conflictos en BD de test
};
