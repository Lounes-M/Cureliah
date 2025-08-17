import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getSpecialityInfo } from '@/utils/specialities';
import {
  Star,
  MapPin,
  Clock,
  Award,
  Stethoscope,
  GraduationCap,
  Languages,
  Shield,
  Calendar,
  Euro,
  TrendingUp,
  Users,
  MessageSquare,
  Eye,
  ChevronRight,
  CheckCircle2,
  Heart,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { logger } from "@/services/logger";

interface DoctorProfile {
  id: string;
  first_name: string;
  last_name: string;
  speciality: string;
  avatar_url?: string;
  experience_years?: number;
  bio?: string;
  license_number?: string;
  education?: string[];
  languages?: string[];
  hourly_rate?: number;
  is_verified?: boolean;
  total_reviews?: number;
  average_rating?: number;
  total_bookings?: number;
  response_time?: number;
  availability_score?: number;
}

interface VacationWithDoctor {
  id: string;
  title: string;
  location: string;
  start_date: string;
  hourly_rate: number;
  act_type: string;
  status: string;
  doctor_profiles: DoctorProfile;
}

interface DetailedDoctorCardProps {
  vacation: VacationWithDoctor;
  onBookingRequest: () => void;
  onViewDetails: () => void;
  className?: string;
}

export const DetailedDoctorCard: React.FC<DetailedDoctorCardProps> = ({
  vacation,
  onBookingRequest,
  onViewDetails,
  className = ""
}) => {
  const [doctorStats, setDoctorStats] = useState({
    totalVacations: 0,
    completedBookings: 0,
    averageResponse: '2h',
    satisfactionRate: 0,
    reviewCount: 0,
    isNewProvider: false
  });
  const [loading, setLoading] = useState(false);

  const doctor = vacation.doctor_profiles;

  useEffect(() => {
    loadDoctorStats();
  }, [doctor.id]);

  const loadDoctorStats = async () => {
    setLoading(true);
    try {
      // Récupérer les stats du médecin
      const { data: vacationsData } = await supabase
        .from('vacation_posts')
        .select('id, status')
        .eq('doctor_id', doctor.id);

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('doctor_id', doctor.id);

      // Récupérer les vraies reviews depuis la base de données
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('doctor_id', doctor.id);

      const reviewCount = reviewsData?.length || 0;
      const avgRating = reviewCount > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
        : 0;

      const completedBookings = bookingsData?.filter(b => b.status === 'completed').length || 0;
      
      setDoctorStats({
        totalVacations: vacationsData?.length || 0,
        completedBookings,
        averageResponse: '2h',
        satisfactionRate: reviewCount >= 5 ? Math.round(avgRating * 20) : 0,
        reviewCount,
        isNewProvider: reviewCount < 5
      });
    } catch (error) {
      logger.error('Error loading doctor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActTypeInfo = (actType: string) => {
    switch (actType) {
      case "consultation":
        return { icon: "🩺", label: "Consultation", color: "bg-blue-100 text-blue-800" };
      case "surgery":
        return { icon: "⚕️", label: "Chirurgie", color: "bg-red-100 text-red-800" };
      case "emergency":
        return { icon: "🚨", label: "Urgence", color: "bg-orange-100 text-orange-800" };
      case "home_visit":
        return { icon: "🏠", label: "Visite à domicile", color: "bg-green-100 text-green-800" };
      case "teleconsultation":
        return { icon: "💻", label: "Téléconsultation", color: "bg-purple-100 text-purple-800" };
      default:
        return { icon: "🩺", label: actType, color: "bg-gray-100 text-gray-800" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const actTypeInfo = getActTypeInfo(vacation.act_type);

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 ${className}`}>
      <CardHeader className="pb-4">
        {/* En-tête avec photo et infos principales */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
              <AvatarImage src={doctor.avatar_url} alt={`Dr ${doctor.first_name} ${doctor.last_name}`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                {doctor.first_name?.[0]}{doctor.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            {doctor.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-medical-green-light rounded-full p-1 ring-2 ring-white">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900 truncate">
                Dr {doctor.first_name} {doctor.last_name}
              </h3>
              {doctor.is_verified && (
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                  <Shield className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-medical-blue-light" />
              <span className="text-blue-700 font-medium text-sm">
                {getSpecialityInfo(doctor.speciality).label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              {doctor.experience_years && (
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>{doctor.experience_years}+ ans</span>
                </div>
              )}
              
              {doctor.average_rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{doctor.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500">({doctor.total_reviews || 0})</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-medical-green mb-1">
              {vacation.hourly_rate}€
            </div>
            <div className="text-xs text-gray-500">par heure</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations sur la vacation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-lg">
              {vacation.title}
            </h4>
            <Badge className={actTypeInfo.color}>
              <span className="mr-1">{actTypeInfo.icon}</span>
              {actTypeInfo.label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="font-medium">{vacation.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-medical-green-light" />
              <span className="font-medium">{formatDate(vacation.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{formatTime(vacation.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Disponible</span>
            </div>
          </div>
        </div>

        {/* Stats du médecin */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-medical-blue-light" />
              <span className="text-xs font-medium text-gray-600">Interventions</span>
            </div>
            <div className="text-lg font-bold text-medical-blue">
              {doctorStats.completedBookings}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-medical-green-light" />
              <span className="text-xs font-medium text-gray-600">Réponse</span>
            </div>
            <div className="text-lg font-bold text-medical-green">
              {doctorStats.averageResponse}
            </div>
          </div>
        </div>

        {/* Barre de satisfaction */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Heart className="w-4 h-4 text-pink-500" />
              Satisfaction
            </span>
            <span className="text-sm font-bold text-pink-600">
              {doctorStats.isNewProvider ? (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Nouveau
                </Badge>
              ) : (
                `${doctorStats.satisfactionRate}%`
              )}
            </span>
          </div>
          {doctorStats.isNewProvider ? (
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                Nouveau praticien sur la plateforme
              </p>
            </div>
          ) : (
            <Progress 
              value={doctorStats.satisfactionRate} 
              className="h-2"
            />
          )}
        </div>

        {/* Bio courte */}
        {doctor.bio && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-sm text-gray-700 line-clamp-2">
              {doctor.bio}
            </p>
          </div>
        )}

        {/* Compétences et langues */}
        <div className="space-y-2">
          {doctor.education && doctor.education.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-600 font-medium flex items-center gap-1 mb-1">
                <GraduationCap className="w-3 h-3" />
                Formation
              </span>
              <div className="flex flex-wrap gap-1">
                {doctor.education.slice(0, 2).map((edu, index) => (
                  <Badge key={index} variant="outline" className="text-xs py-0 px-2">
                    {edu}
                  </Badge>
                ))}
                {doctor.education.length > 2 && (
                  <Badge variant="outline" className="text-xs py-0 px-2">
                    +{doctor.education.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {doctor.languages && doctor.languages.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-600 font-medium flex items-center gap-1 mb-1">
                <Languages className="w-3 h-3" />
                Langues
              </span>
              <div className="flex flex-wrap gap-1">
                {doctor.languages.slice(0, 3).map((lang, index) => (
                  <Badge key={index} variant="secondary" className="text-xs py-0 px-2">
                    {lang}
                  </Badge>
                ))}
                {doctor.languages.length > 3 && (
                  <Badge variant="secondary" className="text-xs py-0 px-2">
                    +{doctor.languages.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onBookingRequest}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-lg h-11"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Réserver
          </Button>
          <Button 
            variant="outline"
            onClick={onViewDetails}
            className="px-4 rounded-lg border-gray-200 hover:bg-gray-50 h-11"
          >
            <Eye className="w-4 h-4 mr-2" />
            Profil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
