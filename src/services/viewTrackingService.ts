import { supabase } from '@/integrations/supabase/client.browser';
import { logger } from '@/services/logger';

export interface ViewEvent {
  id?: string;
  user_id: string;
  content_type: 'vacation' | 'profile' | 'establishment' | 'mission';
  content_id: string;
  viewed_at: string;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
}

export interface MatchEvent {
  id?: string;
  user_id: string;
  content_id: string;
  match_type: 'application' | 'booking' | 'contact' | 'interest';
  matched_at: string;
  success: boolean;
}

export class ViewTrackingService {
  private static sessionId: string = this.generateSessionId();

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Tracker une vue de contenu
  static async trackView(
    userId: string,
    contentType: ViewEvent['content_type'],
    contentId: string
  ): Promise<void> {
    try {
      const viewEvent: ViewEvent = {
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        viewed_at: new Date().toISOString(),
        session_id: this.sessionId,
        user_agent: navigator.userAgent,
        ip_address: undefined // Sera récupérée côté serveur si nécessaire
      };

      const { error } = await supabase
        .from('view_analytics')
        .insert(viewEvent);

      if (error) {
        logger.error('Erreur lors du tracking de vue', error, { userId, contentType, contentId });
      } else {
        logger.debug('Vue trackée avec succès', { userId, contentType, contentId });
      }
    } catch (error) {
      logger.error('Erreur inattendue lors du tracking de vue', error, { userId, contentType, contentId });
    }
  }

  // Tracker un match/interaction
  static async trackMatch(
    userId: string,
    contentId: string,
    matchType: MatchEvent['match_type'],
    success: boolean = true
  ): Promise<void> {
    try {
      const matchEvent: MatchEvent = {
        user_id: userId,
        content_id: contentId,
        match_type: matchType,
        matched_at: new Date().toISOString(),
        success: success
      };

      const { error } = await supabase
        .from('match_analytics')
        .insert(matchEvent);

      if (error) {
        logger.error('Erreur lors du tracking de match', error, { userId, contentId, matchType, success });
      } else {
        logger.debug('Match tracké avec succès', { userId, contentId, matchType, success });
      }
    } catch (error) {
      logger.error('Erreur inattendue lors du tracking de match', error, { userId, contentId, matchType, success });
    }
  }

  // Obtenir les statistiques de vues pour une période
  static async getViewStats(
    contentId?: string,
    contentType?: ViewEvent['content_type'],
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('view_analytics')
        .select('id', { count: 'exact', head: true });

      if (contentId) {
        query = query.eq('content_id', contentId);
      }

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      if (startDate) {
        query = query.gte('viewed_at', startDate);
      }

      if (endDate) {
        query = query.lte('viewed_at', endDate);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('Erreur lors de la récupération des stats de vues', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Erreur inattendue lors de la récupération des stats de vues', error);
      return 0;
    }
  }

  // Obtenir les statistiques de matches pour une période
  static async getMatchStats(
    contentId?: string,
    matchType?: MatchEvent['match_type'],
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('match_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('success', true);

      if (contentId) {
        query = query.eq('content_id', contentId);
      }

      if (matchType) {
        query = query.eq('match_type', matchType);
      }

      if (startDate) {
        query = query.gte('matched_at', startDate);
      }

      if (endDate) {
        query = query.lte('matched_at', endDate);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('Erreur lors de la récupération des stats de matches', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Erreur inattendue lors de la récupération des stats de matches', error);
      return 0;
    }
  }

  // Nettoyer les anciennes données (à appeler périodiquement)
  static async cleanOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateString = cutoffDate.toISOString();

      // Nettoyer les vues anciennes
      const { error: viewsError } = await supabase
        .from('view_analytics')
        .delete()
        .lt('viewed_at', cutoffDateString);

      if (viewsError) {
        logger.error('Erreur lors du nettoyage des vues anciennes', viewsError);
      }

      // Nettoyer les matches anciens
      const { error: matchesError } = await supabase
        .from('match_analytics')
        .delete()
        .lt('matched_at', cutoffDateString);

      if (matchesError) {
        logger.error('Erreur lors du nettoyage des matches anciens', matchesError);
      }

      logger.info('Nettoyage des données analytics terminé', { daysToKeep, cutoffDate: cutoffDateString });
    } catch (error) {
      logger.error('Erreur inattendue lors du nettoyage des données analytics', error);
    }
  }
}

// Hook personnalisé pour faciliter l'utilisation
export const useViewTracking = () => {
  return {
    trackView: ViewTrackingService.trackView,
    trackMatch: ViewTrackingService.trackMatch,
    getViewStats: ViewTrackingService.getViewStats,
    getMatchStats: ViewTrackingService.getMatchStats
  };
};
