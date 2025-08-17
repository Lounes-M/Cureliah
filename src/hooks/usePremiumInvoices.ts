import { useState, useEffect } from 'react'
import { premiumService, PremiumInvoice } from '../services/premiumService'
import { logger } from "@/services/logger";

export const usePremiumInvoices = () => {
  const [invoices, setInvoices] = useState<PremiumInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await premiumService.getPremiumInvoices()
        setInvoices(data)
      } catch (err) {
        logger.error('Erreur chargement factures:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [])

  return { invoices, loading, error }
}
