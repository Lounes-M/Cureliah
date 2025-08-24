import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Trash2, Calendar, MapPin, Euro, Clock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { VacationPost, TimeSlot } from '@/types/database';
import { getSpecialityInfo } from '@/utils/specialities';
import { logger } from "@/services/logger";

const VacationDetails = () => {
  const { vacationId } = useParams<{ vacationId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacation, setVacation] = useState<VacationPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.user_type !== 'doctor') {
      navigate('/auth?type=doctor');
      return;
    }
    if (vacationId) {
      fetchVacation();
    }
  }, [user, profile, vacationId]);

  const fetchVacation = async () => {
    if (!user || !vacationId) return;

    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .select(`
          *,
          time_slots (
            id,
            type,
            start_time,
            end_time,
            vacation_id
          )
        `)
        .eq('id', vacationId)
        .eq('doctor_id', user.id)
        .single();

      if (error) throw error;
      setVacation(data);
    } catch (error: any) {
      logger.error('Error fetching vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la vacation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vacation) return;

    try {
      const { error } = await supabase
        .from('vacation_posts')
        .delete()
        .eq('id', vacation.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La vacation a été supprimée avec succès"
      });

      navigate('/doctor/manage-vacations');
    } catch (error: any) {
      logger.error('Error deleting vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vacation",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'available': return 'Disponible';
      case 'booked': return 'Réservé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'pending': return 'En attente';
      default: return 'Non spécifié';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return 'Non spécifié';
    
    return timeSlots.map(slot => {
      switch (slot.type) {
        case 'morning':
          return 'Matin';
        case 'afternoon':
          return 'Après-midi';
        case 'custom':
          return `${slot.start_time} - ${slot.end_time}`;
        default:
          return '';
      }
    }).filter(Boolean).join(', ');
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

  if (!vacation) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Vacation non trouvée</div>
        </div>
      </div>
    );
  }

  const specialityInfo = getSpecialityInfo(vacation.speciality || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/doctor/manage-vacations')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux vacations
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{vacation.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {vacation.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-2 items-end">
                  <Badge className={getStatusColor(vacation.status)}>
                    {getStatusText(vacation.status)}
                  </Badge>
                  <Badge className={specialityInfo.color}>
                    {specialityInfo.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">Période</div>
                      <div className="text-sm">
                        Du {formatDate(vacation.start_date)}
                      </div>
                      <div className="text-sm">
                        Au {formatDate(vacation.end_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">Créneaux horaires</div>
                      <div className="text-sm">
                        {formatTimeSlots(vacation.time_slots)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Euro className="w-5 h-5 mr-3" />
                    <div>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded w-full mt-2">
                        <span className="text-yellow-800 text-sm">
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
                      </div>
                    </div>
                  </div>

                  {vacation.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-3" />
                      <div>
                        <div className="font-medium">Lieu</div>
                        <div className="text-sm">{vacation.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {vacation.requirements && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <FileText className="w-5 h-5 mr-3 text-medical-blue mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 mb-1">Exigences particulières</div>
                      <p className="text-blue-800 text-sm">{vacation.requirements}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <Button
                  onClick={() => navigate("/doctor/manage-vacations")}
                  className="flex-1"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VacationDetails;
