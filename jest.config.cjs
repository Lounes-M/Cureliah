module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/integrations/supabase/client$': '<rootDir>/src/integrations/supabase/client.js',
    '^src/integrations/supabase/client$': '<rootDir>/src/integrations/supabase/client.js',
    '^/logo.png$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
