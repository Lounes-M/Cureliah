import { supabase } from '@/integrations/supabase/client.browser';
import { PremiumMission, PremiumMissionFilter, PremiumMissionApplication } from '@/types/premium';
import { logger } from '@/services/logger';

export class PremiumMissionService {
  
  // Récupérer les missions exclusives Premium
  static async getPremiumMissions(
    userId: string, 
    filters?: PremiumMissionFilter
  ): Promise<PremiumMission[]> {
    let query = supabase
      .from('premium_missions')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'available')
      .gte('exclusive_until', new Date().toISOString())
      .gte('application_deadline', new Date().toISOString());

    // Appliquer les filtres
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    if (filters?.specialty) {
      query = query.ilike('specialty', `%${filters.specialty}%`);
    }
    
    if (filters?.salary_min) {
      query = query.gte('salary_min', filters.salary_min);
    }

    if (filters?.urgency) {
      query = query.eq('urgency', filters.urgency);
    }

    if (filters?.mission_type) {
      query = query.eq('mission_type', filters.mission_type);
    }

    if (filters?.available_spots_only) {
      query = query.filter('spots_available', 'gt', 'spots_filled');
    }

    if (filters?.establishment_rating_min) {
      query = query.gte('establishment_rating', filters.establishment_rating_min);
    }

    const { data, error } = await query
      .order('urgency', { ascending: false })
      .order('exclusive_until', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Postuler à une mission premium (avec priorité)
  static async applyToPremiumMission(
    missionId: string, 
    userId: string
  ): Promise<PremiumMissionApplication> {
    // Vérifier que l'utilisateur a un abonnement Premium
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_type')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.plan_type !== 'premium') {
      throw new Error('Abonnement Premium requis pour postuler aux missions exclusives');
    }

    // Calculer le score de priorité (Premium = score élevé)
    const priorityScore = this.calculatePriorityScore(subscription.plan_type);

    const applicationData = {
      mission_id: missionId,
      user_id: userId,
      status: 'pending' as const,
      application_date: new Date().toISOString(),
      priority_score: priorityScore
    };

    const { data, error } = await supabase
      .from('premium_mission_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) throw error;

    // Envoyer notification à l'établissement
    await this.notifyEstablishment(missionId, userId);

    return data;
  }

  // Créer une mission premium (pour les établissements Premium)
  static async createPremiumMission(
    establishmentId: string,
    missionData: Omit<PremiumMission, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PremiumMission> {
    // Vérifier que l'établissement a un abonnement Premium
    const { data: subscription } = await supabase
      .from('establishment_subscriptions')
      .select('plan_type')
      .eq('establishment_id', establishmentId)
      .eq('status', 'active')
      .single();

    if (!subscription || !['pro', 'premium'].includes(subscription.plan_type)) {
      throw new Error('Abonnement Pro ou Premium requis pour créer des missions exclusives');
    }

    const { data, error } = await supabase
      .from('premium_missions')
      .insert({
        ...missionData,
        establishment_id: establishmentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtenir les candidatures pour une mission (triées par priorité)
  static async getMissionApplications(missionId: string): Promise<PremiumMissionApplication[]> {
    const { data, error } = await supabase
      .from('premium_mission_applications')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          avatar_url,
          experience_years
        )
      `)
      .eq('mission_id', missionId)
      .order('priority_score', { ascending: false })
      .order('application_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Accepter/rejeter une candidature
  static async updateApplicationStatus(
    applicationId: string,
    status: PremiumMissionApplication['status'],
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('premium_mission_applications')
      .update({ 
        status, 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    // Envoyer notification au candidat
    await this.notifyCandidate(applicationId, status);
  }

  // Calculer le score de priorité basé sur l'abonnement
  private static calculatePriorityScore(planType: string): number {
    const scores = {
      'premium': 100,
      'pro': 75,
      'essential': 50
    };
    return scores[planType as keyof typeof scores] || 25;
  }

  // Notifier l'établissement d'une nouvelle candidature
  private static async notifyEstablishment(missionId: string, userId: string): Promise<void> {
    logger.info('Nouvelle candidature Premium pour mission', { missionId, userId });
  }

  // Notifier le candidat du statut de sa candidature
  private static async notifyCandidate(applicationId: string, status: string): Promise<void> {
    logger.info('Candidature mise à jour', { applicationId, status });
  }

  // Statistiques missions Premium pour dashboard
  static async getPremiumMissionsStats(establishmentId?: string) {
    let query = supabase
      .from('premium_missions')
      .select('*');

    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId);
    }

    const { data: missions, error } = await query;
    if (error) throw error;

    const stats = {
      total_missions: missions?.length || 0,
      active_missions: missions?.filter(m => new Date(m.exclusive_until) > new Date()).length || 0,
      urgent_missions: missions?.filter(m => m.urgency === 'critical').length || 0,
      avg_salary: missions?.length ? 
        missions.reduce((sum, m) => sum + (m.salary_min + m.salary_max) / 2, 0) / missions.length : 0
    };

    return stats;
  }
}
