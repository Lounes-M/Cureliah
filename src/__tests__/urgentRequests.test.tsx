import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateUrgentRequestModal } from '@/components/establishment/CreateUrgentRequestModal';
import { UrgentRequestService } from '@/services/urgentRequestService';
import { UrgentNotificationService } from '@/services/urgentNotificationService';

// Mock des services
vi.mock('@/services/urgentRequestService');
vi.mock('@/services/urgentNotificationService');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock des composants UI
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children }: any) => <div data-testid="select-item">{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) => <input type="checkbox" {...props} />
}));

describe('Système de demandes urgentes', () => {
  describe('UrgentRequestService', () => {
    it('devrait avoir toutes les méthodes nécessaires', () => {
      expect(typeof UrgentRequestService.createUrgentRequest).toBe('function');
      expect(typeof UrgentRequestService.getUrgentRequestsForDoctors).toBe('function');
      expect(typeof UrgentRequestService.respondToUrgentRequest).toBe('function');
      expect(typeof UrgentRequestService.updateResponseStatus).toBe('function');
      expect(typeof UrgentRequestService.getEstablishmentRequests).toBe('function');
      expect(typeof UrgentRequestService.getDoctorResponses).toBe('function');
      expect(typeof UrgentRequestService.getUrgentRequestStats).toBe('function');
    });
  });

  describe('UrgentNotificationService', () => {
    it('devrait avoir toutes les méthodes de notification', () => {
      expect(typeof UrgentNotificationService.subscribeToNotifications).toBe('function');
      expect(typeof UrgentNotificationService.getUnreadNotifications).toBe('function');
      expect(typeof UrgentNotificationService.markNotificationAsRead).toBe('function');
      expect(typeof UrgentNotificationService.markAllNotificationsAsRead).toBe('function');
      expect(typeof UrgentNotificationService.getUnreadCount).toBe('function');
      expect(typeof UrgentNotificationService.getNotificationIcon).toBe('function');
      expect(typeof UrgentNotificationService.getNotificationColor).toBe('function');
    });

    it('devrait retourner les bonnes icônes selon le type', () => {
      expect(UrgentNotificationService.getNotificationIcon('new_request')).toBe('🚨');
      expect(UrgentNotificationService.getNotificationIcon('new_response')).toBe('📋');
      expect(UrgentNotificationService.getNotificationIcon('request_accepted')).toBe('✅');
      expect(UrgentNotificationService.getNotificationIcon('request_cancelled')).toBe('❌');
      expect(UrgentNotificationService.getNotificationIcon('reminder')).toBe('⏰');
    });
  });

  describe('CreateUrgentRequestModal', () => {
    it('devrait rendre le modal avec le bouton de déclenchement par défaut', () => {
      render(
        <CreateUrgentRequestModal 
          establishmentId="test-establishment-id" 
          onRequestCreated={() => {}}
        />
      );
      
      expect(screen.getByText('Demande Urgente')).toBeInTheDocument();
    });
  });
});

// Test d'intégration simple
describe('Intégration des composants', () => {
  it('devrait exporter tous les composants nécessaires', async () => {
    // Test des imports dynamiques
    const modules = await Promise.all([
      import('@/services/urgentRequestService'),
      import('@/services/urgentNotificationService'),
      import('@/hooks/useUrgentNotifications'),
      import('@/components/establishment/CreateUrgentRequestModal'),
      import('@/components/dashboard/PremiumDashboardUrgentRequests'),
      import('@/components/establishment/EstablishmentUrgentRequests'),
      import('@/components/notifications/UrgentNotificationDropdown')
    ]);

    expect(modules[0].UrgentRequestService).toBeDefined();
    expect(modules[1].UrgentNotificationService).toBeDefined();
    expect(modules[2].useUrgentNotifications).toBeDefined();
    expect(modules[3].CreateUrgentRequestModal).toBeDefined();
    expect(modules[4].default).toBeDefined(); // Default export
    expect(modules[5].default).toBeDefined(); // Default export
    expect(modules[6].UrgentNotificationDropdown).toBeDefined();
    expect(modules[6].NotificationBell).toBeDefined();
  });
});

export default {};
