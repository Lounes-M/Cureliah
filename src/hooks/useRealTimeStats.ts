import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { getSpecialityInfo } from '@/utils/specialities';

interface StatsData {
  totalDoctors: number;
  totalVacations: number;
  popularSpecialities: Array<{ name: string; count: number }>;
  popularLocations: Array<{ name: string; count: number }>;
  lastUpdated: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STATS_CACHE_KEY = 'cureliah_real_stats';

/**
 * Hook pour récupérer les statistiques réelles en temps réel avec cache intelligent
 */
export const useRealTimeStats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer du cache localStorage
  const getCachedStats = (): StatsData | null => {
    try {
      const cached = localStorage.getItem(STATS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        if (now - data.lastUpdated < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      // TODO: Replace with logger.warn('Erreur lors de la lecture du cache des stats:', error);
    }
    return null;
  };

  // Sauvegarder dans le cache
  const setCachedStats = (data: StatsData) => {
    try {
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      // TODO: Replace with logger.warn('Erreur lors de la sauvegarde du cache des stats:', error);
    }
  };

  // Récupérer les statistiques réelles
  const fetchRealStats = async (): Promise<StatsData> => {
    const [doctorsResult, vacationsResult, specialitiesResult, locationsResult] = await Promise.all([
      supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('vacation_posts').select('*', { count: 'exact', head: true }).gte('end_date', new Date().toISOString()),
      supabase.from('doctor_profiles').select('speciality').not('speciality', 'is', null),
      supabase.from('vacation_posts').select('location').not('location', 'is', null)
    ]);

    // Traitement des spécialités
    const specialityMap = new Map<string, number>();
    specialitiesResult.data?.forEach(doc => {
      if (doc.speciality) {
        const translated = getSpecialityInfo(doc.speciality).label;
        specialityMap.set(translated, (specialityMap.get(translated) || 0) + 1);
      }
    });

    // Traitement des localisations
    const locationMap = new Map<string, number>();
    locationsResult.data?.forEach(vacation => {
      if (vacation.location) {
        locationMap.set(vacation.location, (locationMap.get(vacation.location) || 0) + 1);
      }
    });

    const statsData: StatsData = {
      totalDoctors: doctorsResult.count || 0,
      totalVacations: vacationsResult.count || 0,
      popularSpecialities: Array.from(specialityMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      popularLocations: Array.from(locationMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      lastUpdated: Date.now()
    };

    return statsData;
  };

  // Charger les statistiques
  const loadStats = async (forceRefresh = false) => {
    // Vérifier le cache d'abord
    if (!forceRefresh) {
      const cachedStats = getCachedStats();
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const freshStats = await fetchRealStats();
      setStats(freshStats);
      setCachedStats(freshStats);
    } catch (error) {
      // TODO: Replace with logger.error('Erreur lors du chargement des statistiques:', error);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: () => loadStats(true),
    isStale: stats ? Date.now() - stats.lastUpdated > CACHE_DURATION : false
  };
};
