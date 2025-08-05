import { supabase } from '@/integrations/supabase/client.browser';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MonitoringCache {
  private static instance: MonitoringCache;
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MonitoringCache {
    if (!MonitoringCache.instance) {
      MonitoringCache.instance = new MonitoringCache();
    }
    return MonitoringCache.instance;
  }

  private constructor() {
    // Nettoyer le cache périodiquement
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Chaque minute
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private generateKey(table: string, filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort()
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${table}:${filterString}`;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();

    // Vérifier si l'entrée existe et est encore valide
    if (entry && (now - entry.timestamp) < entry.ttl) {
      return entry.data as T;
    }

    // Récupérer les nouvelles données
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: now,
        ttl
      });
      return data;
    } catch (error) {
      // En cas d'erreur, retourner les données cachées si disponibles
      if (entry) {
        console.warn('Using stale cache data due to fetch error:', error);
        return entry.data as T;
      }
      throw error;
    }
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Méthodes spécialisées pour le monitoring
  async getErrorReports(timeFilter: string, ttl: number = 2 * 60 * 1000) {
    const key = this.generateKey('error_reports', { timeFilter });
    
    return this.get(key, async () => {
      const { data, error } = await supabase
        .from('error_reports')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    }, ttl);
  }

  async getPerformanceMetrics(timeFilter: string, ttl: number = 2 * 60 * 1000) {
    const key = this.generateKey('performance_metrics', { timeFilter });
    
    return this.get(key, async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data || [];
    }, ttl);
  }

  async getPerformanceAlerts(timeFilter: string, ttl: number = 1 * 60 * 1000) {
    const key = this.generateKey('performance_alerts', { timeFilter });
    
    return this.get(key, async () => {
      const { data, error } = await supabase
        .from('performance_alerts')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    }, ttl);
  }

  async getErrorStats(timeFilter: string, ttl: number = 5 * 60 * 1000) {
    const key = this.generateKey('error_stats', { timeFilter });
    
    return this.get(key, async () => {
      // Statistiques par sévérité
      const { data: severityStats, error: severityError } = await supabase
        .from('error_reports')
        .select('severity, resolved')
        .gte('timestamp', timeFilter);

      if (severityError) throw severityError;

      // Statistiques par URL
      const { data: urlStats, error: urlError } = await supabase
        .from('error_reports')
        .select('url, severity')
        .gte('timestamp', timeFilter);

      if (urlError) throw urlError;

      // Tendances par heure
      const { data: hourlyStats, error: hourlyError } = await supabase
        .rpc('get_hourly_error_stats', { time_filter: timeFilter });

      if (hourlyError) throw hourlyError;

      return {
        severityStats: severityStats || [],
        urlStats: urlStats || [],
        hourlyStats: hourlyStats || []
      };
    }, ttl);
  }

  async getPerformanceStats(timeFilter: string, ttl: number = 5 * 60 * 1000) {
    const key = this.generateKey('performance_stats', { timeFilter });
    
    return this.get(key, async () => {
      // Moyennes par métrique
      const { data: avgStats, error: avgError } = await supabase
        .rpc('get_performance_averages', { time_filter: timeFilter });

      if (avgError) throw avgError;

      // Percentiles
      const { data: percentileStats, error: percentileError } = await supabase
        .rpc('get_performance_percentiles', { time_filter: timeFilter });

      if (percentileError) throw percentileError;

      // Tendances par heure
      const { data: hourlyStats, error: hourlyError } = await supabase
        .rpc('get_hourly_performance_stats', { time_filter: timeFilter });

      if (hourlyError) throw hourlyError;

      return {
        averages: avgStats || [],
        percentiles: percentileStats || [],
        hourlyStats: hourlyStats || []
      };
    }, ttl);
  }

  // Pré-charger les données couramment utilisées
  async preloadCommonData(): Promise<void> {
    const timeFilters = [
      new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h
    ];

    const promises = timeFilters.map(timeFilter => Promise.all([
      this.getErrorReports(timeFilter),
      this.getPerformanceMetrics(timeFilter),
      this.getPerformanceAlerts(timeFilter),
      this.getErrorStats(timeFilter),
      this.getPerformanceStats(timeFilter)
    ]));

    try {
      await Promise.all(promises);
      console.log('Monitoring data preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload some monitoring data:', error);
    }
  }

  // Obtenir des statistiques sur le cache
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export default MonitoringCache;
