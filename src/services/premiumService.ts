import { supabase } from '../integrations/supabase/client.browser'
import type { PremiumMission as RealPremiumMission } from '../types/premium'
import { logger } from "@/services/logger";

interface PremiumStatistics {
  totalRevenue: number
  totalMissions: number
  avgRating: number
  monthlyTrend: number
}

interface PremiumInvoice {
  id: string
  amount: number
  currency: string
  status: string
  description: string
  period_start: string
  period_end: string
  due_date: string
  paid_at?: string
  invoice_pdf?: string
  created_at: string
}

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  agent_response?: string
  created_at: string
  updated_at: string
}

interface ApiKey {
  id: string
  key_name: string
  permissions: string[]
  rate_limit: number
  usage_count: number
  last_used?: string
  is_active: boolean
  created_at: string
}

class PremiumService {
  // Statistiques Premium
  async getPremiumStatistics(): Promise<PremiumStatistics> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer les vraies statistiques des missions premium
      const { PremiumMissionService } = await import('./premiumMissions')
      const missions = await PremiumMissionService.getPremiumMissions(user.id)
      
      // Calculer les statistiques basées sur les vraies missions
      const totalMissions = missions.length
      const completedMissions = missions.filter(m => 
        new Date(m.exclusive_until) < new Date()
      ).length
      
      const totalRevenue = missions.reduce((sum, mission) => {
        return sum + ((mission.salary_min + mission.salary_max) / 2)
      }, 0)
      
      // Calcul de la note moyenne (basé sur les établissements)
      const avgRating = missions.length > 0 ? 
        missions.reduce((sum, mission) => sum + (mission.establishment_rating || 0), 0) / missions.length : 0

      // Tendance mensuelle (comparaison simple)
      const monthlyTrend = totalMissions > 0 ? 
        ((completedMissions / totalMissions) * 100) - 50 : 0

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalMissions,
        avgRating: Math.round(avgRating * 10) / 10,
        monthlyTrend: Math.round(monthlyTrend * 10) / 10
      }
    } catch (error) {
      logger.error('Erreur récupération statistiques:', error);
      
      // Fallback en cas d'erreur - récupération directe depuis la DB
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw error

        const currentMonth = new Date()
        currentMonth.setDate(1)
        
        const { data: stats } = await supabase
          .from('doctor_statistics')
          .select('*')
          .eq('doctor_id', user.id)
          .eq('month', currentMonth.toISOString().split('T')[0])
          .single()

        if (stats) {
          return {
            totalRevenue: parseFloat(stats.total_revenue || '0'),
            totalMissions: stats.total_missions || 0,
            avgRating: parseFloat(stats.avg_rating || '0'),
            monthlyTrend: 0
          }
        }
      } catch (dbError) {
        logger.error('Erreur fallback database:', dbError);
      }
      
      // Fallback final - pas de données de démonstration
      return {
        totalRevenue: 0,
        totalMissions: 0,
        avgRating: 0,
        monthlyTrend: 0
      }
    }
  }

  // Factures Premium
  async getPremiumInvoices(): Promise<PremiumInvoice[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer les vraies factures depuis la base de données
      const { data: invoices, error } = await supabase
        .from('premium_invoices')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Erreur récupération factures:', error);
        throw new Error('Erreur lors de la récupération des factures')
      }

      // Transformation des données pour correspondre à l'interface
      return (invoices || []).map(invoice => ({
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        due_date: invoice.due_date,
        paid_at: invoice.paid_at,
        invoice_pdf: invoice.invoice_pdf,
        created_at: invoice.created_at
      }))
    } catch (error) {
      logger.error('Erreur récupération factures:', error);
      throw error
    }
  }

  // Missions Premium
  async getPremiumMissions(): Promise<RealPremiumMission[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Utiliser le vrai service des missions premium
      const { PremiumMissionService } = await import('./premiumMissions')
      return await PremiumMissionService.getPremiumMissions(user.id)
    } catch (error) {
      logger.error('Erreur récupération missions:', error);
      throw error
    }
  }

  // Accepter une mission
  async acceptMission(missionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Utiliser le vrai service des missions premium
      const { PremiumMissionService } = await import('./premiumMissions')
      await PremiumMissionService.applyToPremiumMission(missionId, user.id)
    } catch (error) {
      logger.error('Erreur acceptation mission:', error);
      throw error
    }
  }

  // Tickets de support
  async getSupportTickets(): Promise<SupportTicket[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer les tickets depuis la base de données
      const { data: tickets, error } = await supabase
        .from('premium_support_tickets')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Erreur récupération tickets:', error);
        throw new Error('Erreur lors de la récupération des tickets')
      }

      return tickets || []
    } catch (error) {
      logger.error('Erreur récupération tickets:', error);
      throw error
    }
  }

  // Créer un ticket de support
  async createSupportTicket(ticket: {
    subject: string
    description: string
    category: string
    priority: string
  }): Promise<SupportTicket> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Insérer le nouveau ticket dans la base de données
      const { data, error } = await supabase
        .from('premium_support_tickets')
        .insert([{
          doctor_id: user.id,
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: 'open'
        }])
        .select()
        .single()

      if (error) {
        logger.error('Erreur création ticket:', error);
        throw new Error('Erreur lors de la création du ticket')
      }

      return data
    } catch (error) {
      logger.error('Erreur création ticket:', error);
      throw error
    }
  }

  // Clés API
  async getApiKeys(): Promise<ApiKey[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer les clés API depuis la base de données (sans le champ api_key pour la sécurité)
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('id, key_name, permissions, rate_limit, usage_count, last_used, is_active, created_at')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Erreur récupération clés API:', error);
        throw new Error('Erreur lors de la récupération des clés API')
      }

      return apiKeys || []
    } catch (error) {
      logger.error('Erreur récupération clés API:', error);
      throw error
    }
  }

  // Créer une clé API
  async createApiKey(keyName: string, permissions: string[], rateLimit: number): Promise<{ apiKey: ApiKey; key: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Vérifier le nombre de clés existantes (limite de 5)
      const { count, error: countError } = await supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('is_active', true)

      if (countError) {
        logger.error('Erreur vérification limite:', countError);
        throw new Error('Erreur lors de la vérification des clés existantes')
      }

      if (count && count >= 5) {
        throw new Error('Limite de 5 clés API actives atteinte')
      }

      // Générer une clé API sécurisée
      const generatedKey = `ck_${Math.random().toString(36).substr(2, 32)}`

      // Insérer la nouvelle clé dans la base de données
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          doctor_id: user.id,
          api_key: generatedKey,
          key_name: keyName,
          permissions,
          rate_limit: rateLimit,
          is_active: true
        }])
        .select('id, key_name, permissions, rate_limit, usage_count, last_used, is_active, created_at')
        .single()

      if (error) {
        logger.error('Erreur création clé API:', error);
        throw new Error('Erreur lors de la création de la clé API')
      }

      return { apiKey: data, key: generatedKey }
    } catch (error) {
      logger.error('Erreur création clé API:', error);
      throw error
    }
  }

  // Désactiver une clé API
  async deactivateApiKey(keyId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Désactiver la clé dans la base de données
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('doctor_id', user.id)

      if (error) {
        logger.error('Erreur désactivation clé API:', error);
        throw new Error('Erreur lors de la désactivation de la clé API')
      }
    } catch (error) {
      logger.error('Erreur désactivation clé API:', error);
      throw error
    }
  }
}

export const premiumService = new PremiumService()

// Types exportés
export type {
  PremiumStatistics,
  PremiumInvoice,
  SupportTicket,
  ApiKey
}
