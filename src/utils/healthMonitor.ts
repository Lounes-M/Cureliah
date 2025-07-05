import { supabase } from '@/integrations/supabase/client.browser';
import config from '@/config';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: string;
  version: string;
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private checkInterval: NodeJS.Timeout | null = null;
  private healthHistory: SystemHealth[] = [];
  private maxHistorySize = 100;

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  async checkSupabaseHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - start;

      if (error) {
        return {
          service: 'Supabase Database',
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: error.message
        };
      }

      return {
        service: 'Supabase Database',
        status: responseTime > 5000 ? 'degraded' : 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { recordCount: data?.length || 0 }
      };
    } catch (error: any) {
      return {
        service: 'Supabase Database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async checkAuthHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const responseTime = Date.now() - start;

      return {
        service: 'Supabase Auth',
        status: responseTime > 3000 ? 'degraded' : 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { hasSession: !!session }
      };
    } catch (error: any) {
      return {
        service: 'Supabase Auth',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async checkStorageHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { data, error } = await supabase.storage
        .from('public')
        .list('', { limit: 1 });

      const responseTime = Date.now() - start;

      if (error) {
        return {
          service: 'Supabase Storage',
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: error.message
        };
      }

      return {
        service: 'Supabase Storage',
        status: responseTime > 5000 ? 'degraded' : 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { accessible: true }
      };
    } catch (error: any) {
      return {
        service: 'Supabase Storage',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async checkAPIHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${config.app.apiUrl}/health`);
      const responseTime = Date.now() - start;

      if (!response.ok) {
        return {
          service: 'API Server',
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        service: 'API Server',
        status: responseTime > 2000 ? 'degraded' : 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { status: response.status }
      };
    } catch (error: any) {
      return {
        service: 'API Server',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async checkExternalServicesHealth(): Promise<HealthCheckResult[]> {
    const services: HealthCheckResult[] = [];

    // Check Stripe if enabled
    if (config.features.enablePayments && config.stripe.publishableKey) {
      const start = Date.now();
      try {
        const response = await fetch('https://api.stripe.com/v1', {
          headers: {
            'Authorization': `Bearer ${config.stripe.publishableKey}`,
          }
        });
        
        services.push({
          service: 'Stripe API',
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
          lastChecked: new Date().toISOString(),
          details: { status: response.status }
        });
      } catch (error: any) {
        services.push({
          service: 'Stripe API',
          status: 'unhealthy',
          responseTime: Date.now() - start,
          lastChecked: new Date().toISOString(),
          error: error.message
        });
      }
    }

    // Check Google Services if enabled
    if (config.integrations.googleMapsApiKey) {
      const start = Date.now();
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/js?key=${config.integrations.googleMapsApiKey}`);
        
        services.push({
          service: 'Google Maps API',
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - start,
          lastChecked: new Date().toISOString(),
          details: { status: response.status }
        });
      } catch (error: any) {
        services.push({
          service: 'Google Maps API',
          status: 'unhealthy',
          responseTime: Date.now() - start,
          lastChecked: new Date().toISOString(),
          error: error.message
        });
      }
    }

    return services;
  }

  async performFullHealthCheck(): Promise<SystemHealth> {
    const services: HealthCheckResult[] = [];

    // Core services
    const [
      supabaseHealth,
      authHealth,
      storageHealth,
      apiHealth
    ] = await Promise.all([
      this.checkSupabaseHealth(),
      this.checkAuthHealth(),
      this.checkStorageHealth(),
      this.checkAPIHealth()
    ]);

    services.push(supabaseHealth, authHealth, storageHealth, apiHealth);

    // External services
    const externalServices = await this.checkExternalServicesHealth();
    services.push(...externalServices);

    // Determine overall health
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    const health: SystemHealth = {
      overall,
      services,
      timestamp: new Date().toISOString(),
      version: config.app.version
    };

    // Store in history
    this.healthHistory.push(health);
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }

    return health;
  }

  startMonitoring(intervalMs: number = 60000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const health = await this.performFullHealthCheck();
        
        // Log critical issues
        if (health.overall === 'unhealthy') {
          console.error('🚨 System health critical:', health);
        } else if (health.overall === 'degraded') {
          console.warn('⚠️ System health degraded:', health);
        }

        // Emit health check event
        window.dispatchEvent(new CustomEvent('healthCheck', { detail: health }));
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, intervalMs);

    console.log('🔍 Health monitoring started');
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔍 Health monitoring stopped');
    }
  }

  getHealthHistory(): SystemHealth[] {
    return [...this.healthHistory];
  }

  getLatestHealth(): SystemHealth | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  getUptimePercentage(hours: number = 24): number {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantChecks = this.healthHistory.filter(
      h => new Date(h.timestamp) >= since
    );

    if (relevantChecks.length === 0) return 100;

    const healthyChecks = relevantChecks.filter(h => h.overall === 'healthy').length;
    return (healthyChecks / relevantChecks.length) * 100;
  }

  getAverageResponseTime(service: string, hours: number = 24): number {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantChecks = this.healthHistory.filter(
      h => new Date(h.timestamp) >= since
    );

    const serviceTimes = relevantChecks
      .map(h => h.services.find(s => s.service === service))
      .filter(s => s !== undefined)
      .map(s => s!.responseTime);

    if (serviceTimes.length === 0) return 0;

    return serviceTimes.reduce((sum, time) => sum + time, 0) / serviceTimes.length;
  }

  async generateHealthReport(): Promise<{
    summary: {
      status: string;
      uptime: number;
      lastCheck: string;
      criticalIssues: number;
    };
    services: Array<{
      name: string;
      status: string;
      avgResponseTime: number;
      uptime: number;
    }>;
    recommendations: string[];
  }> {
    const latestHealth = await this.performFullHealthCheck();
    const uptime = this.getUptimePercentage();
    
    const services = latestHealth.services.map(service => ({
      name: service.service,
      status: service.status,
      avgResponseTime: this.getAverageResponseTime(service.service),
      uptime: this.getUptimePercentage()
    }));

    const recommendations: string[] = [];
    
    // Generate recommendations based on health status
    const unhealthyServices = latestHealth.services.filter(s => s.status === 'unhealthy');
    const slowServices = latestHealth.services.filter(s => s.responseTime > 5000);
    
    if (unhealthyServices.length > 0) {
      recommendations.push(`${unhealthyServices.length} service(s) are down and need immediate attention`);
    }
    
    if (slowServices.length > 0) {
      recommendations.push(`${slowServices.length} service(s) are responding slowly and may need optimization`);
    }
    
    if (uptime < 99) {
      recommendations.push('System uptime is below 99% - consider infrastructure improvements');
    }

    return {
      summary: {
        status: latestHealth.overall,
        uptime,
        lastCheck: latestHealth.timestamp,
        criticalIssues: unhealthyServices.length
      },
      services,
      recommendations
    };
  }
}

// Utility functions
export const getHealthMonitor = () => HealthMonitor.getInstance();

export const useHealthMonitor = () => {
  const monitor = HealthMonitor.getInstance();
  
  return {
    performHealthCheck: () => monitor.performFullHealthCheck(),
    startMonitoring: (interval?: number) => monitor.startMonitoring(interval),
    stopMonitoring: () => monitor.stopMonitoring(),
    getLatestHealth: () => monitor.getLatestHealth(),
    getHealthHistory: () => monitor.getHealthHistory(),
    getUptimePercentage: (hours?: number) => monitor.getUptimePercentage(hours),
    generateReport: () => monitor.generateHealthReport(),
  };
};

export default HealthMonitor;
