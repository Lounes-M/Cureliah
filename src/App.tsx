import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ABTestProvider } from "@/utils/businessIntelligence";
import AppRoutes from "@/routes";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import MonitoringService, { useMonitoring } from "@/services/monitoring";
import { SecurityService } from "@/utils/security";
import PWAInstallPrompt, { registerServiceWorker } from "@/components/PWAInstallPrompt";
import { useRealtime } from "@/utils/realtime";
import { PromoBanner } from "@/components/PromoBanner";
import { usePromoBanner } from "@/hooks/usePromoBanner";
import { performanceMonitor } from "@/utils/performanceMonitor";
import VideoIntroPopup from "@/components/VideoIntroPopup";
import { useEffect, useState } from "react";
import { logger } from '@/services/logger';

const queryClient = new QueryClient();

// Interface pour le segment utilisateur
interface UserSegment {
  userType: 'doctor' | 'establishment' | 'admin';
  newUser: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

// Interface pour les utilisateurs avec created_at
interface UserWithTimestamp {
  id: string;
  created_at?: string;
  user_metadata?: {
    user_type?: 'doctor' | 'establishment' | 'admin';
  };
  [key: string]: unknown;
}

// Initialize monitoring and security for production
const monitoring = MonitoringService.getInstance();
const securityService = SecurityService.getInstance();

// Enhanced App Content with advanced features
const EnhancedAppContent = () => {
  const { user, subscriptionStatus } = useAuth();
  const [userSegment, setUserSegment] = useState<UserSegment | null>(null);
  const { setUser } = useMonitoring();
  const { isVisible: showPromoBanner, dismiss: dismissPromoBanner } = usePromoBanner({
    showForNewUsers: true,
    autoHideDays: 3,
    user: user,
    subscriptionStatus // Pass the subscription status
  });
  
  // Initialize realtime connection
  const { connectionState } = useRealtime(user?.id);

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.markPerformance('app-init');
    logger.info('Application initialized with monitoring', { 
      timestamp: Date.now() 
    }, 'App', 'app_init');

    // Set user for new monitoring service
    if (user) {
      setUser(user.id, user.user_metadata?.user_type || 'establishment');
    }

    // Set user segment for A/B testing
    if (user) {
      const userWithTimestamp = user as unknown as UserWithTimestamp;
      setUserSegment({
        userType: (user.user_metadata?.user_type || 'establishment') as 'doctor' | 'establishment' | 'admin',
        newUser: new Date(userWithTimestamp.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
      });

      // Track user login for security
      securityService.recordSuccessfulLogin('127.0.0.1', user.id);

      // Placeholder for future monitoring of user activity
    }

    // Performance marks
    return () => {};
  }, [user, connectionState]);

  return (
    <ABTestProvider userId={user?.id || ''} userSegment={userSegment?.userType || 'establishment'}>
      <VideoIntroPopup />
      {/* Promo Banner - Affiché en haut pour maximum de visibilité */}
      {showPromoBanner && (
        <PromoBanner 
          variant="top" 
          onClose={dismissPromoBanner}
          user={user}
        />
      )}
      <AppRoutes />
      <Toaster />
      <PWAInstallPrompt
        onInstall={() => {
          logger.info('PWA installed successfully', { userId: user?.id }, 'App', 'pwa_installed');
          monitoring.reportPerformance({ name: 'pwa_installed', value: Date.now(), timestamp: Date.now(), url: window.location.href, userId: user?.id });
        }}
        onDismiss={() => {
          logger.info('PWA install dismissed', { userId: user?.id }, 'App', 'pwa_install_dismissed');
          monitoring.reportPerformance({ name: 'pwa_install_dismissed', value: Date.now(), timestamp: Date.now(), url: window.location.href, userId: user?.id });
        }}
      />
    </ABTestProvider>
  );
};

function App() {
  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker().then((registration) => {
      if (registration) {
        logger.info('PWA Service Worker registered successfully', { registration }, 'App', 'sw_registered');

        // Subscribe to push notifications if supported
        if ('PushManager' in window) {
          logger.info('Push notifications supported', {}, 'App', 'push_supported');
        }
      }
    }).catch((error) => {
      logger.error('Service Worker registration failed', error, {}, 'App', 'sw_registration_failed');
      monitoring.captureException(new Error('Service Worker registration failed'));
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <ScrollToTop />
            <AuthProvider>
              <EnhancedAppContent />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;