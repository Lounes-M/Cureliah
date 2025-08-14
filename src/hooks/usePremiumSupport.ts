import { useState, useEffect } from 'react'
import { premiumService, SupportTicket } from '../services/premiumService'

export const usePremiumSupport = () => {
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
      console.error('Erreur chargement tickets:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
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
      const newTicket = await premiumService.createSupportTicket(ticketData)
      setTickets(prev => [newTicket, ...prev])
      return newTicket
    } catch (err) {
      console.error('Erreur création ticket:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      throw err
    }
  }

  return { tickets, loading, error, createTicket, refreshTickets: loadTickets }
}
