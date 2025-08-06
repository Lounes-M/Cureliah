module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Exclude Playwright test files and directories
  testPathIgnorePatterns: [
    '<rootDir>/e2e/',
    '<rootDir>/playwright-tests/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/cypress/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    '<rootDir>/node_modules/',
    'src/__tests__/BookingFlow.test.tsx',
    'src/services/__tests__/monitoring.test.ts',
    'src/__tests__/Auth.test.tsx',
    'tests/integration/HowItWorksSection.integration.test.tsx',
    'src/components/__tests__/ProtectedRouteSubscription.test.tsx'
  ],
  // Only include Jest test files
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/__tests__/**/*.(js|jsx|ts|tsx)',
    '!<rootDir>/e2e/**/*',
    '!<rootDir>/cypress/**/*'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json',
    },
    'import.meta': {
      env: {
        VITE_MONITORING_API: '/api/monitoring',
        DEV: false
      }
    }
  },
  moduleNameMapper: {
    '^@/integrations/supabase/client$': '<rootDir>/src/integrations/supabase/client.node.ts',
    '^@/integrations/supabase/client.browser$': '<rootDir>/src/integrations/supabase/client.node.ts',
    '^src/integrations/supabase/client$': '<rootDir>/src/integrations/supabase/client.node.ts',
    '^@/styles/.*\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map any CSS import, including aliased paths
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^/logo.png$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(preact|@fullcalendar)/)'
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
