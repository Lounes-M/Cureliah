import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  coords: LocationCoords | null;
  error: string | null;
  loading: boolean;
  supported: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoStart?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { toast } = useToast();
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    autoStart = false
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: false,
    supported: !!navigator.geolocation
  });

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur',
        supported: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          error: null,
          loading: false,
          supported: true
        });
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation inconnue';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'L\'accès à la localisation a été refusé';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Les informations de localisation ne sont pas disponibles';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de localisation a expiré';
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));

        toast({
          title: "Erreur de géolocalisation",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  };

  // Auto-start si demandé
  useEffect(() => {
    if (autoStart && navigator.geolocation && !state.coords && !state.error) {
      getCurrentPosition();
    }
  }, [autoStart]);

  // Fonction pour calculer la distance entre deux points (formule haversine)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fonction pour obtenir les coordonnées d'une adresse via API de géocodage
  const geocodeAddress = async (address: string): Promise<LocationCoords | null> => {
    try {
      // Utilisation de l'API Nominatim (OpenStreetMap) - gratuite
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors du géocodage');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  return {
    ...state,
    getCurrentPosition,
    calculateDistance,
    geocodeAddress
  };
}

export default useGeolocation;
