import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro, Clock, MessageCircle, User, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { getSpecialityInfo } from '@/utils/specialities';

interface VacationPost {
  id: string;
  title: string;
  description: string;
  speciality: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
  location: string;
  requirements: string;
}

interface Booking {
  id: string;
  status: string;
  message: string;
  created_at: string;
  vacation_posts: VacationPost;
  doctor_info?: {
    bio: string;
    experience_years: number;
  };
  establishment_info?: {
    name: string;
    establishment_type: string;
    city: string;
  };
  user_info?: {
    first_name: string;
    last_name: string;
  };
}

const MyBookings = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    fetchBookings();
  }, [user, profile]);

  const fetchBookings = async () => {
    if (!user || !profile) return;

    try {
      let bookingsData: any[] = [];

      if (profile.user_type === 'doctor') {
        // For doctors, get bookings with establishment info
        const { data: doctorBookings, error: doctorError } = await supabase
          .from('vacation_bookings')
          .select(`
            *,
            vacation_posts(*)
          `)
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false });

        if (doctorError) throw doctorError;

        // Get establishment info separately
        const establishmentIds = doctorBookings?.map(b => b.establishment_id) || [];
        
        let establishmentProfiles: any[] = [];
        if (establishmentIds.length > 0) {
          const { data: establishments } = await supabase
            .from('establishment_profiles')
            .select('id, name, establishment_type, city')
            .in('id', establishmentIds);
          
          establishmentProfiles = establishments || [];
        }

        bookingsData = doctorBookings?.map(booking => ({
          ...booking,
          establishment_info: establishmentProfiles.find(est => est.id === booking.establishment_id)
        })) || [];

      } else {
        // For establishments, get bookings with doctor info
        const { data: establishmentBookings, error: establishmentError } = await supabase
          .from('vacation_bookings')
          .select(`
            *,
            vacation_posts(*)
          `)
          .eq('establishment_id', user.id)
          .order('created_at', { ascending: false });

        if (establishmentError) throw establishmentError;

        // Get doctor info separately
        const doctorIds = establishmentBookings?.map(b => b.doctor_id) || [];
        
        let doctorProfiles: any[] = [];
        let userProfiles: any[] = [];
        
        if (doctorIds.length > 0) {
          const { data: doctors } = await supabase
            .from('doctor_profiles')
            .select('id, bio, experience_years')
            .in('id', doctorIds);
          
          const { data: users } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', doctorIds);
          
          doctorProfiles = doctors || [];
          userProfiles = users || [];
        }

        bookingsData = establishmentBookings?.map(booking => ({
          ...booking,
          doctor_info: doctorProfiles.find(doc => doc.id === booking.doctor_id),
          user_info: userProfiles.find(user => user.id === booking.doctor_id)
        })) || [];
      }

      setBookings(bookingsData);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }

      toast({
        title: "Statut mis à jour",
        description: `La réservation a été ${status === 'confirmed' ? 'confirmée' : 'refusée'}.`,
      });

      fetchBookings();
    } catch (error: any) {
      console.error('Error in updateBookingStatus:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'rejected': return 'Refusée';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnue';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Mes réservations
          </h1>
          <p className="text-gray-600">
            {profile?.user_type === 'doctor' 
              ? 'Gérez les demandes de réservation pour vos vacations'
              : 'Suivez l\'état de vos demandes de réservation'
            }
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune réservation
              </h3>
              <p className="text-gray-600 mb-4">
                {profile?.user_type === 'doctor' 
                  ? 'Aucune demande de réservation reçue pour le moment'
                  : 'Vous n\'avez pas encore effectué de réservation'
                }
              </p>
              {profile?.user_type === 'establishment' && (
                <Button onClick={() => navigate('/search')}>
                  Rechercher des vacations
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const vacation = booking.vacation_posts;
              const specialityInfo = getSpecialityInfo(vacation.speciality);
              
              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold mb-2">
                          {vacation.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mb-2">
                          {vacation.description}
                        </CardDescription>
                        
                        {/* Show partner info */}
                        {profile?.user_type === 'doctor' && booking.establishment_info && (
                          <div className="flex items-center text-sm text-gray-700 mb-2">
                            <Building className="w-4 h-4 mr-2" />
                            <span>
                              <strong>Établissement :</strong> {booking.establishment_info.name}
                              {booking.establishment_info.city && ` - ${booking.establishment_info.city}`}
                            </span>
                          </div>
                        )}
                        
                        {profile?.user_type === 'establishment' && booking.user_info && (
                          <div className="flex items-center text-sm text-gray-700 mb-2">
                            <User className="w-4 h-4 mr-2" />
                            <span>
                              <strong>Médecin :</strong> Dr. {booking.user_info.first_name} {booking.user_info.last_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2 items-end">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <Badge className={specialityInfo.color}>
                          {specialityInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{calculateDuration(vacation.start_date, vacation.end_date)} jour(s)</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Euro className="w-4 h-4 mr-2" />
                          <span className="font-medium">{vacation.hourly_rate}€/heure</span>
                        </div>
                        {vacation.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{vacation.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {booking.message && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Message :</strong> {booking.message}
                        </p>
                      </div>
                    )}

                    {vacation.requirements && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Exigences :</strong> {vacation.requirements}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {profile?.user_type === 'doctor' && booking.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="bg-medical-green hover:bg-medical-green-dark"
                          >
                            Accepter
                          </Button>
                          <Button 
                            onClick={() => updateBookingStatus(booking.id, 'rejected')}
                            variant="destructive"
                          >
                            Refuser
                          </Button>
                        </>
                      )}
                      
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Envoyer un message
                      </Button>
                      
                      {booking.status === 'confirmed' && (
                        <Button variant="outline">
                          Voir le contrat
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
