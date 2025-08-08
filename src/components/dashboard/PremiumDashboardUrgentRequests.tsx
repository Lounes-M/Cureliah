import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Stethoscope
} from 'lucide-react';
import { UrgentRequestService } from '@/services/urgentRequestService';
import { UrgentRequest, UrgentRequestResponse } from '@/types/premium';
import { useToast } from '@/hooks/use-toast';

interface PremiumDashboardUrgentRequestsProps {
  doctorId: string;
}

const URGENCY_COLORS = {
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  emergency: 'bg-red-200 text-red-900 border-red-300'
};

const URGENCY_ICONS = {
  medium: '⚠️',
  high: '🔥',
  critical: '🚨',
  emergency: '⚡'
};

export const PremiumDashboardUrgentRequests: React.FC<PremiumDashboardUrgentRequestsProps> = ({ doctorId }) => {
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [myResponses, setMyResponses] = useState<(UrgentRequestResponse & { request: UrgentRequest })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-responses'>('available');
  const [filters, setFilters] = useState({
    specialty: '',
    urgency_level: '',
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
    // Actualiser toutes les 2 minutes pour les nouvelles demandes urgentes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [doctorId, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, responses] = await Promise.all([
        UrgentRequestService.getUrgentRequestsForDoctors(doctorId, {
          ...filters,
          max_distance: filters.max_distance ? parseInt(filters.max_distance) : undefined,
          min_rate: filters.min_rate ? parseInt(filters.min_rate) : undefined
        }),
        UrgentRequestService.getDoctorResponses(doctorId)
      ]);
      
      setUrgentRequests(requests);
      setMyResponses(responses);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes urgentes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes urgentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = async (request: UrgentRequest) => {
    setSelectedRequest(request);
    // Marquer comme vue
    try {
      await UrgentRequestService.markRequestAsViewed(request.id);
    } catch (error) {
      console.error('Erreur lors du marquage comme vue:', error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;
    
    setSubmitting(true);
    try {
      // Validation
      if (!responseForm.availability_start || !responseForm.availability_end) {
        throw new Error('Veuillez spécifier vos créneaux de disponibilité');
      }

      if (!responseForm.message.trim()) {
        throw new Error('Veuillez ajouter un message');
      }

      const responseData = {
        response_type: responseForm.response_type,
        availability_start: responseForm.availability_start,
        availability_end: responseForm.availability_end,
        message: responseForm.message.trim(),
        requested_rate: responseForm.requested_rate ? parseFloat(responseForm.requested_rate) : undefined
      };

      await UrgentRequestService.respondToUrgentRequest(selectedRequest.id, doctorId, responseData);
      
      toast({
        title: "Réponse envoyée !",
        description: "Votre réponse a été transmise à l'établissement",
        variant: "default",
      });

      // Réinitialiser le formulaire
      setResponseForm({
        response_type: 'available',
        availability_start: '',
        availability_end: '',
        message: '',
        requested_rate: ''
      });
      
      setSelectedRequest(null);
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getExpiresInText = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffInMinutes = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes <= 0) return 'Expiré';
    if (diffInMinutes < 60) return `${diffInMinutes}min restantes`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h restantes`;
    return `${Math.floor(diffInMinutes / 1440)}j restants`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Chargement des demandes urgentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            Demandes Urgentes
          </h2>
          <p className="text-gray-600 mt-1">
            Répondez rapidement aux besoins urgents des établissements
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtres</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.specialty}
              onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les spécialités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les spécialités</SelectItem>
                <SelectItem value="Médecine générale">Médecine générale</SelectItem>
                <SelectItem value="Médecine d'urgence">Médecine d'urgence</SelectItem>
                <SelectItem value="Cardiologie">Cardiologie</SelectItem>
                <SelectItem value="Anesthésie-Réanimation">Anesthésie-Réanimation</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.urgency_level}
              onValueChange={(value) => setFilters(prev => ({ ...prev, urgency_level: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les niveaux</SelectItem>
                <SelectItem value="emergency">⚡ Urgence absolue</SelectItem>
                <SelectItem value="critical">🚨 Critique</SelectItem>
                <SelectItem value="high">🔥 Élevé</SelectItem>
                <SelectItem value="medium">⚠️ Modéré</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Distance max (km)"
              value={filters.max_distance}
              onChange={(e) => setFilters(prev => ({ ...prev, max_distance: e.target.value }))}
            />

            <Input
              placeholder="Tarif min (€/h)"
              value={filters.min_rate}
              onChange={(e) => setFilters(prev => ({ ...prev, min_rate: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'available' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('available')}
          className="rounded-md"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Disponibles ({urgentRequests.length})
        </Button>
        <Button
          variant={activeTab === 'my-responses' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('my-responses')}
          className="rounded-md"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Mes réponses ({myResponses.length})
        </Button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {urgentRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande urgente</h3>
                <p className="text-gray-600">
                  Aucune demande urgente ne correspond à vos critères actuellement.
                </p>
              </CardContent>
            </Card>
          ) : (
            urgentRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={URGENCY_COLORS[request.urgency_level]}>
                          {URGENCY_ICONS[request.urgency_level]} {request.urgency_level.toUpperCase()}
                        </Badge>
                        {request.featured && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Star className="w-3 h-3 mr-1" />
                            Vedette
                          </Badge>
                        )}
                        {request.priority_boost && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            ⚡ Priorité
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mb-1">{request.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {request.establishment_name || 'Établissement'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-4 h-4" />
                          {request.specialty_required}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(request.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {request.hourly_rate}€/h
                      </div>
                      <div className="text-xs text-red-600 font-medium">
                        {getExpiresInText(request.expires_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-2">{request.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{request.start_date} - {request.end_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{request.start_time} - {request.end_time}</span>
                    </div>
                    {request.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{request.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {request.view_count} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {request.response_count} réponses
                      </span>
                    </div>
                    <Button
                      onClick={() => handleViewRequest(request)}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Répondre
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'my-responses' && (
        <div className="space-y-4">
          {myResponses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réponse</h3>
                <p className="text-gray-600">
                  Vous n'avez pas encore répondu à des demandes urgentes.
                </p>
              </CardContent>
            </Card>
          ) : (
            myResponses.map((response) => (
              <Card key={response.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{response.request.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <Badge 
                          className={
                            response.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            response.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {response.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {response.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {response.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {response.status === 'accepted' ? 'Acceptée' : 
                           response.status === 'rejected' ? 'Rejetée' : 'En attente'}
                        </Badge>
                        <span>Répondu il y a {formatTimeAgo(response.created_at)}</span>
                        <span>Temps de réponse: {response.response_time}min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {response.requested_rate || response.request.hourly_rate}€/h
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <h4 className="font-medium text-sm mb-2">Votre message :</h4>
                    <p className="text-sm text-gray-700">{response.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Disponible: {response.availability_start} - {response.availability_end}</span>
                    <span>Type: {response.response_type}</span>
                    {response.doctor_distance_km && (
                      <span>Distance: {response.doctor_distance_km.toFixed(1)}km</span>
                    )}
                  </div>

                  {response.notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Note de l'établissement :</h4>
                      <p className="text-sm text-gray-700">{response.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal de réponse à une demande urgente */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Répondre à la demande urgente
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Détails de la demande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{selectedRequest.title}</h3>
                  <Badge className={URGENCY_COLORS[selectedRequest.urgency_level]}>
                    {URGENCY_ICONS[selectedRequest.urgency_level]} {selectedRequest.urgency_level.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-700 mb-3">{selectedRequest.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Spécialité:</span> {selectedRequest.specialty_required}
                  </div>
                  <div>
                    <span className="font-medium">Rémunération:</span> {selectedRequest.hourly_rate}€/h
                  </div>
                  <div>
                    <span className="font-medium">Période:</span> {selectedRequest.start_date} - {selectedRequest.end_date}
                  </div>
                  <div>
                    <span className="font-medium">Horaires:</span> {selectedRequest.start_time} - {selectedRequest.end_time}
                  </div>
                  {selectedRequest.location && (
                    <div className="col-span-2">
                      <span className="font-medium">Lieu:</span> {selectedRequest.location}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm">
                  {selectedRequest.equipment_provided && (
                    <Badge variant="outline">Équipement fourni</Badge>
                  )}
                  {selectedRequest.transport_provided && (
                    <Badge variant="outline">Transport fourni</Badge>
                  )}
                  {selectedRequest.accommodation_provided && (
                    <Badge variant="outline">Hébergement fourni</Badge>
                  )}
                </div>
              </div>

              {/* Formulaire de réponse */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de réponse</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Disponible du</label>
                    <Input
                      type="datetime-local"
                      value={responseForm.availability_start}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, availability_start: e.target.value }))}
                      min={new Date().toISOString().slice(0, -8)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jusqu'au</label>
                    <Input
                      type="datetime-local"
                      value={responseForm.availability_end}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, availability_end: e.target.value }))}
                      min={responseForm.availability_start || new Date().toISOString().slice(0, -8)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tarif souhaité (€/h) - Optionnel</label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={responseForm.requested_rate}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, requested_rate: e.target.value }))}
                    placeholder={`Proposé: ${selectedRequest.hourly_rate}€/h`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message de motivation *</label>
                  <Textarea
                    value={responseForm.message}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Décrivez brièvement votre expérience pertinente, votre motivation et vos disponibilités..."
                    className="h-24"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={submitting || !responseForm.message.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Envoyer la réponse
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PremiumDashboardUrgentRequests;
