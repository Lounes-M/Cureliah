/**
 * Hook intelligent pour la gestion des notifications
 * Remplace le polling fixe par un système adaptatif avec temps réel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { logger } from '@/services/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationCount {
  unread: number;
  urgent: number;
  lastUpdated: Date;
}

interface UseSmartNotificationsOptions {
  userId?: string;
  userType?: 'doctor' | 'establishment' | 'admin';
  enableRealtime?: boolean;
  fallbackPollingInterval?: number;
  maxPollingInterval?: number;
  minPollingInterval?: number;
}

/**
 * Hook intelligent pour les notifications avec stratégie adaptative :
 * 1. Temps réel en priorité (WebSocket)
 * 2. Polling intelligent en fallback avec intervalles adaptatifs
 * 3. Polling agressif quand l'utilisateur est actif
 * 4. Polling réduit quand l'utilisateur est inactif
 */
export function useSmartNotifications(options: UseSmartNotificationsOptions = {}) {
  const {
    userId,
    userType,
    enableRealtime = true,
    fallbackPollingInterval = 60000, // 1 minute par défaut
    maxPollingInterval = 300000, // 5 minutes max
    minPollingInterval = 10000 // 10 secondes min
  } = options;

  const [notificationCount, setNotificationCount] = useState<NotificationCount>({
    unread: 0,
    urgent: 0,
    lastUpdated: new Date()
  });

  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);
  const [currentPollingInterval, setCurrentPollingInterval] = useState(fallbackPollingInterval);

  // Références pour le cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compteur d'erreurs pour l'escalade progressive
  const errorCountRef = useRef(0);

  /**
   * Récupération des notifications depuis la base
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      logger.debug('Fetching notifications', { userId, userType });

      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (unreadError) throw unreadError;

      const { count: urgentCount, error: urgentError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
        .eq('priority', 'urgent');

      if (urgentError) throw urgentError;

      const newCount: NotificationCount = {
        unread: unreadCount || 0,
        urgent: urgentCount || 0,
        lastUpdated: new Date()
      };

      setNotificationCount(newCount);
      
      // Reset des erreurs en cas de succès
      errorCountRef.current = 0;
      
      logger.debug('Notifications fetched successfully', {
        unread: newCount.unread, 
        urgent: newCount.urgent,
        lastUpdated: newCount.lastUpdated.toISOString()
      });

    } catch (error) {
      errorCountRef.current += 1;
      logger.error('Error fetching notifications', error as Error, { userId, errorCount: errorCountRef.current });
      
      // Escalade progressive : augmenter l'intervalle après plusieurs erreurs
      if (errorCountRef.current >= 3) {
        setCurrentPollingInterval(Math.min(currentPollingInterval * 1.5, maxPollingInterval));
      }
    }
  }, [userId, userType, currentPollingInterval, maxPollingInterval]);

  /**
   * Configuration du temps réel via Supabase
   */
  const setupRealTimeSubscription = useCallback(() => {
    if (!userId || !enableRealtime) return;

    logger.info('Setting up real-time notifications subscription', { userId });

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.info('Real-time notification received', {
            eventType: payload.eventType,
            userId 
          });
          
          // Actualiser immédiatement après un changement
          fetchNotifications();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsRealTimeConnected(true);
          logger.info('Real-time notifications connected', { userId });
        } else if (status === 'CLOSED') {
          setIsRealTimeConnected(false);
          logger.warn('Real-time notifications disconnected', { userId, error: err });
        } else if (status === 'CHANNEL_ERROR') {
          setIsRealTimeConnected(false);
          logger.error('Real-time notifications error', err as Error, { userId });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsRealTimeConnected(false);
    };
  }, [userId, enableRealtime, fetchNotifications]);

  /**
   * Gestion du polling intelligent
   */
  const setupSmartPolling = useCallback(() => {
    // Nettoyer l'ancien intervalle
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Si temps réel connecté ET utilisateur inactif, réduire le polling
    if (isRealTimeConnected && !isUserActive) {
      logger.debug('Real-time connected and user inactive, skipping polling');
      return;
    }

    // Calculer l'intervalle selon l'activité utilisateur
    const interval = isUserActive ? 
      Math.max(currentPollingInterval / 2, minPollingInterval) : 
      Math.min(currentPollingInterval * 2, maxPollingInterval);

    logger.debug('Setting up smart polling', {
      interval, 
      isUserActive, 
      isRealTimeConnected 
    });

    pollingIntervalRef.current = setInterval(fetchNotifications, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isRealTimeConnected, isUserActive, currentPollingInterval, minPollingInterval, maxPollingInterval, fetchNotifications]);

  /**
   * Détection d'activité utilisateur
   */
  const handleUserActivity = useCallback(() => {
    setIsUserActive(true);
    
    // Reset du timeout d'inactivité
    if (userActivityTimeoutRef.current) {
      clearTimeout(userActivityTimeoutRef.current);
    }

    // Considérer l'utilisateur inactif après 5 minutes
    userActivityTimeoutRef.current = setTimeout(() => {
      setIsUserActive(false);
      logger.debug('User marked as inactive');
    }, 300000); // 5 minutes
  }, []);

  // Configuration initiale et cleanup
  useEffect(() => {
    if (!userId) return;

    // Fetch initial
    fetchNotifications();

    // Setup real-time si activé
    const cleanupRealTime = enableRealtime ? setupRealTimeSubscription() : undefined;

    // Setup polling intelligent
    const cleanupPolling = setupSmartPolling();

    // Listeners d'activité utilisateur
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cleanup
    return () => {
      cleanupRealTime?.();
      cleanupPolling?.();
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
    };
  }, [userId, fetchNotifications, setupRealTimeSubscription, setupSmartPolling, handleUserActivity, enableRealtime]);

  // Re-setup polling quand les conditions changent
  useEffect(() => {
    const cleanupPolling = setupSmartPolling();
    return cleanupPolling;
  }, [setupSmartPolling]);

  /**
   * API publique du hook
   */
  return {
    ...notificationCount,
    isRealTimeConnected,
    isUserActive,
    currentPollingInterval,
    
    // Actions
    refreshNotifications: fetchNotifications,
    
    // Méthodes de contrôle
    forceRefresh: () => {
      logger.userAction('notifications_force_refresh', userId || '');
      fetchNotifications();
    },
    
    // État pour debugging
    debug: {
      errorCount: errorCountRef.current,
      pollingActive: !!pollingIntervalRef.current,
      realTimeChannel: channelRef.current?.topic
    }
  };
}
