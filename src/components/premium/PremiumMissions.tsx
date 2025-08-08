import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumMission, PremiumMissionFilter } from '@/types/premium';
import { PremiumMissionService } from '@/services/premiumMissions';
import { useAuth } from '@/hooks/useAuth';
import { 
  Crown, 
  MapPin, 
  Euro, 
  Clock, 
  AlertTriangle, 
  Users, 
  Star,
  Calendar,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const PremiumMissions: React.FC = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<PremiumMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PremiumMissionFilter>({});
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, [filters]);

  const loadMissions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await PremiumMissionService.getPremiumMissions(user.id, filters);
      setMissions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des missions Premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (missionId: string) => {
    if (!user) return;

    try {
      setApplyingTo(missionId);
      await PremiumMissionService.applyToPremiumMission(missionId, user.id);
      // Recharger les missions pour mettre à jour les statuts
      loadMissions();
    } catch (error) {
      console.error('Erreur lors de la candidature:', error);
      alert('Erreur lors de la candidature. Vérifiez votre abonnement Premium.');
    } finally {
      setApplyingTo(null);
    }
  };

  const formatSalary = (min: number, max: number) => {
    if (min === max) return `${min}€`;
    return `${min}€ - ${max}€`;
  };

  const getUrgencyColor = (urgency: string) => {
    return urgency === 'critical' ? 'destructive' : 'secondary';
  };

  const getTimeRemaining = (deadline: string) => {
    try {
      return formatDistanceToNow(parseISO(deadline), { 
        addSuffix: true, 
        locale: fr 
      });
    } catch {
      return 'Date invalide';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Crown className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-gray-600">Connectez-vous pour accéder aux missions exclusives Premium</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Missions Exclusives Premium
          </h1>
          <p className="text-gray-600 mt-1">
            Accès prioritaire aux missions les mieux rémunérées
          </p>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Zap className="h-4 w-4 mr-1" />
          Exclusif Premium
        </Badge>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Localisation"
              value={filters.location || ''}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Salaire minimum"
              value={filters.salary_min || ''}
              onChange={(e) => setFilters({...filters, salary_min: Number(e.target.value)})}
            />
            <Select
              value={filters.urgency || ''}
              onValueChange={(value) => setFilters({...filters, urgency: value as any})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available-only"
                checked={filters.available_spots_only || false}
                onChange={(e) => setFilters({...filters, available_spots_only: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="available-only" className="text-sm">
                Postes disponibles uniquement
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : missions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune mission exclusive disponible</h3>
            <p className="text-gray-600">
              Ajustez vos filtres ou revenez plus tard pour de nouvelles opportunités
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <Card key={mission.id} className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{mission.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {mission.location}
                    </div>
                  </div>
                  <Badge variant={getUrgencyColor(mission.urgency)}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {mission.urgency === 'critical' ? 'Urgent' : 'Prioritaire'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Établissement */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{mission.establishment_name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{mission.establishment_rating}/5</span>
                    </div>
                  </div>
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>

                {/* Détails mission */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatSalary(mission.salary_min, mission.salary_max)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{mission.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{mission.spots_available - mission.spots_filled} postes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{getTimeRemaining(mission.application_deadline)}</span>
                    </div>
                  </div>
                </div>

                {/* Avantages Premium */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Avantages exclusifs :</h4>
                  <div className="flex flex-wrap gap-1">
                    {mission.premium_perks.slice(0, 3).map((perk, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {perk}
                      </Badge>
                    ))}
                    {mission.premium_perks.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mission.premium_perks.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {mission.description}
                </p>

                {/* Action */}
                <Button 
                  className="w-full"
                  onClick={() => handleApply(mission.id)}
                  disabled={applyingTo === mission.id || mission.spots_filled >= mission.spots_available}
                >
                  {applyingTo === mission.id ? (
                    'Candidature en cours...'
                  ) : mission.spots_filled >= mission.spots_available ? (
                    'Complet'
                  ) : (
                    'Postuler en priorité'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumMissions;
