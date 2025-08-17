import { useState, useEffect } from 'react'
import { premiumService, ApiKey } from '../services/premiumService'
import { logger } from "@/services/logger";

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await premiumService.getApiKeys()
      setApiKeys(data)
    } catch (err) {
      logger.error('Erreur chargement clés API:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApiKeys()
  }, [])

  const createApiKey = async (keyName: string, permissions: string[], rateLimit: number) => {
    try {
      const result = await premiumService.createApiKey(keyName, permissions, rateLimit)
      setApiKeys(prev => [result.apiKey, ...prev])
      return result
    } catch (err) {
      logger.error('Erreur création clé API:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      throw err
    }
  }

  const deactivateApiKey = async (keyId: string) => {
    try {
      await premiumService.deactivateApiKey(keyId)
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: false } : key
      ))
    } catch (err) {
      logger.error('Erreur désactivation clé API:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la désactivation')
    }
  }

  return { apiKeys, loading, error, createApiKey, deactivateApiKey, refreshApiKeys: loadApiKeys }
}
