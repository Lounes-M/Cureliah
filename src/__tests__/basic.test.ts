import { describe, it, expect } from '@jest/globals';

describe('Basic Application Tests', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });

  it('should validate password requirements', () => {
    const validatePassword = (password: string) => {
      return {
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password)
      };
    };

    const weakPassword = validatePassword('123');
    const strongPassword = validatePassword('Password123');

    expect(weakPassword.hasMinLength).toBe(false);
    expect(strongPassword.hasMinLength).toBe(true);
    expect(strongPassword.hasUpperCase).toBe(true);
    expect(strongPassword.hasLowerCase).toBe(true);
    expect(strongPassword.hasNumber).toBe(true);
  });

  it('should format currency correctly', () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    expect(formatCurrency(100)).toBe('100,00 €');
    expect(formatCurrency(1234.56)).toBe('1 234,56 €');
  });

  it('should validate phone numbers', () => {
    const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    
    expect(phoneRegex.test('0123456789')).toBe(true);
    expect(phoneRegex.test('+33123456789')).toBe(true);
    expect(phoneRegex.test('123')).toBe(false);
  });

  it('should handle dates correctly', () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    expect(tomorrow.getTime()).toBeGreaterThan(now.getTime());
  });
});
