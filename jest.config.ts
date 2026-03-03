import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, diagnostics: { ignoreCodes: [151002] } }],
    '^.+\\.js$': ['ts-jest', { useESM: true, diagnostics: { ignoreCodes: [151002] } }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.e2e.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!@prmichaelsen/remember-core)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@prmichaelsen/remember-core/database/weaviate$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/database/weaviate/index.js',
    '^@prmichaelsen/remember-core/database/firestore$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/database/firestore/index.js',
    '^@prmichaelsen/remember-core/services$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/services/index.js',
    '^@prmichaelsen/remember-core/utils$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/utils/index.js',
    '^@prmichaelsen/remember-core/errors$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/errors/index.js',
    '^@prmichaelsen/remember-core/config$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/config/index.js',
    '^@prmichaelsen/remember-core/types$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/types/index.js',
    '^@prmichaelsen/remember-core/collections$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/collections/index.js',
    '^@prmichaelsen/remember-core/search$':
      '<rootDir>/../node_modules/@prmichaelsen/remember-core/dist/search/index.js',
  },
};

export default config;
