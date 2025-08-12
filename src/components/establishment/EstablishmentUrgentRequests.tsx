import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertCircle, 
  Clock, 
  MapPin, 
  Euro, 
  Star, 
  Eye,
  MessageCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
  Settings
} from 'lucide-react';
import { CreateUrgentRequestModal } from './CreateUrgentRequestModal';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { UrgentRequestService } from '@/services/urgentRequestService';
import { UrgentRequest, UrgentRequestResponse } from '@/types/premium';
import { useToast } from '@/hooks/use-toast';
import { checkTablesExist, createUrgentRequestsTables } from '@/utils/initUrgentTables';

interface EstablishmentUrgentRequestsProps {
  establishmentId: string;
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

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  filled: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800'
};

export const EstablishmentUrgentRequests: React.FC<EstablishmentUrgentRequestsProps> = ({ establishmentId }) => {
  const [requests, setRequests] = useState<(UrgentRequest & { responses: UrgentRequestResponse[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<(UrgentRequest & { responses: UrgentRequestResponse[] }) | null>(null);
  const [stats, setStats] = useState({
    total_requests: 0,
    open_requests: 0,
    recent_requests: 0,
    filled_requests: 0,
    fill_rate: 0
  });
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // Actualiser toutes les 3 minutes
    const interval = setInterval(loadData, 180000);
    return () => clearInterval(interval);
  }, [establishmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Vérifier si les tables existent, sinon les créer
      const tablesExist = await checkTablesExist();
      if (!tablesExist) {
        // TODO: Replace with logger.info('🔧 Tables manquantes, initialisation...');
        toast({
          title: "Initialisation",
          description: "Mise en place du système de demandes urgentes...",
          variant: "default",
        });
        
        const success = await createUrgentRequestsTables();
        if (!success) {
          throw new Error('Impossible de créer les tables nécessaires');
        }
        
        toast({
          title: "Succès",
          description: "Système de demandes urgentes initialisé avec succès !",
          variant: "default",
        });
      }
      
      const [requestsData, statsData] = await Promise.all([
        UrgentRequestService.getEstablishmentRequests(establishmentId),
        UrgentRequestService.getUrgentRequestStats(establishmentId)
      ]);
      
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      // TODO: Replace with logger.error('Erreur lors du chargement des demandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes urgentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseAction = async (responseId: string, status: 'accepted' | 'rejected') => {
    setProcessingAction(true);
    try {
      await UrgentRequestService.updateResponseStatus(
        responseId, 
        establishmentId, 
        status, 
        actionNotes.trim() || undefined
      );
      
      toast({
        title: status === 'accepted' ? "Réponse acceptée" : "Réponse rejetée",
        description: status === 'accepted' 
          ? "Le médecin a été notifié de l'acceptation de sa candidature"
          : "Le médecin a été informé que sa candidature n'a pas été retenue",
        variant: "default",
      });

      setActionNotes('');
      setSelectedRequest(null);
      loadData(); // Recharger les données
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter la réponse",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
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

  const getResponseStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Acceptée</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Chargement de vos demandes urgentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solde de crédits */}
      <CreditBalance variant="default" showPurchaseButton={true} />
      
      {/* Header avec statistiques */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            Demandes Urgentes
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez vos demandes urgentes de personnel médical
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
            className="whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <CreateUrgentRequestModal 
            establishmentId={establishmentId} 
            onRequestCreated={loadData}
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total demandes</p>
                <p className="text-2xl font-bold">{stats.total_requests}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ouvertes</p>
                <p className="text-2xl font-bold text-medical-green">{stats.open_requests}</p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Récentes (24h)</p>
                <p className="text-2xl font-bold text-medical-blue">{stats.recent_requests}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de succès</p>
                <p className="text-2xl font-bold text-purple-600">{stats.fill_rate.toFixed(0)}%</p>
              </div>
              <Star className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande urgente</h3>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas encore créé de demandes urgentes.
              </p>
              <CreateUrgentRequestModal 
                establishmentId={establishmentId} 
                onRequestCreated={loadData}
                triggerButton={
                  <Button className="bg-red-600 hover:bg-red-700">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Créer ma première demande urgente
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={URGENCY_COLORS[request.urgency_level]}>
                        {URGENCY_ICONS[request.urgency_level]} {request.urgency_level.toUpperCase()}
                      </Badge>
                      <Badge className={STATUS_COLORS[request.status]}>
                        {request.status === 'open' && <Clock className="w-3 h-3 mr-1" />}
                        {request.status === 'in_progress' && <Settings className="w-3 h-3 mr-1" />}
                        {request.status === 'filled' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {request.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {request.status === 'expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {request.status.replace('_', ' ').toUpperCase()}
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
                        <Clock className="w-4 h-4" />
                        {formatTimeAgo(request.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {request.start_date} - {request.end_date}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-medical-green">
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
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span>{request.specialty_required}</span>
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
                      <Users className="w-3 h-3" />
                      {request.response_count} candidats
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      {request.total_budget ? `Budget: ${request.total_budget}€` : 'Budget libre'}
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => setSelectedRequest(request)}
                    size="sm"
                    variant={request.responses.length > 0 ? "default" : "outline"}
                    className={request.responses.length > 0 ? "bg-medical-blue hover:bg-medical-blue-dark" : ""}
                  >
                    {request.responses.length > 0 ? (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Voir les candidats ({request.responses.length})
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir les détails
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de gestion des réponses */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Gestion de la demande urgente
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Détails de la demande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">{selectedRequest.title}</h3>
                  <div className="flex gap-2">
                    <Badge className={URGENCY_COLORS[selectedRequest.urgency_level]}>
                      {URGENCY_ICONS[selectedRequest.urgency_level]} {selectedRequest.urgency_level.toUpperCase()}
                    </Badge>
                    <Badge className={STATUS_COLORS[selectedRequest.status]}>
                      {selectedRequest.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{selectedRequest.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Spécialité:</span><br />
                    {selectedRequest.specialty_required}
                  </div>
                  <div>
                    <span className="font-medium">Période:</span><br />
                    {selectedRequest.start_date} - {selectedRequest.end_date}
                  </div>
                  <div>
                    <span className="font-medium">Horaires:</span><br />
                    {selectedRequest.start_time} - {selectedRequest.end_time}
                  </div>
                  <div>
                    <span className="font-medium">Rémunération:</span><br />
                    {selectedRequest.hourly_rate}€/h
                  </div>
                </div>
              </div>

              {/* Liste des candidats */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Candidats ({selectedRequest.responses.length})
                </h4>
                
                {selectedRequest.responses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun candidat pour le moment</h3>
                    <p className="text-gray-600">Les médecins qualifiés recevront une notification.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedRequest.responses.map((response) => (
                      <Card key={response.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-semibold text-lg">{response.doctor_name}</h5>
                                <Badge variant="outline">{response.doctor_specialty}</Badge>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm">{response.doctor_rating}/5</span>
                                </div>
                                {response.doctor_distance_km && (
                                  <Badge variant="outline" className="text-xs">
                                    📍 {response.doctor_distance_km.toFixed(1)}km
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                <div>
                                  <span className="font-medium">Disponible:</span><br />
                                  {new Date(response.availability_start).toLocaleString()} - {new Date(response.availability_end).toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-medium">Type de réponse:</span><br />
                                  {response.response_type === 'available' ? '✅ Disponible' :
                                   response.response_type === 'interested' ? '💡 Intéressé' : '🤔 Peut-être'}
                                </div>
                                <div>
                                  <span className="font-medium">Temps de réponse:</span><br />
                                  {response.response_time} minutes
                                </div>
                              </div>

                              {response.requested_rate && response.requested_rate !== selectedRequest.hourly_rate && (
                                <div className="bg-yellow-50 p-2 rounded mb-3">
                                  <span className="text-sm font-medium text-yellow-800">
                                    Tarif demandé: {response.requested_rate}€/h (vs {selectedRequest.hourly_rate}€/h proposé)
                                  </span>
                                </div>
                              )}

                              <div className="bg-gray-50 p-3 rounded">
                                <h6 className="font-medium text-sm mb-1">Message du candidat :</h6>
                                <p className="text-sm text-gray-700">{response.message}</p>
                              </div>

                              {response.notes && (
                                <div className="mt-2 p-3 bg-blue-50 rounded">
                                  <h6 className="font-medium text-sm mb-1">Vos notes :</h6>
                                  <p className="text-sm text-gray-700">{response.notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {getResponseStatusBadge(response.status)}
                              {response.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => {
                                      // Ouvrir un dialog pour la rejection avec notes
                                      handleResponseAction(response.id, 'rejected');
                                    }}
                                    disabled={processingAction}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rejeter
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-medical-green hover:bg-medical-green-dark"
                                    onClick={() => handleResponseAction(response.id, 'accepted')}
                                    disabled={processingAction}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Accepter
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Notes pour accepter/rejeter */}
                {selectedRequest.responses.some(r => r.status === 'pending') && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-blue-50">
                    <h6 className="font-medium text-sm mb-2">Notes optionnelles (seront envoyées au médecin) :</h6>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Ex: Merci pour votre candidature. Nous avons retenu votre profil pour cette mission..."
                      className="bg-white"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EstablishmentUrgentRequests;
