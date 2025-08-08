import { supabase } from '@/integrations/supabase/client.browser';
import { UrgentRequest, UrgentRequestResponse, UrgentRequestNotification } from '@/types/premium';

export class UrgentRequestService {
  
  // Créer une demande urgente (établissements)
  static async createUrgentRequest(
    establishmentId: string, 
    requestData: Omit<UrgentRequest, 'id' | 'establishment_id' | 'establishment_name' | 'establishment_logo' | 'establishment_rating' | 'created_at' | 'updated_at' | 'status' | 'response_count' | 'view_count'>
  ): Promise<UrgentRequest> {
    // Vérifier l'abonnement de l'établissement
    const { data: subscription } = await supabase
      .from('establishment_subscriptions')
      .select('plan_type, credits_remaining')
      .eq('establishment_id', establishmentId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      throw new Error('Abonnement actif requis pour créer des demandes urgentes');
    }

    // Calculer le coût basé sur l'urgence et les fonctionnalités premium
    const cost = this.calculateRequestCost(requestData.urgency_level, requestData.priority_boost, requestData.featured);
    
    if (subscription.credits_remaining < cost) {
      throw new Error(`Crédits insuffisants. Coût: ${cost} crédits, Disponible: ${subscription.credits_remaining}`);
    }

    // Créer la demande
    const newRequest = {
      ...requestData,
      establishment_id: establishmentId,
      status: 'open' as const,
      response_count: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('urgent_requests')
      .insert(newRequest)
      .select()
      .single();

    if (error) throw error;

    // Déduire les crédits
    await supabase
      .from('establishment_subscriptions')
      .update({ 
        credits_remaining: subscription.credits_remaining - cost,
        updated_at: new Date().toISOString()
      })
      .eq('establishment_id', establishmentId);

    // Envoyer des notifications aux médecins qualifiés
    await this.notifyQualifiedDoctors(data);

    // Log de l'activité
    await this.logActivity('urgent_request_created', establishmentId, data.id);

    return data;
  }

  // Obtenir les demandes urgentes pour les médecins (avec filtres de proximité et spécialité)
  static async getUrgentRequestsForDoctors(
    doctorId: string,
    filters?: {
      specialty?: string;
      urgency_level?: string;
      max_distance?: number;
      min_rate?: number;
      location?: string;
    }
  ): Promise<UrgentRequest[]> {
    // Récupérer le profil du médecin pour filtrer par spécialité et localisation
    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('speciality, location, latitude, longitude')
      .eq('id', doctorId)
      .single();

    let query = supabase
      .from('urgent_requests')
      .select(`
        *,
        establishments (
          name,
          rating,
          logo_url
        )
      `)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString());

    // Filtrer par spécialité du médecin ou spécialité requise
    if (doctorProfile?.speciality && !filters?.specialty) {
      query = query.eq('specialty_required', doctorProfile.speciality);
    } else if (filters?.specialty) {
      query = query.eq('specialty_required', filters.specialty);
    }

    // Autres filtres
    if (filters?.urgency_level) {
      query = query.eq('urgency_level', filters.urgency_level);
    }
    
    if (filters?.min_rate) {
      query = query.gte('hourly_rate', filters.min_rate);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Ordonner par urgence, puis par créé récemment, puis par rémunération
    query = query.order('urgency_level', { ascending: false })
                .order('priority_boost', { ascending: false })
                .order('hourly_rate', { ascending: false })
                .order('created_at', { ascending: false });

    const { data, error } = await query.limit(50);

    if (error) throw error;

    // Calculer la distance si les coordonnées sont disponibles
    const requestsWithDistance = data?.map(request => ({
      ...request,
      distance_km: doctorProfile?.latitude && doctorProfile?.longitude 
        ? this.calculateDistance(
            doctorProfile.latitude, 
            doctorProfile.longitude, 
            request.latitude || 0, 
            request.longitude || 0
          ) 
        : null
    })) || [];

    // Filtrer par distance si spécifié
    if (filters?.max_distance) {
      return requestsWithDistance.filter(request => 
        !request.distance_km || request.distance_km <= filters.max_distance!
      );
    }

    return requestsWithDistance;
  }

  // Répondre à une demande urgente (médecins)
  static async respondToUrgentRequest(
    requestId: string,
    doctorId: string,
    responseData: {
      response_type: 'interested' | 'available' | 'maybe';
      availability_start: string;
      availability_end: string;
      message: string;
      requested_rate?: number;
    }
  ): Promise<UrgentRequestResponse> {
    // Vérifier que la demande existe et est ouverte
    const { data: request } = await supabase
      .from('urgent_requests')
      .select('*, establishments(name)')
      .eq('id', requestId)
      .eq('status', 'open')
      .single();

    if (!request) {
      throw new Error('Demande non trouvée ou déjà fermée');
    }

    // Vérifier que le médecin n'a pas déjà répondu
    const { data: existingResponse } = await supabase
      .from('urgent_request_responses')
      .select('id')
      .eq('request_id', requestId)
      .eq('doctor_id', doctorId)
      .single();

    if (existingResponse) {
      throw new Error('Vous avez déjà répondu à cette demande');
    }

    // Calculer le temps de réponse
    const requestCreatedAt = new Date(request.created_at);
    const responseTime = Math.floor((Date.now() - requestCreatedAt.getTime()) / (1000 * 60)); // en minutes

    // Récupérer les infos du médecin
    const { data: doctor } = await supabase
      .from('doctor_profiles')
      .select('first_name, last_name, speciality, rating, location, latitude, longitude')
      .eq('id', doctorId)
      .single();

    // Calculer la distance
    const distance_km = doctor?.latitude && doctor?.longitude && request.latitude && request.longitude
      ? this.calculateDistance(doctor.latitude, doctor.longitude, request.latitude, request.longitude)
      : null;

    const newResponse = {
      ...responseData,
      request_id: requestId,
      doctor_id: doctorId,
      doctor_name: `${doctor?.first_name} ${doctor?.last_name}`,
      doctor_specialty: doctor?.speciality || '',
      doctor_rating: doctor?.rating || 0,
      doctor_distance_km: distance_km,
      status: 'pending' as const,
      response_time: responseTime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('urgent_request_responses')
      .insert(newResponse)
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le compteur de réponses
    await supabase
      .from('urgent_requests')
      .update({ 
        response_count: request.response_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Notifier l'établissement
    await this.notifyEstablishmentNewResponse(request.establishment_id, requestId, data);

    // Log de l'activité
    await this.logActivity('urgent_request_response', doctorId, requestId);

    return data;
  }

  // Accepter/rejeter une réponse (établissements)
  static async updateResponseStatus(
    responseId: string,
    establishmentId: string,
    status: 'accepted' | 'rejected',
    notes?: string
  ): Promise<void> {
    // Vérifier que la réponse appartient à une demande de cet établissement
    const { data: response } = await supabase
      .from('urgent_request_responses')
      .select(`
        *,
        urgent_requests!inner(establishment_id, status)
      `)
      .eq('id', responseId)
      .eq('urgent_requests.establishment_id', establishmentId)
      .single();

    if (!response) {
      throw new Error('Réponse non trouvée ou non autorisée');
    }

    if (response.urgent_requests.status !== 'open') {
      throw new Error('Cette demande n\'est plus ouverte');
    }

    // Mettre à jour le statut de la réponse
    const { error } = await supabase
      .from('urgent_request_responses')
      .update({ 
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId);

    if (error) throw error;

    if (status === 'accepted') {
      // Marquer la demande comme en cours
      await supabase
        .from('urgent_requests')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', response.request_id);

      // Rejeter automatiquement les autres réponses
      await supabase
        .from('urgent_request_responses')
        .update({ 
          status: 'rejected',
          notes: 'Demande déjà pourvue',
          updated_at: new Date().toISOString()
        })
        .eq('request_id', response.request_id)
        .neq('id', responseId)
        .eq('status', 'pending');
    }

    // Notifier le médecin
    await this.notifyDoctorResponseUpdate(response.doctor_id, response.request_id, status);

    // Log de l'activité
    await this.logActivity('response_status_updated', establishmentId, responseId);
  }

  // Obtenir les demandes d'un établissement avec leurs réponses
  static async getEstablishmentRequests(
    establishmentId: string,
    status?: string
  ): Promise<(UrgentRequest & { responses: UrgentRequestResponse[] })[]> {
    let query = supabase
      .from('urgent_requests')
      .select(`
        *,
        urgent_request_responses (*)
      `)
      .eq('establishment_id', establishmentId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(request => ({
      ...request,
      responses: request.urgent_request_responses || []
    })) || [];
  }

  // Obtenir les réponses d'un médecin
  static async getDoctorResponses(
    doctorId: string,
    status?: string
  ): Promise<(UrgentRequestResponse & { request: UrgentRequest })[]> {
    let query = supabase
      .from('urgent_request_responses')
      .select(`
        *,
        urgent_requests (*, establishments(name, rating, logo_url))
      `)
      .eq('doctor_id', doctorId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(response => ({
      ...response,
      request: response.urgent_requests
    })) || [];
  }

  // Marquer une demande comme vue
  static async markRequestAsViewed(requestId: string): Promise<void> {
    await supabase.rpc('increment_view_count', { request_id: requestId });
  }

  // Calculer le coût d'une demande
  private static calculateRequestCost(
    urgency: string, 
    priority_boost: boolean, 
    featured: boolean
  ): number {
    let baseCost = 10; // Coût de base

    // Coût selon l'urgence
    switch (urgency) {
      case 'high': baseCost += 5; break;
      case 'critical': baseCost += 10; break;
      case 'emergency': baseCost += 20; break;
    }

    // Coûts premium
    if (priority_boost) baseCost += 15;
    if (featured) baseCost += 25;

    return baseCost;
  }

  // Calculer la distance entre deux points
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Notifier les médecins qualifiés
  private static async notifyQualifiedDoctors(request: UrgentRequest): Promise<void> {
    // Logique de notification sera implémentée avec le système de notifications temps réel
    console.log(`Notification envoyée pour la demande ${request.id}`);
  }

  // Notifier l'établissement d'une nouvelle réponse
  private static async notifyEstablishmentNewResponse(
    establishmentId: string, 
    requestId: string, 
    response: UrgentRequestResponse
  ): Promise<void> {
    const notification: Omit<UrgentRequestNotification, 'id' | 'created_at'> = {
      request_id: requestId,
      recipient_id: establishmentId,
      recipient_type: 'establishment',
      type: 'new_response',
      title: 'Nouvelle réponse à votre demande urgente',
      message: `${response.doctor_name} a répondu à votre demande urgente`,
      read: false,
      action_url: `/establishment/urgent-requests/${requestId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
    };

    await supabase.from('urgent_request_notifications').insert(notification);
  }

  // Notifier le médecin du statut de sa réponse
  private static async notifyDoctorResponseUpdate(
    doctorId: string, 
    requestId: string, 
    status: string
  ): Promise<void> {
    const notification: Omit<UrgentRequestNotification, 'id' | 'created_at'> = {
      request_id: requestId,
      recipient_id: doctorId,
      recipient_type: 'doctor',
      type: 'request_accepted',
      title: status === 'accepted' ? 'Votre réponse a été acceptée !' : 'Réponse non retenue',
      message: status === 'accepted' 
        ? 'Félicitations ! L\'établissement a accepté votre réponse.'
        : 'L\'établissement a choisi un autre candidat pour cette demande.',
      read: false,
      action_url: `/doctor/urgent-requests/${requestId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    await supabase.from('urgent_request_notifications').insert(notification);
  }

  // Logger l'activité
  private static async logActivity(action: string, userId: string, resourceId: string): Promise<void> {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      resource_type: 'urgent_request',
      resource_id: resourceId,
      created_at: new Date().toISOString()
    });
  }

  // Obtenir les statistiques pour le dashboard
  static async getUrgentRequestStats(establishmentId?: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Requêtes séparées pour éviter les problèmes de chaînage
    const totalQuery = establishmentId 
      ? supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId)
      : supabase.from('urgent_requests').select('*', { count: 'exact', head: true });

    const openQuery = establishmentId 
      ? supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId).eq('status', 'open')
      : supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).eq('status', 'open');

    const recentQuery = establishmentId 
      ? supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId).gte('created_at', last24h.toISOString())
      : supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).gte('created_at', last24h.toISOString());

    const filledQuery = establishmentId 
      ? supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).eq('establishment_id', establishmentId).eq('status', 'filled')
      : supabase.from('urgent_requests').select('*', { count: 'exact', head: true }).eq('status', 'filled');

    const [
      { count: totalRequests },
      { count: openRequests },
      { count: recentRequests },
      { count: filledRequests }
    ] = await Promise.all([
      totalQuery,
      openQuery,
      recentQuery,
      filledQuery
    ]);

    return {
      total_requests: totalRequests || 0,
      open_requests: openRequests || 0,
      recent_requests: recentRequests || 0,
      filled_requests: filledRequests || 0,
      fill_rate: totalRequests ? ((filledRequests || 0) / totalRequests) * 100 : 0
    };
  }
}
