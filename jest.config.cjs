module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
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
