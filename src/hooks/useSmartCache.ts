import { useState, useEffect, useCallback } from 'react';

interface CacheConfig {
  maxAge: number; // en millisecondes
  maxSize: number; // nombre maximum d'entrées
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxAge: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  set(key: string, data: T): void {
    // Nettoyer le cache si nécessaire
    this.cleanup();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Supprimer les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(key);
      }
    }

    // Si le cache est toujours trop grand, supprimer les entrées les moins utilisées
    if (this.cache.size >= this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => {
          // Trier par fréquence d'utilisation et dernière utilisation
          const scoreA = a[1].accessCount * 0.7 + (now - a[1].lastAccessed) * 0.3;
          const scoreB = b[1].accessCount * 0.7 + (now - b[1].lastAccessed) * 0.3;
          return scoreA - scoreB;
        });

      // Supprimer les 20% les moins utilisées
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  getStats(): { size: number; hitRate: number; avgAge: number } {
    const now = Date.now();
    let totalAccess = 0;
    let totalAge = 0;

    for (const [, entry] of this.cache.entries()) {
      totalAccess += entry.accessCount;
      totalAge += now - entry.timestamp;
    }

    return {
      size: this.cache.size,
      hitRate: totalAccess / Math.max(this.cache.size, 1),
      avgAge: totalAge / Math.max(this.cache.size, 1)
    };
  }
}

// Instance globale du cache
const globalCache = new SmartCache<any>({ maxAge: 5 * 60 * 1000, maxSize: 200 });

// Hook pour utiliser le cache intelligent
export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Vérifier le cache d'abord (sauf si forcé)
    if (!force && globalCache.has(key)) {
      const cached = globalCache.get(key);
      if (cached) {
        setData(cached);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetcher();
      
      setData(result);
      globalCache.set(key, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, enabled]);

  // Refetch sur focus si activé
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      // Vérifier si les données sont "stale"
      const cached = globalCache.get(key);
      if (cached) {
        const entry = (globalCache as any).cache.get(key);
        if (entry && Date.now() - entry.timestamp > staleTime) {
          fetchData();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, staleTime, refetchOnWindowFocus, fetchData]);

  // Charger les données au montage
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale: () => {
      const entry = (globalCache as any).cache.get(key);
      return entry ? Date.now() - entry.timestamp > staleTime : true;
    }
  };
}

// Hook pour optimiser les requêtes avec debounce
export function useDebouncedSearch<T>(
  searchTerm: string,
  fetcher: (term: string) => Promise<T>,
  delay: number = 300
) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  const cacheKey = `search:${debouncedTerm}`;
  
  return useSmartCache(
    cacheKey,
    () => fetcher(debouncedTerm),
    {
      enabled: debouncedTerm.length > 0,
      staleTime: 2 * 60 * 1000, // 2 minutes pour les recherches
      refetchOnWindowFocus: false
    }
  );
}

// Hook pour la pagination avec cache
export function usePaginatedCache<T>(
  baseKey: string,
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  pageSize: number = 10
) {
  const [pages, setPages] = useState<Map<number, T[]>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(async (page: number) => {
    const cacheKey = `${baseKey}:page:${page}`;
    
    // Vérifier le cache
    if (globalCache.has(cacheKey)) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        setPages(prev => new Map(prev.set(page, cached.data)));
        setHasMore(cached.hasMore);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetcher(page, pageSize);
      
      setPages(prev => new Map(prev.set(page, result.data)));
      setHasMore(result.hasMore);
      
      // Mettre en cache
      globalCache.set(cacheKey, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de chargement');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [baseKey, fetcher, pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    await loadPage(nextPage);
    setCurrentPage(nextPage);
  }, [currentPage, hasMore, loading, loadPage]);

  const refresh = useCallback(() => {
    // Invalider le cache et recommencer
    for (let i = 1; i <= currentPage; i++) {
      globalCache.delete(`${baseKey}:page:${i}`);
    }
    setPages(new Map());
    setCurrentPage(1);
    setHasMore(true);
    loadPage(1);
  }, [baseKey, currentPage, loadPage]);

  // Charger la première page
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Combiner toutes les pages en un seul tableau
  const allItems = Array.from(pages.entries())
    .sort(([a], [b]) => a - b)
    .flatMap(([, items]) => items);

  return {
    items: allItems,
    hasMore,
    loading,
    error,
    loadMore,
    refresh,
    currentPage
  };
}

// Utilitaires pour le cache
export const cacheUtils = {
  clear: () => globalCache.clear(),
  size: () => globalCache.size(),
  stats: () => globalCache.getStats(),
  invalidatePattern: (pattern: string) => {
    const regex = new RegExp(pattern);
    const keys = Array.from((globalCache as any).cache.keys()) as string[];
    keys.forEach(key => {
      if (regex.test(key)) {
        globalCache.delete(key);
      }
    });
  }
};

// Hook pour précharger des données
export function usePrefetch() {
  const prefetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>
  ) => {
    if (!globalCache.has(key)) {
      try {
        const data = await fetcher();
        globalCache.set(key, data);
      } catch (error) {
        console.warn('Prefetch failed for key:', key, error);
      }
    }
  }, []);

  return { prefetch };
}

export default SmartCache;
