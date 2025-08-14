import { useState, useEffect } from 'react'
import { premiumService } from '../services/premiumService'
import type { PremiumMission } from '../types/premium'

export const usePremiumMissions = () => {
  const [missions, setMissions] = useState<PremiumMission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await premiumService.getPremiumMissions()
      setMissions(data)
    } catch (err) {
      console.error('Erreur chargement missions:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMissions()
  }, [])

  const acceptMission = async (missionId: string) => {
    try {
      await premiumService.acceptMission(missionId)
      // Recharger les missions après candidature
      await loadMissions()
    } catch (err) {
      console.error('Erreur candidature mission:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la candidature')
    }
  }

  return { missions, loading, error, acceptMission, refreshMissions: loadMissions }
}
