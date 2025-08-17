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
import Logger from '@/utils/logger';

const logger = Logger.getInstance();

interface EstablishmentUrgentRequestsProps {
  establishmentId: string;
  refreshTrigger?: number;
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

export const EstablishmentUrgentRequests: React.FC<EstablishmentUrgentRequestsProps> = ({ 
  establishmentId,
  refreshTrigger = 0
}) => {
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
        logger.info('🔧 Tables manquantes, initialisation...', { establishmentId }, 'EstablishmentUrgentRequests', 'init_tables');
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
      logger.error('Erreur lors du chargement des demandes:', error as Error, { establishmentId }, 'EstablishmentUrgentRequests', 'load_data');
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
      <CreditBalance 
        variant="default" 
        showPurchaseButton={true} 
        refreshTrigger={refreshTrigger}
      />
      
      {/* Header avec statistiques */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <span>Demandes Urgentes</span>
          </h2>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">
            Gérez vos demandes urgentes de personnel médical
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
            className="whitespace-nowrap h-9 px-4 min-w-[120px] justify-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
          
          <CreateUrgentRequestModal 
            establishmentId={establishmentId} 
            onRequestCreated={loadData}
          />
        </div>
      </div>

      {/* Statistiques */}
            {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_requests}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.open_requests}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Complétées</p>
              <p className="text-2xl font-bold text-green-600">{stats.filled_requests}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(stats.fill_rate)}%</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
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
            <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges avec espacement optimisé */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={URGENCY_COLORS[request.urgency_level]}>
                        {URGENCY_ICONS[request.urgency_level]} 
                        <span className="ml-1">{request.urgency_level.toUpperCase()}</span>
                      </Badge>
                      <Badge className={STATUS_COLORS[request.status]}>
                        {request.status === 'open' && <Clock className="w-3 h-3 mr-1" />}
                        {request.status === 'in_progress' && <Settings className="w-3 h-3 mr-1" />}
                        {request.status === 'filled' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {request.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {request.status === 'expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                        <span>{request.status.replace('_', ' ').toUpperCase()}</span>
                      </Badge>
                      {request.featured && (
                        <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          <span>Vedette</span>
                        </Badge>
                      )}
                      {request.priority_boost && (
                        <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300">
                          <span className="mr-1">⚡</span>
                          <span>Priorité</span>
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-lg lg:text-xl mb-2 line-clamp-2 leading-tight">
                      {request.title}
                    </CardTitle>
                    
                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{formatTimeAgo(request.created_at)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{request.start_date} - {request.end_date}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right lg:text-right">
                    <div className="text-2xl font-bold text-medical-green mb-1">
                      {request.hourly_rate}€/h
                    </div>
                    <div className="text-sm text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md">
                      {getExpiresInText(request.expires_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                  {request.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700">{request.specialty_required}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">{request.start_time} - {request.end_time}</span>
                  </div>
                  {request.location && (
                    <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{request.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md">
                      <Eye className="w-3 h-3" />
                      <span>{request.view_count} vues</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md">
                      <Users className="w-3 h-3" />
                      <span>{request.response_count} candidats</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md">
                      <Euro className="w-3 h-3" />
                      <span>{request.total_budget ? `Budget: ${request.total_budget}€` : 'Budget libre'}</span>
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => setSelectedRequest(request)}
                    size="sm"
                    variant={request.responses.length > 0 ? "default" : "outline"}
                    className={`whitespace-nowrap min-w-[140px] h-9 ${
                      request.responses.length > 0 
                        ? "bg-medical-blue hover:bg-medical-blue-dark text-white" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {request.responses.length > 0 ? (
                      <>
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Candidats ({request.responses.length})</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Voir détails</span>
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
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Gestion de la demande urgente</h2>
                <p className="text-sm text-gray-600 mt-1">Consultez et gérez les candidatures reçues</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Détails de la demande - Improved Layout */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedRequest.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={URGENCY_COLORS[selectedRequest.urgency_level]}>
                        {URGENCY_ICONS[selectedRequest.urgency_level]} 
                        <span className="ml-1">{selectedRequest.urgency_level.toUpperCase()}</span>
                      </Badge>
                      <Badge className={STATUS_COLORS[selectedRequest.status]}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {selectedRequest.featured && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          <Star className="w-3 h-3 mr-1" />
                          Vedette
                        </Badge>
                      )}
                      {selectedRequest.priority_boost && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          ⚡ Priorité
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="text-3xl font-bold text-medical-green">
                      {selectedRequest.hourly_rate}€/h
                    </div>
                    <div className="text-sm text-red-600 font-medium bg-red-100 px-3 py-1 rounded-full mt-1">
                      {getExpiresInText(selectedRequest.expires_at)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed bg-white p-4 rounded-lg border border-gray-100">
                  {selectedRequest.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">Spécialité</span>
                    </div>
                    <p className="text-gray-700">{selectedRequest.specialty_required}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">Période</span>
                    </div>
                    <p className="text-gray-700">{selectedRequest.start_date} - {selectedRequest.end_date}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-gray-900">Horaires</span>
                    </div>
                    <p className="text-gray-700">{selectedRequest.start_time} - {selectedRequest.end_time}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-gray-900">Budget</span>
                    </div>
                    <p className="text-gray-700">
                      {selectedRequest.total_budget ? `${selectedRequest.total_budget}€ total` : 'Budget libre'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Liste des candidats - Enhanced */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Candidats ({selectedRequest.responses.length})</span>
                  </h4>
                  {selectedRequest.responses.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="bg-yellow-100 px-2 py-1 rounded-md">
                        {selectedRequest.responses.filter(r => r.status === 'pending').length} en attente
                      </span>
                      <span className="bg-green-100 px-2 py-1 rounded-md">
                        {selectedRequest.responses.filter(r => r.status === 'accepted').length} acceptés
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedRequest.responses.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun candidat pour le moment</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Les médecins qualifiés dans votre région recevront une notification automatique. 
                      Vous serez alerté dès qu'une candidature arrive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedRequest.responses.map((response) => (
                      <Card key={response.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1 space-y-4">
                              {/* En-tête du candidat */}
                              <div className="flex flex-wrap items-center gap-3">
                                <h5 className="text-xl font-bold text-gray-900">{response.doctor_name}</h5>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {response.doctor_specialty}
                                </Badge>
                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{response.doctor_rating}/5</span>
                                </div>
                                {response.doctor_distance_km && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    📍 {response.doctor_distance_km.toFixed(1)}km
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Détails de la candidature */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-gray-900">Disponibilité</span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    {new Date(response.availability_start).toLocaleDateString()} - {new Date(response.availability_end).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-gray-900">Type de réponse</span>
                                  </div>
                                  <div className="text-sm">
                                    {response.response_type === 'available' ? (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">✅ Disponible</span>
                                    ) : response.response_type === 'interested' ? (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">💡 Intéressé</span>
                                    ) : (
                                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md">🤔 Peut-être</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                    <span className="font-semibold text-gray-900">Réactivité</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{response.response_time} minutes</p>
                                </div>
                              </div>

                              {/* Négociation de tarif */}
                              {response.requested_rate && response.requested_rate !== selectedRequest.hourly_rate && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Euro className="w-4 h-4 text-amber-600" />
                                    <span className="font-semibold text-amber-800">Négociation de tarif</span>
                                  </div>
                                  <p className="text-sm text-amber-700">
                                    Tarif demandé: <span className="font-bold">{response.requested_rate}€/h</span> 
                                    (vs {selectedRequest.hourly_rate}€/h proposé)
                                  </p>
                                </div>
                              )}

                              {/* Message du candidat */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageCircle className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-gray-900">Message du candidat</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{response.message}</p>
                              </div>

                              {/* Notes privées */}
                              {response.notes && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageCircle className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-blue-800">Vos notes privées</span>
                                  </div>
                                  <p className="text-blue-700">{response.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-3 lg:min-w-[200px]">
                              {getResponseStatusBadge(response.status)}
                              {response.status === 'pending' && (
                                <div className="flex flex-col gap-2 w-full">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => handleResponseAction(response.id, 'rejected')}
                                    disabled={processingAction}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rejeter
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="w-full bg-medical-green hover:bg-medical-green-dark text-white"
                                    onClick={() => handleResponseAction(response.id, 'accepted')}
                                    disabled={processingAction}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
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

                {/* Section pour les notes d'action */}
                {selectedRequest.responses.some(r => r.status === 'pending') && (
                  <div className="mt-6 p-6 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <h6 className="font-semibold text-blue-900">Notes pour les candidats</h6>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Ces notes seront envoyées aux médecins lors de l'acceptation ou du rejet de leur candidature.
                    </p>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Ex: Merci pour votre candidature. Nous avons retenu votre profil pour cette mission d'urgence..."
                      className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      rows={3}
                    />
                    <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                      <span>💡</span>
                      <span>Un message personnalisé améliore la relation avec vos futurs partenaires</span>
                    </div>
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
