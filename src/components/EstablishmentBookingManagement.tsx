import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, User, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from './MessagingModal';
import PaymentButton from './PaymentButton';
import BookingTimeline from './BookingTimeline';
import { logger } from "@/services/logger";

// Mapping des spécialités anglais -> français
const specialityMapping: Record<string, string> = {
  'orthopedics': 'Orthopédie',
  'cardiology': 'Cardiologie',
  'dermatology': 'Dermatologie',
  'pediatrics': 'Pédiatrie',
  'psychiatry': 'Psychiatrie',
  'radiology': 'Radiologie',
  'anesthesiology': 'Anesthésie-Réanimation',
  'general_surgery': 'Chirurgie générale',
  'gynecology': 'Gynécologie-Obstétrique',
  'ophthalmology': 'Ophtalmologie',
  'otolaryngology': 'ORL',
  'neurology': 'Neurologie',
  'pulmonology': 'Pneumologie',
  'gastroenterology': 'Gastro-entérologie',
  'endocrinology': 'Endocrinologie',
  'rheumatology': 'Rhumatologie',
  'urology': 'Urologie',
  'general_medicine': 'Médecine générale'
};

// Fonction pour traduire les spécialités
const translateSpeciality = (speciality: string): string => {
  return specialityMapping[speciality] || speciality.charAt(0).toUpperCase() + speciality.slice(1);
};

interface DoctorInfo {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  experience_years?: number;
  speciality?: string;
  avatar_url?: string;
}

interface VacationPostInfo {
  id: string;
  title: string;
  location?: string;
  hourly_rate: number;
  start_date: string;
  end_date: string;
  description?: string;
  speciality?: string;
}

interface BookingWithDetails {
  id: string;
  status: string;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
  payment_status?: string;
  vacation_posts: VacationPostInfo;
  doctor_profiles: DoctorInfo;
}

interface EstablishmentBookingManagementProps {
  status?: string;
}

