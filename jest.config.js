export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'server/**/*.ts',
    '!server/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironmentOptions: {
    env: {
      DATABASE_URL: 'postgresql://postgres:Stayeasy%40123@db.rrcorcikdfxpdwvinotl.supabase.co:5432/postgres',
    },
  },
}
