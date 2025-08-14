import { useState, useEffect } from 'react'
import { premiumService, PremiumStatistics } from '../services/premiumService'

export const usePremiumStatistics = () => {
  const [statistics, setStatistics] = useState<PremiumStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await premiumService.getPremiumStatistics()
        setStatistics(data)
      } catch (err) {
        console.error('Erreur chargement statistiques:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [])

  return { statistics, loading, error }
}