const EstablishmentBookingManagement = ({ status }: EstablishmentBookingManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [messagingModal, setMessagingModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    receiverId: string;
    receiverName: string;
    receiverType: 'doctor' | 'establishment';
  }>({
    isOpen: false,
    bookingId: '',
    receiverId: '',
    receiverName: '',
    receiverType: 'doctor'
  });

  useEffect(() => {
    logger.info("=== DEBUG EstablishmentBookingManagement ===");
    logger.info("User ID:", user?.id);
    logger.info("Status filter:", status);
    
    if (user) {
      fetchBookings();
    }
  }, [user, status]);

  const fetchBookings = async () => {
    if (!user) return;

    logger.info("🔍 Fetching bookings for establishment:", user.id);

    try {
      setLoading(true);

      // D'abord, testons une requête simple pour voir la structure
      logger.info("🔍 Testing simple query first...");
      const { data: simpleTest, error: simpleError } = await supabase
        .from('bookings')
        .select('*')
        .eq('establishment_id', user.id)
        .limit(1);
      
      logger.info("📊 Simple test result:", simpleTest);
      logger.info("❌ Simple test error:", simpleError);

      // Query corrigée pour utiliser la table "bookings" comme dans MyBookings
      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          updated_at,
          start_date,
          end_date,
          payment_status,
          vacation_posts!inner (
            id,
            title,
            location,
            hourly_rate,
            start_date,
            end_date,
            description,
            speciality,
            doctor_profiles!inner (
              id,
              first_name,
              last_name,
              bio,
              experience_years,
              speciality,
              avatar_url
            )
          )
        `)
        .eq('establishment_id', user.id)
        .order('created_at', { ascending: false });

      // Filtrer par statut si spécifié
      if (status) {
        const statusArray = status.split(',').map(s => s.trim());
        logger.info("🔍 Filtering by status:", statusArray);
        query = query.in('status', statusArray);
      }

      const { data: bookingsData, error: bookingsError } = await query;

      logger.info("📊 Raw bookings data:", bookingsData);
      logger.info("❌ Bookings error:", bookingsError);

      if (bookingsError) {
        logger.error("Supabase query error:", bookingsError);
        throw bookingsError;
      }

      // Transform data to match our interface
      const transformedBookings = bookingsData?.map((booking, index) => {
        logger.info(`🔍 Processing booking ${index}:`, booking);
        
        // Vérifier si vacation_posts existe
        if (!booking.vacation_posts) {
          logger.warn(`⚠️ No vacation_posts data for booking ${booking.id}:`, booking);
          return null;
        }
        
        // Dans tes données, vacation_posts est un objet, pas un tableau !
        const vacationPost = booking.vacation_posts as any; // Type assertion temporaire
        logger.info(`🔍 Vacation post for booking ${index}:`, vacationPost);
        
        // Vérifier si doctor_profiles existe dans vacation_posts
        if (!vacationPost.doctor_profiles) {
          logger.warn(`⚠️ No doctor_profiles data for vacation post ${vacationPost.id}:`, vacationPost);
          return null;
        }
        
        // doctor_profiles pourrait être un objet ou un tableau, on gère les deux cas
        const doctorProfile = Array.isArray(vacationPost.doctor_profiles) 
          ? vacationPost.doctor_profiles[0] 
          : vacationPost.doctor_profiles as any; // Type assertion temporaire
        logger.info(`🔍 Doctor profile for booking ${index}:`, doctorProfile);
        
        return {
          id: booking.id,
          status: booking.status,
          total_amount: booking.total_amount,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          start_date: booking.start_date,
          end_date: booking.end_date,
          payment_status: booking.payment_status,
          vacation_posts: {
            id: vacationPost.id,
            title: vacationPost.title,
            location: vacationPost.location,
            hourly_rate: vacationPost.hourly_rate,
            start_date: vacationPost.start_date,
            end_date: vacationPost.end_date,
            description: vacationPost.description,
            speciality: translateSpeciality(vacationPost.speciality || ''),
          },
          doctor_profiles: {
            id: doctorProfile.id,
            first_name: doctorProfile.first_name,
            last_name: doctorProfile.last_name,
            bio: doctorProfile.bio,
            experience_years: doctorProfile.experience_years,
            speciality: translateSpeciality(doctorProfile.speciality || ''),
            avatar_url: doctorProfile.avatar_url,
          }
        };
      }).filter(Boolean) || []; // Filtrer les éléments null

      logger.info("✅ Transformed bookings:", transformedBookings);
      logger.info("✅ Found", transformedBookings.length, "bookings");

      setBookings(transformedBookings);
    } catch (error: any) {
      logger.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': 
      case 'booked': return 'bg-green-100 text-green-800';
      case 'cancelled': 
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed':
      case 'booked': return 'Confirmée';
      case 'cancelled': return 'Annulée';
      case 'rejected': return 'Refusée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string | undefined, bookingStatus: string) => {
    // Si la réservation n'est pas confirmée, pas de badge de paiement
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'paid' && bookingStatus !== 'completed') {
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
    // Si la réservation n'est pas confirmée, pas de texte de paiement
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'paid' && bookingStatus !== 'completed') {
      return '';
    }
    
    switch (paymentStatus) {
      case 'paid': return '✅ Réglée';
      case 'failed': return '❌ Échec paiement';
      case 'pending':
      default: return '💳 En attente de règlement';
    }
  };

  const shouldShowPaymentBadge = (paymentStatus: string | undefined, bookingStatus: string) => {
    // Afficher le badge seulement pour les réservations confirmées, payées ou terminées
    return ['confirmed', 'paid', 'completed'].includes(bookingStatus);
  };

  const openMessaging = (booking: BookingWithDetails) => {
    setMessagingModal({
      isOpen: true,
      bookingId: booking.id,
      receiverId: booking.doctor_profiles.id,
      receiverName: `Dr. ${booking.doctor_profiles.first_name} ${booking.doctor_profiles.last_name}`,
      receiverType: 'doctor'
    });
  };

  const closeMessaging = () => {
    setMessagingModal(prev => ({ ...prev, isOpen: false }));
  };

  const toggleExpanded = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des réservations...</div>;
  }

  // Grouper les réservations par statut
  const groupedBookings = {
    pending: bookings.filter(b => b.status === 'pending'),
    active: bookings.filter(b => b.status === 'confirmed' || b.status === 'booked'),
    completed: bookings.filter(b => b.status === 'completed'),
    cancelled: bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected')
  };

  const currentBookings = status 
    ? bookings 
    : status === 'confirmed' 
      ? groupedBookings.active 
      : status === 'pending' 
        ? groupedBookings.pending 
        : status === 'completed' 
          ? groupedBookings.completed 
          : status === 'cancelled,rejected' 
            ? groupedBookings.cancelled 
            : bookings;

  return (
    <div className="space-y-6">
      {!status && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Mes Réservations</h2>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-yellow-50">
              {groupedBookings.pending.length} en attente
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {groupedBookings.active.length} actives
            </Badge>
          </div>
        </div>
      )}

      {currentBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune réservation {status ? `avec le statut "${status}"` : ''}
            </h3>
            <p className="text-gray-600">
              Vos réservations apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isExpanded={expandedBooking === booking.id}
              onToggleExpanded={() => toggleExpanded(booking.id)}
              onOpenMessaging={() => openMessaging(booking)}
              onStatusUpdate={fetchBookings}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getPaymentStatusColor={getPaymentStatusColor}
              getPaymentStatusText={getPaymentStatusText}
              shouldShowPaymentBadge={shouldShowPaymentBadge}
            />
          ))}
        </div>
      )}

      <MessagingModal
        isOpen={messagingModal.isOpen}
        onClose={closeMessaging}
        bookingId={messagingModal.bookingId}
        receiverId={messagingModal.receiverId}
        receiverName={messagingModal.receiverName}
        receiverType={messagingModal.receiverType}
      />
    </div>
  );
};

interface BookingCardProps {
  booking: BookingWithDetails;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onOpenMessaging: () => void;
  onStatusUpdate: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getPaymentStatusColor: (paymentStatus: string | undefined, bookingStatus: string) => string;
  getPaymentStatusText: (paymentStatus: string | undefined, bookingStatus: string) => string;
  shouldShowPaymentBadge: (paymentStatus: string | undefined, bookingStatus: string) => boolean;
}

const BookingCard = ({
  booking,
  isExpanded,
  onToggleExpanded,
  onOpenMessaging,
  onStatusUpdate,
  getStatusColor,
  getStatusText,
  getPaymentStatusColor,
  getPaymentStatusText,
  shouldShowPaymentBadge
}: BookingCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.vacation_posts.title}</CardTitle>
            <CardDescription className="mt-1">
              Dr. {booking.doctor_profiles.first_name} {booking.doctor_profiles.last_name}
              {booking.doctor_profiles.speciality && (
                <span className="text-medical-blue ml-2">• {booking.doctor_profiles.speciality}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            {shouldShowPaymentBadge(booking.payment_status, booking.status) && (
              <Badge className={`${getPaymentStatusColor(booking.payment_status, booking.status)} border font-medium`}>
                {getPaymentStatusText(booking.payment_status, booking.status)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <span>{booking.vacation_posts.location || 'Non spécifié'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Euro className="w-4 h-4 text-gray-400 mr-2" />
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
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 text-gray-400 mr-2" />
              <span>
                {booking.doctor_profiles.experience_years ? 
                  `${booking.doctor_profiles.experience_years} années d'expérience` : 
                  'Expérience non spécifiée'
                }
              </span>
            </div>
            {booking.total_amount && (
              <div className="flex items-center text-sm font-medium text-medical-green">
                <Euro className="w-4 h-4 text-gray-400 mr-2" />
                <span>Total: {booking.total_amount}€</span>
              </div>
            )}
          </div>
        </div>

        {booking.total_amount && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              <strong>Montant total:</strong> {booking.total_amount}€
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onOpenMessaging}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Contacter le médecin
            </Button>
            
            {booking.status === 'confirmed' && 
             booking.payment_status !== 'paid' && 
             booking.total_amount && (
              <PaymentButton
                bookingId={booking.id}
                amount={booking.total_amount}
                className="bg-medical-green hover:bg-medical-green-dark"
                onSuccess={onStatusUpdate}
              />
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpanded}>
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Détails
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            {booking.vacation_posts.description && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Description de la mission</h4>
                <p className="text-sm text-gray-700">{booking.vacation_posts.description}</p>
              </div>
            )}
            
            {booking.doctor_profiles.bio && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">À propos du médecin</h4>
                <p className="text-sm text-gray-700">{booking.doctor_profiles.bio}</p>
              </div>
            )}

            <BookingTimeline
              currentStatus={booking.status as any}
              createdAt={booking.created_at}
              updatedAt={booking.updated_at}
              userType="establishment"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EstablishmentBookingManagement;