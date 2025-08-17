import { useState, useEffect } from 'react'
import { premiumService } from '../services/premiumService'
import { logger } from "@/services/logger";

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

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await premiumService.getSupportTickets()
      setTickets(data)
    } catch (err) {
      logger.error('Erreur chargement tickets:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setTickets([]) // Fallback vers tableau vide
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const createTicket = async (ticketData: {
    subject: string
    description: string
    category: string
    priority: string
  }) => {
    try {
      await premiumService.createSupportTicket(ticketData)
      // Recharger les tickets après création
      await loadTickets()
    } catch (err) {
      logger.error('Erreur création ticket:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    }
  }

  return { tickets, loading, error, createTicket, refreshTickets: loadTickets }
}
