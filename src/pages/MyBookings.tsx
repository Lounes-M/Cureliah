
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
import BookingManagement from '@/components/BookingManagement';
import EstablishmentBookingManagement from '@/components/EstablishmentBookingManagement';

const MyBookings = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }
  }, [user, profile, navigate]);

  if (!user || !profile) {
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
            {profile.user_type === 'doctor' 
              ? 'Gérez les demandes de réservation pour vos vacations'
              : 'Suivez l\'état de vos demandes de réservation'
            }
          </p>
        </div>

        {profile.user_type === 'doctor' ? (
          <BookingManagement />
        ) : (
          <EstablishmentBookingManagement />
        )}
      </div>
    </div>
  );
};

export default MyBookings;
