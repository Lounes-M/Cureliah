import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumMission, PremiumMissionFilter } from '@/types/premium';
import { PremiumMissionService } from '@/services/premiumMissions';
import { useAuth } from '@/hooks/useAuth';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  Zap,
  Search,
  Filter
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
      // TODO: Replace with logger.error('Erreur lors du chargement des missions Premium:', error);
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
      // TODO: Replace with logger.error('Erreur lors de la candidature:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="text-center py-8">
              <Crown className="mx-auto h-16 w-16 text-yellow-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-4">Connexion requise</h2>
              <p className="text-gray-600 mb-6">Connectez-vous pour accéder aux missions exclusives Premium</p>
              <Button onClick={() => window.location.href = '/auth'} className="w-full">
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl shadow-lg flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Missions Exclusives Premium
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Accédez en priorité aux missions les mieux rémunérées et aux établissements les plus prestigieux. 
            Votre expertise mérite les meilleures opportunités.
          </p>
          <div className="flex items-center justify-center gap-6">
            <Badge variant="outline" className="text-yellow-600 border-yellow-600 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Exclusif Premium
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2">
              <Crown className="h-4 w-4 mr-2" />
              Accès prioritaire
            </Badge>
          </div>
        </div>

        {/* Filtres améliorés */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres de recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Localisation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ville ou région"
                    value={filters.location || ''}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Salaire minimum</label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Ex: 150"
                    value={filters.salary_min || ''}
                    onChange={(e) => setFilters({...filters, salary_min: Number(e.target.value)})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Urgence</label>
                <Select
                  value={filters.urgency || ''}
                  onValueChange={(value) => setFilters({...filters, urgency: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau d'urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.available_spots_only || false}
                    onChange={(e) => setFilters({...filters, available_spots_only: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Postes disponibles uniquement</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white/60">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : missions.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <Crown className="mx-auto h-20 w-20 text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Aucune mission exclusive disponible</h3>
              <p className="text-gray-600 text-lg mb-8">
                Ajustez vos filtres ou revenez plus tard pour de nouvelles opportunités Premium
              </p>
              <Button onClick={loadMissions} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Actualiser la recherche
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {missions.length} mission{missions.length > 1 ? 's' : ''} trouvée{missions.length > 1 ? 's' : ''}
              </h2>
              <Badge variant="secondary" className="px-3 py-1">
                Mis à jour maintenant
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {missions.map((mission) => (
                <Card key={mission.id} className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-l-4 border-l-yellow-500 relative overflow-hidden">
                  {/* Badge Premium sur la carte */}
                  <div className="absolute top-4 right-4 z-10">
                    <Crown className="h-5 w-5 text-yellow-500" />
                  </div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="pr-8">
                        <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                          {mission.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{mission.location}</span>
                        </div>
                      </div>
                      <Badge variant={getUrgencyColor(mission.urgency)} className="whitespace-nowrap">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {mission.urgency === 'critical' ? 'Urgent' : 'Prioritaire'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Établissement avec rating */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{mission.establishment_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{mission.establishment_rating}/5</span>
                          <span className="text-xs text-gray-500 ml-1">Excellent</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations financières et temporelles */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Euro className="h-5 w-5 text-green-600" />
                          <span className="font-bold text-green-700 text-lg">
                            {formatSalary(mission.salary_min, mission.salary_max)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">{mission.duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{mission.spots_available - mission.spots_filled} poste{mission.spots_available - mission.spots_filled > 1 ? 's' : ''} disponible{mission.spots_available - mission.spots_filled > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{getTimeRemaining(mission.application_deadline)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Avantages Premium */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Avantages exclusifs Premium
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {mission.premium_perks.slice(0, 3).map((perk, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {perk}
                          </Badge>
                        ))}
                        {mission.premium_perks.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-gray-50">
                            +{mission.premium_perks.length - 3} autres
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {mission.description}
                    </p>

                    {/* Bouton d'action */}
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 transition-all duration-200"
                      onClick={() => handleApply(mission.id)}
                      disabled={applyingTo === mission.id || mission.spots_filled >= mission.spots_available}
                    >
                      {applyingTo === mission.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Candidature en cours...
                        </>
                      ) : mission.spots_filled >= mission.spots_available ? (
                        'Complet - Liste d\'attente'
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Postuler en priorité Premium
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default PremiumMissions;
