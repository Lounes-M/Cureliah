import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useLogger } from "@/utils/logger";
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
  const logger = useLogger();
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
      logger.error('Error fetching doctor profile', error as Error, { doctorId: id }, 'DoctorProfile', 'fetch_error');
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
      logger.error('Error fetching doctor stats', error as Error, { doctorId: id }, 'DoctorProfile', 'stats_error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <p className="text-red-600 mb-4">{error || 'Profil introuvable'}</p>
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const specialityInfo = getSpecialityInfo(doctor.speciality);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Bouton retour */}
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="mb-6 hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Profil */}
          <div className="lg:col-span-2 space-y-6">
            {/* En-tête du profil */}
            <Card className="overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 h-32 relative">
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              <CardContent className="relative px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={doctor.avatar_url} alt={`Dr ${doctor.first_name} ${doctor.last_name}`} />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-emerald-500 text-white">
                      {doctor.first_name.charAt(0)}{doctor.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 sm:mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          Dr {doctor.first_name} {doctor.last_name}
                          {doctor.is_verified && (
                            <CheckCircle2 className="w-6 h-6 text-medical-blue-light" />
                          )}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            className={`${specialityInfo.color} border-0`}
                          >
                            <Stethoscope className="w-3 h-3 mr-1" />
                            {specialityInfo.label}
                          </Badge>
                          {doctor.experience_years && (
                            <Badge variant="secondary">
                              {doctor.experience_years} ans d'expérience
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {stats.reviewCount >= 5 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                            <span className="text-gray-500">({stats.reviewCount} avis)</span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Nouveau praticien
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* À propos */}
            {doctor.bio && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-medical-blue" />
                    À propos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{doctor.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Formations et certifications */}
            {(doctor.education?.length || doctor.certifications?.length) && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    Formation et certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctor.education?.length && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Formation
                      </h4>
                      <ul className="space-y-1">
                        {doctor.education.map((edu, index) => (
                          <li key={index} className="text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            {edu}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {doctor.certifications?.length && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Certifications
                      </h4>
                      <ul className="space-y-1">
                        {doctor.certifications.map((cert, index) => (
                          <li key={index} className="text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-medical-blue-light rounded-full"></div>
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale - Statistiques et informations */}
          <div className="space-y-6">
            {/* Statistiques de performance */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-medical-blue" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Taux de satisfaction */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Satisfaction
                    </span>
                    <span className="text-sm font-bold text-pink-600">
                      {stats.isNewProvider ? (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Nouveau
                        </Badge>
                      ) : (
                        `${stats.satisfactionRate}%`
                      )}
                    </span>
                  </div>
                  {stats.isNewProvider ? (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 text-center">
                        Nouveau praticien sur la plateforme
                      </p>
                    </div>
                  ) : (
                    <Progress value={stats.satisfactionRate} className="h-2" />
                  )}
                </div>

                {/* Autres statistiques */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Briefcase className="w-4 h-4 text-medical-blue-light" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">{stats.totalVacations}</div>
                    <div className="text-xs text-gray-600">Missions</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">{stats.completedBookings}</div>
                    <div className="text-xs text-gray-600">Terminées</div>
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">~{stats.responseTime}</div>
                  <div className="text-xs text-gray-600">Temps de réponse</div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doctor.license_number && (
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-medical-blue-light" />
                    <div>
                      <div className="text-xs text-gray-500">N° d'ordre</div>
                      <div className="font-medium">{doctor.license_number}</div>
                    </div>
                  </div>
                )}

                {doctor.languages?.length && (
                  <div className="flex items-start gap-3">
                    <Languages className="w-4 h-4 text-purple-500 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500">Langues</div>
                      <div className="font-medium">{doctor.languages.join(', ')}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Membre depuis</div>
                    <div className="font-medium">
                      {new Date(doctor.created_at || '').toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
