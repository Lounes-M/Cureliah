import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Building2, MessageCircle, ChevronDown, ChevronUp, Filter, Clock, Phone, Mail, User, Globe, MapIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from './MessagingModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { logger } from "@/services/logger";

// Fonction de formatage des dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface EstablishmentInfo {
  id: string;
  name: string;
  establishment_type: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  first_name: string;
  last_name: string;
}

interface VacationPost {
  id: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  act_type: string;
}

interface BookingWithDetails {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  booking_date: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  contact_phone: string;
  duration_hours: number;
  created_at: string;
  establishment_id: string;
  payment_status?: string;
  vacation_post: VacationPost;
  establishment_info: EstablishmentInfo | null;
}

interface BookingManagementProps {
  status?: string;
}

const BookingManagement = ({ status }: BookingManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    dateRange: 'all',
    establishmentType: 'all',
    city: '',
    status: status || 'all'
  });

  // Fonctions utilitaires pour les badges de paiement
  const getPaymentStatusColor = (paymentStatus: string | undefined, bookingStatus: string) => {
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'completed') {
      return '';
    }
    
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getPaymentStatusText = (paymentStatus: string | undefined, bookingStatus: string) => {
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'completed') {
      return '';
    }
    
    switch (paymentStatus) {
      case 'paid': return '✅ Payé';
      case 'failed': return '❌ Échec paiement';
      case 'pending':
      default: return '⏳ En attente';
    }
  };

  const shouldShowPaymentBadge = (paymentStatus: string | undefined, bookingStatus: string) => {
    return ['confirmed', 'completed'].includes(bookingStatus);
  };

  // Fonction pour basculer l'état étendu d'une carte
  const toggleCardExpansion = (bookingId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Fonction pour obtenir l'icône du type d'établissement
  const getEstablishmentTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'clinic': return '🏥';
      case 'private_practice': return '👨‍⚕️';
      case 'medical_center': return '🏥';
      default: return '🏢';
    }
  };

  // Fonction pour obtenir le label du type d'établissement
  const getEstablishmentTypeLabel = (type: string) => {
    switch (type) {
      case 'hospital': return 'Hôpital';
      case 'clinic': return 'Clinique';
      case 'private_practice': return 'Cabinet privé';
      case 'medical_center': return 'Centre médical';
      default: return 'Établissement';
    }
  };

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      logger.info('🔍 Fetching bookings for doctor:', user.id);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          vacation_posts (
            id,
            title,
            location,
            start_date,
            end_date,
            hourly_rate,
            act_type
          )
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status !== 'all') {
        const statusList = filters.status.split(',');
        if (statusList.length > 1) {
          query = query.in('status', statusList);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (status && status !== 'all') {
        const statusList = status.split(',');
        if (statusList.length > 1) {
          query = query.in('status', statusList);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        logger.error('❌ Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      logger.info('📦 Raw bookings data:', bookingsData);

      if (!bookingsData || bookingsData.length === 0) {
        logger.info('📭 No bookings found');
        setBookings([]);
        return;
      }

      logger.info(`✅ Found ${bookingsData.length} bookings`);

      // Get establishment IDs
      const establishmentIds = [...new Set(bookingsData.map(booking => booking.establishment_id))];
      logger.info('🏥 Establishment IDs to fetch:', establishmentIds);
      
      // Récupérer plus d'informations sur les établissements
      const { data: establishments, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .select('id, name, establishment_type, city, address, phone, email, website, description')
        .in('id', establishmentIds);

      if (establishmentError) {
        logger.error('❌ Error fetching establishment profiles:', establishmentError);
      }

      logger.info('🏥 Establishment profiles found:', establishments);

      // Combine the data
      const combinedBookings = bookingsData.map(booking => {
        const establishment = establishments?.find(e => e.id === booking.establishment_id);
        
        let establishmentInfo = null;
        
        if (establishment) {
          establishmentInfo = {
            id: establishment.id,
            name: establishment.name,
            establishment_type: establishment.establishment_type,
            city: establishment.city,
            address: establishment.address,
            phone: establishment.phone,
            email: establishment.email,
            website: establishment.website,
            first_name: '',
            last_name: ''
          };
          logger.info('✅ Found establishment:', establishment.name);
        } else {
          establishmentInfo = {
            id: booking.establishment_id,
            name: 'Établissement inconnu',
            establishment_type: 'Non spécifié',
            city: 'Non spécifié',
            first_name: '',
            last_name: ''
          };
          logger.info('⚠️ Establishment not found for ID:', booking.establishment_id);
        }
        
        return {
          ...booking,
          vacation_post: booking.vacation_posts,
          establishment_info: establishmentInfo
        };
      });

      // Apply additional filters
      let filteredBookings = combinedBookings;

      if (filters.dateRange !== 'all') {
        const now = new Date();
        filteredBookings = filteredBookings.filter(booking => {
          const startDate = new Date(booking.vacation_post.start_date);
          switch (filters.dateRange) {
            case 'upcoming':
              return startDate > now;
            case 'past':
              return startDate < now;
            case 'current':
              return startDate <= now && new Date(booking.vacation_post.end_date) >= now;
            default:
              return true;
          }
        });
      }

      if (filters.establishmentType !== 'all') {
        filteredBookings = filteredBookings.filter(booking => 
          booking.establishment_info?.establishment_type === filters.establishmentType
        );
      }

      if (filters.city) {
        filteredBookings = filteredBookings.filter(booking => 
          booking.establishment_info?.city.toLowerCase().includes(filters.city.toLowerCase())
        );
      }

      setBookings(filteredBookings);
    } catch (error: any) {
      logger.error('Error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du chargement des réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user, filters]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Statut de la réservation mis à jour : ${getStatusBadge(newStatus)}`
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || `Erreur lors de la mise à jour du statut (${newStatus})`,
        variant: 'destructive'
      });
    }
  };

  // Badge de statut de réservation
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Terminée', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
      rejected: { label: 'Rejetée', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      low: { label: 'Faible', className: 'bg-green-100 text-green-700' },
      medium: { label: 'Normal', className: 'bg-orange-100 text-orange-700' },
      high: { label: 'Urgent', className: 'bg-red-100 text-red-700' }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || { label: urgency, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
          <CardDescription>Filtrer vos réservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="upcoming">À venir</SelectItem>
                <SelectItem value="current">En cours</SelectItem>
                <SelectItem value="past">Passées</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.establishmentType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, establishmentType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type d'établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="hospital">Hôpital</SelectItem>
                <SelectItem value="clinic">Clinique</SelectItem>
                <SelectItem value="private_practice">Cabinet privé</SelectItem>
                <SelectItem value="medical_center">Centre médical</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Ville"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            />

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
            <p className="text-gray-600">
              {filters.status !== 'all' || filters.dateRange !== 'all' || filters.city || filters.establishmentType !== 'all'
                ? 'Aucune réservation ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore de réservations.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isExpanded = expandedCards.has(booking.id);
            
            return (
              <Card key={booking.id} className="mb-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {booking.vacation_post?.title || 'Vacation'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {getStatusBadge(booking.status)}
                      {shouldShowPaymentBadge(booking.payment_status, booking.status) && (
                        <Badge className={getPaymentStatusColor(booking.payment_status, booking.status) + ' border'}>
                          {getPaymentStatusText(booking.payment_status, booking.status)}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end space-y-2">
                      {/* Badge de statut de réservation */}
                      {getStatusBadge(booking.status)}
                      
                      {/* Badge de statut de paiement */}
                      {shouldShowPaymentBadge(booking.payment_status, booking.status) && (
                        <Badge className={`${getPaymentStatusColor(booking.payment_status, booking.status)} border font-medium text-xs`}>
                          {getPaymentStatusText(booking.payment_status, booking.status)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Créée le {formatDate(booking.created_at)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations de la vacation */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-3">Détails de la vacation</h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-medical-blue-light" />
                        <span>
                          Du {formatDateTime(booking.start_date)} 
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-medical-green-light" />
                        <span>Durée: {booking.duration_hours}h</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-red-500" />
                        <span>{booking.vacation_post?.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Euro className="w-4 h-4 mr-2 text-yellow-500" />
                        <span className="font-medium">{booking.total_amount}€</span>
                      </div>
                    </div>

                    {/* Contact et actions */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-3">Contact & Actions</h4>
                      {booking.contact_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-purple-500" />
                          <span>{booking.contact_phone}</span>
                        </div>
                      )}
                      {booking.message && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Message:</strong> {booking.message}
                          </p>
                        </div>
                      )}
                      
                      {/* Actions selon le statut */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="bg-medical-green hover:bg-medical-green-dark"
                            >
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Rejeter
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'completed')}
                              className="bg-medical-blue hover:bg-medical-blue-dark"
                            >
                              Marquer comme terminé
                            </Button>

                            {/* Paiement */}
                            {booking.status === 'confirmed' && booking.payment_status !== 'paid' && (
                              <Button
                                size="sm"
                                className="bg-medical-green hover:bg-medical-green-dark"
                                onClick={() => window.open(`/payment/${booking.id}`, '_blank')}
                              >
                                Régler cette réservation
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowMessaging(true);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        
                        {/* Bouton pour étendre/réduire les détails de l'établissement */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCardExpansion(booking.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Moins d'infos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Plus d'infos
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Section étendues avec plus d'informations sur l'établissement */}
                  {isExpanded && booking.establishment_info && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-medical-blue-light" />
                        Informations détaillées sur l'établissement
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coordonnées */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-800">Coordonnées</h5>
                          
                          {booking.establishment_info.address && (
                            <div className="flex items-start text-sm text-gray-600">
                              <MapIcon className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span>{booking.establishment_info.address}</span>
                            </div>
                          )}
                          
                          {booking.establishment_info.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-medical-green-light" />
                              <a 
                                href={`tel:${booking.establishment_info.phone}`}
                                className="hover:text-medical-blue transition-colors"
                              >
                                {booking.establishment_info.phone}
                              </a>
                            </div>
                          )}
                          
                          {booking.establishment_info.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2 text-medical-blue-light" />
                              <a 
                                href={`mailto:${booking.establishment_info.email}`}
                                className="hover:text-medical-blue transition-colors"
                              >
                                {booking.establishment_info.email}
                              </a>
                            </div>
                          )}
                          
                          {booking.establishment_info.website && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-2 text-purple-500" />
                              <a 
                                href={booking.establishment_info.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-medical-blue transition-colors"
                              >
                                Site web
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {/* Informations générales */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-800">Détails</h5>
                          
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center text-sm font-medium text-blue-900 mb-1">
                              <Building2 className="w-4 h-4 mr-2" />
                              Type d'établissement
                            </div>
                            <p className="text-sm text-blue-800">
                              {getEstablishmentTypeIcon(booking.establishment_info.establishment_type)} {' '}
                              {getEstablishmentTypeLabel(booking.establishment_info.establishment_type)}
                            </p>
                          </div>
                          
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center text-sm font-medium text-green-900 mb-1">
                              <MapPin className="w-4 h-4 mr-2" />
                              Localisation
                            </div>
                            <p className="text-sm text-green-800">
                              📍 {booking.establishment_info.city}
                            </p>
                          </div>
                          
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center text-sm font-medium text-yellow-900 mb-1">
                              <Euro className="w-4 h-4 mr-2" />
                              Rémunération prévue
                            </div>
                            <p className="text-sm text-yellow-800 font-semibold">
                              {booking.total_amount}€ pour {booking.duration_hours}h
                              <span className="text-xs text-yellow-600 ml-2">
                                <a
                                  href="https://sante.gouv.fr/actualites/actualites-du-ministere/article/interim-medical-entree-en-vigueur-de-la-loi-rist-ce-lundi-3-avril"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{background:'#fffbe6',color:'#ad8b00',padding:'4px 8px',borderRadius:'4px',fontWeight:'bold',textDecoration:'underline',cursor:'pointer',position:'relative'}}
                                  title="Les tarifs des vacations sont déterminés directement par l’établissement de santé. Cureliah n’intervient pas dans leur fixation ni dans les paiements. Cliquez pour plus d'infos."
                                >
                                  Tarif: voir règlementation
                                </a>
<a
  href="https://sante.gouv.fr/actualites/actualites-du-ministere/article/interim-medical-entree-en-vigueur-de-la-loi-rist-ce-lundi-3-avril"
  target="_blank"
  rel="noopener noreferrer"
  style={{background:'#fffbe6',color:'#ad8b00',padding:'4px 8px',borderRadius:'4px',fontWeight:'bold',textDecoration:'underline',cursor:'pointer',position:'relative'}}
  title="Les tarifs des vacations sont déterminés directement par l’établissement de santé. Cureliah n’intervient pas dans leur fixation ni dans les paiements. Cliquez pour plus d'infos."
>
  Tarif: voir règlementation
</a>
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Informations sur le paiement si applicable */}
                      {shouldShowPaymentBadge(booking.payment_status, booking.status) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <Euro className="w-4 h-4 text-medical-green-light" />
                            Statut du paiement
                          </h5>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getPaymentStatusColor(booking.payment_status, booking.status)} border`}>
                              {getPaymentStatusText(booking.payment_status, booking.status)}
                            </Badge>
                            {booking.payment_status === 'paid' && (
                              <span className="text-sm text-gray-600">
                                • Paiement reçu avec succès
                              </span>
                            )}
                            {booking.payment_status === 'pending' && (
                              <span className="text-sm text-gray-600">
                                • En attente du paiement par l'établissement
                              </span>
                            )}
                            {booking.payment_status === 'failed' && (
                              <span className="text-sm text-gray-600">
                                • Problème de paiement - Contactez l'établissement
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de messagerie */}
      {selectedBooking && (
        <MessagingModal
          isOpen={showMessaging}
          onClose={() => {
            setShowMessaging(false);
            setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          receiverId={selectedBooking.establishment_id}
          receiverName={selectedBooking.establishment_info?.name || 'Établissement'}
          receiverType="establishment"
        />
      )}
    </div>
  );
};

export default BookingManagement;