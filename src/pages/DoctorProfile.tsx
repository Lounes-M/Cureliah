import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logger } from "@/services/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getSpecialityInfo } from '@/utils/specialities';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  Stethoscope,
  Award,
  GraduationCap,
  Languages,
  Shield,
  CheckCircle2,
  Heart,
  TrendingUp,
  Users,
  MessageSquare,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

interface DoctorProfileData {
  id: string;
  first_name: string;
  last_name: string;
  speciality: string;
  experience_years?: number;
  bio?: string;
  phone?: string;
  email?: string;
  location?: string;
  rating?: number;
  total_reviews?: number;
  is_verified?: boolean;
  availability_status?: string;
  created_at?: string;
  avatar_url?: string;
  license_number?: string;
  education?: string[];
  languages?: string[];
  certifications?: string[];
  total_consultations?: number;
  satisfaction_rate?: number;
}

interface DoctorStats {
  totalVacations: number;
  completedBookings: number;
  averageRating: number;
  reviewCount: number;
  satisfactionRate: number;
  isNewProvider: boolean;
  responseTime: string;
}

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorProfileData | null>(null);
  const [stats, setStats] = useState<DoctorStats>({
    totalVacations: 0,
    completedBookings: 0,
    averageRating: 0,
    reviewCount: 0,
    satisfactionRate: 0,
    isNewProvider: true,
    responseTime: '2h'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDoctorProfile();
      fetchDoctorStats();
    }
  }, [id]);

  const fetchDoctorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setDoctor(data);
    } catch (error) {
      logger.error('Error fetching doctor profile', error as Error, { doctorId: id }, 'DoctorProfile', 'fetch_profile_error');
      setError('Impossible de charger le profil du médecin');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorStats = async () => {
    try {
      // Récupérer les vacations
      const { data: vacationsData } = await supabase
        .from('vacation_posts')
        .select('id, status')
        .eq('doctor_id', id);

      // Récupérer les réservations
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('doctor_id', id);

      // Récupérer les reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('doctor_id', id);

      const reviewCount = reviewsData?.length || 0;
      const avgRating = reviewCount > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
        : 0;

      const completedBookings = bookingsData?.filter(b => b.status === 'completed').length || 0;
      
      setStats({
        totalVacations: vacationsData?.length || 0,
        completedBookings,
        averageRating: avgRating,
        reviewCount,
        satisfactionRate: reviewCount >= 5 ? Math.round(avgRating * 20) : 0,
        isNewProvider: reviewCount < 5,
        responseTime: '2h'
      });
    } catch (error) {
      logger.error('Error fetching doctor stats', error as Error, { doctorId: id }, 'DoctorProfile', 'fetch_stats_error');
    }
  };

  const handleContact = () => {
    // Navigate to messaging or contact functionality
    navigate('/contact');
  };

  const handleBooking = () => {
    // Navigate to vacation search filtered by this doctor
    navigate(`/vacation-search?doctor=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <div className="text-red-500 mb-4">
              <User className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Profil non trouvé</h2>
            <p className="text-gray-600 mb-4">
              Le profil du docteur que vous recherchez n'existe pas ou n'est pas accessible.
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
        </div>

        {/* Doctor Profile Card */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-medical-blue" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Stethoscope className="h-3 w-3" />
                      <span>{doctor.speciality}</span>
                    </Badge>
                    {doctor.is_verified && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Vérifié
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {doctor.rating && (
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({doctor.total_reviews} avis)</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {doctor.experience_years ? `${doctor.experience_years} ans d'expérience` : 'Expérience non précisée'}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Biography */}
            {doctor.bio && (
              <div>
                <h3 className="text-lg font-semibold mb-3">À propos</h3>
                <p className="text-gray-700 leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Informations de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{doctor.phone}</span>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{doctor.email}</span>
                  </div>
                )}
                {doctor.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{doctor.location}</span>
                  </div>
                )}
                {doctor.availability_status && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Badge variant={doctor.availability_status === 'available' ? 'default' : 'secondary'}>
                      {doctor.availability_status === 'available' ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex space-x-4">
              <Button onClick={handleContact} className="flex-1">
                Contacter
              </Button>
              <Button onClick={handleBooking} variant="outline" className="flex-1">
                Voir les remplacements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
