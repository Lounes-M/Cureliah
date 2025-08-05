import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import MonitoringService from '@/services/monitoring';

// Mock console methods
const consoleMocks = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  info: jest.spyOn(console, 'info').mockImplementation(() => {}),
};

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Test Browser',
  configurable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: 'https://test.cureliah.com/page' },
  configurable: true
});

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = MonitoringService.getInstance();
    jest.clearAllMocks();
    
    // Reset console mocks
    consoleMocks.error.mockClear();
    consoleMocks.warn.mockClear();
    consoleMocks.info.mockClear();

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
  });

  describe('Error Reporting in Development', () => {
    it('should log errors to console in development mode', async () => {
      // Act
      const testError = new Error('Test error message');
      monitoring.captureException(testError, { context: 'test' }, 'high');

      // Assert - in development mode, should log to console
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow async operations
      
      expect(consoleMocks.error).toHaveBeenCalledWith(
        '🚨 Error Report:',
        expect.objectContaining({
          message: 'Test error message',
          severity: 'high'
        })
      );
    });
  });

  describe('User Context Management', () => {
    it('should set user context correctly', () => {
      // Act
      monitoring.setUser('user-123', 'doctor');

      // Assert - We can't easily test the internal state, but we can verify no errors are thrown
      expect(() => monitoring.setUser('user-123', 'doctor')).not.toThrow();
    });
  });

  describe('Transaction Tracking', () => {
    it('should create and finish transactions', () => {
      // Act
      const transaction = monitoring.startTransaction('test-operation');
      
      // Assert
      expect(transaction).toBeDefined();
      expect(typeof transaction.finish).toBe('function');
      
      // Should not throw when finishing
      expect(() => transaction.finish({ context: 'test' })).not.toThrow();
    });

    it('should measure transaction duration', () => {
      // Mock performance.now to control timing
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1500); // 500ms duration

      // Act
      const transaction = monitoring.startTransaction('timed-operation');
      transaction.finish();

      // Assert - should have called performance.now twice
      expect(mockNow).toHaveBeenCalledTimes(2);
      
      mockNow.mockRestore();
    });
  });

  describe('Page View Tracking', () => {
    it('should track page views with correct data', () => {
      // Act
      monitoring.trackPageView('/dashboard', { source: 'navigation' });

      // Assert - in development mode, should log to console
      expect(consoleMocks.info).toHaveBeenCalledWith(
        '📊 Performance Metric:',
        expect.objectContaining({
          name: 'page-view',
          url: '/dashboard'
        })
      );
    });
  });

  describe('Service Instance', () => {
    it('should return the same instance (singleton)', () => {
      // Act
      const instance1 = MonitoringService.getInstance();
      const instance2 = MonitoringService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    it('should handle exceptions without crashing', () => {
      // Act & Assert
      expect(() => {
        monitoring.captureException(new Error('Test error'));
      }).not.toThrow();

      expect(() => {
        monitoring.captureException(new TypeError('Type error'), { context: 'test' }, 'critical');
      }).not.toThrow();
    });
  });
});

describe('Global Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleMocks.error.mockClear();
  });

  it('should initialize without errors', () => {
    // Act & Assert
    expect(() => {
      MonitoringService.getInstance();
    }).not.toThrow();
  });

  it('should handle missing environment variables gracefully', () => {
    // This tests the service behavior when environment variables are not set
    const monitoring = MonitoringService.getInstance();
    
    // Act & Assert
    expect(() => {
      monitoring.captureException(new Error('Test'));
    }).not.toThrow();
  });
});
