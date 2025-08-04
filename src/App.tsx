import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ABTestProvider } from "@/utils/businessIntelligence";
import AppRoutes from "@/routes";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import { monitoring } from "@/utils/monitoring";
import { SecurityService } from "@/utils/security";
import PWAInstallPrompt, { registerServiceWorker } from "@/components/PWAInstallPrompt";
import { useRealtime } from "@/utils/realtime";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Initialize monitoring and security for production
monitoring.initialize();
const securityService = SecurityService.getInstance();

// Enhanced App Content with advanced features
const EnhancedAppContent = () => {
  const { user } = useAuth();
  const [userSegment, setUserSegment] = useState<any>(null);
  
  // Initialize realtime connection
  const { connectionState } = useRealtime(user?.id);

  useEffect(() => {
    // Initialize advanced monitoring
    monitoring.trackWebVitals();
    monitoring.monitorResourceLoading();
    monitoring.monitorMemoryUsage();
    monitoring.monitorNetworkConditions();
    monitoring.monitorLongTasks();
    monitoring.monitorBundleSize();

    // Set user segment for A/B testing
    if (user) {
      setUserSegment({
        userType: user.user_metadata?.user_type || 'establishment',
        newUser: new Date((user as any).created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
      });

      // Track user login for security
      securityService.recordSuccessfulLogin('127.0.0.1', user.id);

      // Enhanced user activity tracking
      monitoring.trackUserActivity({
        page: 'app_load',
        action: 'user_authenticated',
        timestamp: Date.now(),
        userId: user.id,
        metadata: {
          userType: user.user_metadata?.user_type,
          connectionState,
          sessionId: crypto.randomUUID()
        }
      });
    }

    // Performance marks
    monitoring.mark('app_content_initialized');
    
    return () => {
      monitoring.measure('app_content_initialization_time', 'app_start', 'app_content_initialized');
    };
  }, [user, connectionState]);

  return (
    <ABTestProvider userId={user?.id || ''} userSegment={userSegment}>
      <AppRoutes />
      <Toaster />
      <PWAInstallPrompt 
        onInstall={() => {
          console.log('PWA installed successfully');
          monitoring.trackEvent('pwa_installed', { userId: user?.id });
        }}
        onDismiss={() => {
          console.log('PWA install dismissed');
          monitoring.trackEvent('pwa_install_dismissed', { userId: user?.id });
        }}
      />
    </ABTestProvider>
  );
};

function App() {
  useEffect(() => {
    // Performance mark for app start
    monitoring.mark('app_start');
    
    // Register service worker for PWA functionality
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('PWA Service Worker registered successfully');
        monitoring.trackEvent('pwa_service_worker_registered');
        
        // Subscribe to push notifications if supported
        if ('PushManager' in window) {
          console.log('Push notifications supported');
          monitoring.trackEvent('push_notifications_supported');
        }
      }
    }).catch((error) => {
      console.error('Service Worker registration failed:', error);
      monitoring.logError(new Error('Service Worker registration failed'), {
        error: error.message
      });
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