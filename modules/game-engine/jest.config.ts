import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@khalistra/shared/(.*)$': '<rootDir>/../../shared/$1'
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage'
};

export default config;
