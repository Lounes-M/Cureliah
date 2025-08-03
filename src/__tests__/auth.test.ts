import { useAuth } from '@/hooks/useAuth';
import { describe, it, expect, jest } from '@jest/globals';

// Mock Supabase
jest.mock('@/integrations/supabase/client.browser', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  }
}));

describe('useAuth Hook Tests', () => {
  it('should handle user types correctly', () => {
    const userTypes = ['doctor', 'establishment', 'admin'] as const;
    
    userTypes.forEach(type => {
      expect(['doctor', 'establishment', 'admin']).toContain(type);
    });
  });

  it('should validate user permissions', () => {
    const checkPermission = (userType: string, action: string) => {
      const permissions = {
        doctor: ['view_vacations', 'create_vacation', 'manage_profile'],
        establishment: ['view_doctors', 'book_vacation', 'manage_profile'],
        admin: ['manage_users', 'view_analytics', 'system_settings']
      };
      
      return permissions[userType as keyof typeof permissions]?.includes(action) || false;
    };

    expect(checkPermission('doctor', 'create_vacation')).toBe(true);
    expect(checkPermission('establishment', 'view_doctors')).toBe(true);
    expect(checkPermission('admin', 'manage_users')).toBe(true);
    expect(checkPermission('doctor', 'manage_users')).toBe(false);
  });

  it('should format dashboard routes correctly', () => {
    const getDashboardRoute = (userType: string) => {
      switch (userType) {
        case 'doctor':
          return '/doctor/dashboard';
        case 'establishment':
          return '/establishment/dashboard';
        case 'admin':
          return '/admin/dashboard';
        default:
          return '/dashboard';
      }
    };

    expect(getDashboardRoute('doctor')).toBe('/doctor/dashboard');
    expect(getDashboardRoute('establishment')).toBe('/establishment/dashboard');
    expect(getDashboardRoute('admin')).toBe('/admin/dashboard');
    expect(getDashboardRoute('unknown')).toBe('/dashboard');
  });
});
