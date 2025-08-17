import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  Clock, 
  MapPin, 
  Euro, 
  Star, 
  Eye,
  MessageCircle,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  Stethoscope,
  Zap,
  Crown,
  Search,
  TrendingUp,
  Users
} from 'lucide-react';
import { UrgentRequestService } from '@/services/urgentRequestService';
import { UrgentRequest, UrgentRequestResponse } from '@/types/premium';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from "@/services/logger";

interface PremiumDashboardUrgentRequestsProps {
  doctorId: string;
}

const URGENCY_COLORS = {
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  emergency: 'bg-red-100 text-red-800 border-red-300'
};

const URGENCY_ICONS = {
  medium: '⚠️',
  high: '🔥',
  critical: '🚨',
  emergency: '⚡'
};

const PRIORITY_STYLES = {
  medium: 'border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-white',
  high: 'border-l-4 border-orange-400 bg-gradient-to-r from-orange-50 to-white',
  critical: 'border-l-4 border-red-400 bg-gradient-to-r from-red-50 to-white',
  emergency: 'border-l-4 border-red-500 bg-gradient-to-r from-red-100 to-white shadow-lg'
};

export const PremiumDashboardUrgentRequests: React.FC<PremiumDashboardUrgentRequestsProps> = ({ doctorId }) => {
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [myResponses, setMyResponses] = useState<(UrgentRequestResponse & { request: UrgentRequest })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-responses'>('available');
  const [filters, setFilters] = useState({
    specialty: 'all',
    urgency_level: 'all',
    max_distance: '',
    min_rate: ''
  });
  const [selectedRequest, setSelectedRequest] = useState<UrgentRequest | null>(null);
  const [responseForm, setResponseForm] = useState({
    response_type: 'available' as 'interested' | 'available' | 'maybe',
    availability_start: '',
    availability_end: '',
    message: '',
    requested_rate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [doctorId, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Préparer les filtres en traitant "all" comme un filtre vide
      const processedFilters = {
        specialty: filters.specialty && filters.specialty !== 'all' ? filters.specialty : undefined,
        urgency_level: filters.urgency_level && filters.urgency_level !== 'all' ? filters.urgency_level : undefined,
        max_distance: filters.max_distance ? parseInt(filters.max_distance) : undefined,
        min_rate: filters.min_rate ? parseInt(filters.min_rate) : undefined
      };
      
      const [requests, responses] = await Promise.all([
        UrgentRequestService.getUrgentRequestsForDoctors(doctorId, processedFilters),
        UrgentRequestService.getDoctorResponses(doctorId)
      ]);
      
      setUrgentRequests(requests);
      setMyResponses(responses);
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;
    
    try {
      setSubmitting(true);
      
      await UrgentRequestService.respondToUrgentRequest(selectedRequest.id, doctorId, {
        response_type: responseForm.response_type,
        availability_start: responseForm.availability_start,
        availability_end: responseForm.availability_end,
        message: responseForm.message,
        requested_rate: responseForm.requested_rate ? parseInt(responseForm.requested_rate) : undefined
      });

      toast({
        title: "Candidature envoyée !",
        description: "Votre candidature a été transmise à l'établissement.",
      });

      setSelectedRequest(null);
      setResponseForm({
        response_type: 'available',
        availability_start: '',
        availability_end: '',
        message: '',
        requested_rate: ''
      });
      
      loadData(); // Recharger les données
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Missions disponibles</p>
                <p className="text-2xl font-bold text-blue-800">{urgentRequests.length}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Mes candidatures</p>
                <p className="text-2xl font-bold text-green-800">{myResponses.length}</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Missions VIP</p>
                <p className="text-2xl font-bold text-purple-800">
                  {urgentRequests.filter(r => r.priority_boost).length}
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Urgences</p>
                <p className="text-2xl font-bold text-amber-800">
                  {urgentRequests.filter(r => r.urgency_level === 'emergency' || r.urgency_level === 'critical').length}
                </p>
              </div>
              <div className="p-2 bg-amber-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres élégants */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-blue-600" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtre Spécialité */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Spécialité</label>
              <Select
                value={filters.specialty}
                onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Toutes les spécialités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les spécialités</SelectItem>
                  <SelectItem value="Médecine générale">Médecine générale</SelectItem>
                  <SelectItem value="Médecine d'urgence">Médecine d'urgence</SelectItem>
                  <SelectItem value="Cardiologie">Cardiologie</SelectItem>
                  <SelectItem value="Anesthésie-Réanimation">Anesthésie-Réanimation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Urgence */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Niveau d'urgence</label>
              <Select
                value={filters.urgency_level}
                onValueChange={(value) => setFilters(prev => ({ ...prev, urgency_level: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="emergency">⚡ Urgence absolue</SelectItem>
                  <SelectItem value="critical">🚨 Critique</SelectItem>
                  <SelectItem value="high">🔥 Élevé</SelectItem>
                  <SelectItem value="medium">⚠️ Modéré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Distance */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Distance max (km)</label>
              <Input
                type="number"
                placeholder="ex: 50"
                className="h-10"
                value={filters.max_distance}
                onChange={(e) => setFilters(prev => ({ ...prev, max_distance: e.target.value }))}
              />
            </div>

            {/* Filtre Tarif */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tarif min (€/h)</label>
              <Input
                type="number"
                placeholder="ex: 80"
                className="h-10"
                value={filters.min_rate}
                onChange={(e) => setFilters(prev => ({ ...prev, min_rate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Missions disponibles
          </TabsTrigger>
          <TabsTrigger value="my-responses" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Mes candidatures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Chargement des missions...</span>
              </div>
            </div>
          ) : urgentRequests.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune mission disponible</h3>
              <p className="text-gray-500">Aucune mission ne correspond à vos critères actuels.</p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {urgentRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className={`transition-all hover:shadow-lg ${PRIORITY_STYLES[request.urgency_level] || 'border-l-4 border-gray-300'}`}
                >
                  <CardContent className="p-6">
                    {/* Header de la mission */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {request.specialty_required}
                            </h3>
                            <Badge className={`${URGENCY_COLORS[request.urgency_level]} font-medium`}>
                              {URGENCY_ICONS[request.urgency_level]} {request.urgency_level.toUpperCase()}
                            </Badge>
                            {request.priority_boost && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                VIP Boost
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {request.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {request.hourly_rate}€/h
                        </div>
                        <div className="text-sm text-gray-500">
                          Temps estimé
                        </div>
                      </div>
                    </div>

                    {/* Informations de l'établissement */}
                    <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          {request.establishment_name || 'Établissement'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm text-gray-600">
                            {request.establishment_rating || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{request.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          {new Date(request.start_time).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(request.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Expire dans {Math.ceil((new Date(request.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))}h</span>
                        <span>•</span>
                        <span>Publié il y a {Math.floor((Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60))}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Postuler
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                                Candidater à cette mission
                              </DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-6 py-4">
                                {/* Récapitulatif mission */}
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <h4 className="font-semibold text-blue-800 mb-2">Récapitulatif de la mission</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-blue-700">Spécialité:</span>
                                      <span className="font-medium">{selectedRequest.specialty_required}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-700">Lieu:</span>
                                      <span className="font-medium">{selectedRequest.location}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-700">Tarif:</span>
                                      <span className="font-medium text-green-600">{selectedRequest.hourly_rate}€/h</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-700">Durée:</span>
                                      <span className="font-medium">Variable</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium">Type de réponse</label>
                                    <Select
                                      value={responseForm.response_type}
                                      onValueChange={(value) => setResponseForm(prev => ({ ...prev, response_type: value as any }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="available">✅ Disponible immédiatement</SelectItem>
                                        <SelectItem value="interested">💡 Intéressé(e) - à discuter</SelectItem>
                                        <SelectItem value="maybe">🤔 Peut-être - sous conditions</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium">Tarif souhaité (€/h)</label>
                                    <Input
                                      type="number"
                                      placeholder={selectedRequest.hourly_rate.toString()}
                                      value={responseForm.requested_rate}
                                      onChange={(e) => setResponseForm(prev => ({ ...prev, requested_rate: e.target.value }))}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium">Disponible du</label>
                                    <Input
                                      type="datetime-local"
                                      value={responseForm.availability_start}
                                      onChange={(e) => setResponseForm(prev => ({ ...prev, availability_start: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium">Jusqu'au</label>
                                    <Input
                                      type="datetime-local"
                                      value={responseForm.availability_end}
                                      onChange={(e) => setResponseForm(prev => ({ ...prev, availability_end: e.target.value }))}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">Message personnel</label>
                                  <Textarea
                                    placeholder="Présentez votre motivation et votre expérience..."
                                    rows={4}
                                    value={responseForm.message}
                                    onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                    Annuler
                                  </Button>
                                  <Button 
                                    onClick={handleSubmitResponse}
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                  >
                                    {submitting ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Envoi...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Envoyer ma candidature
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-responses" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Chargement de vos candidatures...</span>
              </div>
            </div>
          ) : myResponses.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune candidature</h3>
              <p className="text-gray-500">Vous n'avez encore postulé à aucune mission.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myResponses.map((response) => (
                <Card key={response.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {response.request?.specialty_required}
                        </h3>
                        <p className="text-gray-600 mb-2">{response.request?.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {response.request?.establishment_name || 'Établissement'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {response.request?.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="w-4 h-4" />
                            {response.request?.hourly_rate}€/h
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            response.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            response.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {response.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {response.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {response.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {response.status === 'pending' ? 'En attente' :
                           response.status === 'accepted' ? 'Acceptée' :
                           response.status === 'rejected' ? 'Refusée' : response.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(response.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    {response.message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 italic">"{response.message}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PremiumDashboardUrgentRequests;
