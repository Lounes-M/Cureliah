import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Clock, User, CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { useLogger } from '@/utils/logger';

interface VacationData {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  description?: string;
  price?: number;
  doctor_id: string;
  doctor_name?: string;
  doctor_speciality?: string;
}

export default function BookingFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const logger = useLogger();
  const [vacation, setVacation] = useState<VacationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    message: '',
    emergency_contact: '',
    special_requirements: ''
  });

  useEffect(() => {
    if (id) {
      fetchVacationDetails();
    }
  }, [id]);

  const fetchVacationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          doctor_profiles (
            first_name,
            last_name,
            speciality
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        setError('Vacation non trouvée');
        return;
      }

      setVacation({
        ...data,
        doctor_name: data.doctor_profiles ? 
          `${data.doctor_profiles.first_name} ${data.doctor_profiles.last_name}` : 
          'Docteur inconnu',
        doctor_speciality: data.doctor_profiles?.speciality || 'Spécialité non précisée'
      });
    } catch (err) {
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!vacation || !user) return;

    try {
      const { error } = await supabase
        .from('vacation_bookings')
        .insert([
          {
            vacation_id: vacation.id,
            establishment_id: user.id,
            message: bookingData.message,
            emergency_contact: bookingData.emergency_contact,
            special_requirements: bookingData.special_requirements,
            status: 'pending'
          }
        ]);

      if (error) {
        throw error;
      }

      setBookingStep(3); // Success step
    } catch (err) {
      logger.error('Erreur lors de la réservation', err as Error, { vacationId: id, userId: user?.id }, 'BookingFlow', 'booking_error');
      setError('Erreur lors de la réservation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !vacation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Calendar className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Vacation non trouvée</h2>
            <p className="text-gray-600 mb-4">
              La vacation que vous souhaitez réserver n'existe pas ou n'est plus disponible.
            </p>
            <Button onClick={() => navigate(-1)} className="w-full">
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= bookingStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step === 3 && bookingStep === 3 ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 ${
                    step < bookingStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Step 1: Vacation Details */}
          {bookingStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Détails de la vacation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{vacation.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{vacation.doctor_name}</span>
                      <Badge variant="secondary">{vacation.doctor_speciality}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{new Date(vacation.start_date).toLocaleDateString()} - {new Date(vacation.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{vacation.location}</span>
                    </div>
                    {vacation.price && (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">{vacation.price}€</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {vacation.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-gray-700">{vacation.description}</p>
                    </div>
                  </>
                )}
                
                <div className="flex space-x-4">
                  <Button onClick={() => setBookingStep(2)} className="flex-1">
                    Continuer la réservation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Booking Form */}
          {bookingStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Informations de réservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message au docteur
                  </label>
                  <textarea
                    value={bookingData.message}
                    onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Décrivez votre établissement et vos besoins..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact d'urgence
                  </label>
                  <input
                    type="text"
                    value={bookingData.emergency_contact}
                    onChange={(e) => setBookingData({...bookingData, emergency_contact: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom et téléphone du contact d'urgence"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Exigences spéciales
                  </label>
                  <textarea
                    value={bookingData.special_requirements}
                    onChange={(e) => setBookingData({...bookingData, special_requirements: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Matériel spécial, horaires particuliers, etc."
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setBookingStep(1)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleBookingSubmit} className="flex-1">
                    Confirmer la réservation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {bookingStep === 3 && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-green-500 mb-4">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Réservation envoyée!</h2>
                <p className="text-gray-600 mb-6">
                  Votre demande de réservation a été envoyée au docteur. Vous recevrez une notification dès qu'il aura répondu.
                </p>
                <div className="flex space-x-4">
                  <Button onClick={() => navigate('/my-bookings')} className="flex-1">
                    Voir mes réservations
                  </Button>
                  <Button onClick={() => navigate('/vacation-search')} variant="outline" className="flex-1">
                    Continuer la recherche
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
