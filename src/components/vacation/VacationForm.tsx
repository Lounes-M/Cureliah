
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VacationFormFields, { VacationFormData } from './VacationFormFields';

interface VacationFormProps {
  vacationId?: string;
  isEditing: boolean;
  onLoadingChange: (loading: boolean) => void;
}

const VacationForm = ({ vacationId, isEditing, onLoadingChange }: VacationFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [vacationData, setVacationData] = useState<VacationFormData>({
    title: '',
    description: '',
    speciality: '',
    hourly_rate: '',
    location: '',
    requirements: ''
  });

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    if (isEditing && vacationId && user) {
      fetchVacationData();
    }
  }, [isEditing, vacationId, user]);

  const fetchVacationData = async () => {
    if (!user || !vacationId) return;

    onLoadingChange(true);
    try {
      const { data, error } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('id', vacationId)
        .eq('doctor_id', user.id)
        .single();

      if (error) throw error;

      setVacationData({
        title: data.title,
        description: data.description || '',
        speciality: data.speciality || '',
        hourly_rate: data.hourly_rate.toString(),
        location: data.location || '',
        requirements: data.requirements || ''
      });
      setStartDate(new Date(data.start_date));
      setEndDate(new Date(data.end_date));
    } catch (error: any) {
      console.error('Error fetching vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger cette vacation",
        variant: "destructive"
      });
      navigate('/doctor/manage-vacations');
    } finally {
      onLoadingChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate) return;

    if (startDate >= endDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const vacationPayload = {
        title: vacationData.title,
        description: vacationData.description || null,
        speciality: vacationData.speciality,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        hourly_rate: parseFloat(vacationData.hourly_rate),
        location: vacationData.location || null,
        requirements: vacationData.requirements || null
      };

      let error;

      if (isEditing && vacationId) {
        ({ error } = await supabase
          .from('vacation_posts')
          .update(vacationPayload)
          .eq('id', vacationId)
          .eq('doctor_id', user.id));
      } else {
        ({ error } = await supabase
          .from('vacation_posts')
          .insert({
            ...vacationPayload,
            doctor_id: user.id
          }));
      }

      if (error) throw error;

      toast({
        title: isEditing ? "Vacation modifiée !" : "Vacation publiée !",
        description: isEditing 
          ? "Votre vacation a été modifiée avec succès."
          : "Votre vacation a été publiée avec succès.",
      });

      navigate('/doctor/manage-vacations');
    } catch (error: any) {
      console.error('Error saving vacation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <VacationFormFields
        vacationData={vacationData}
        setVacationData={setVacationData}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading 
          ? (isEditing ? 'Modification...' : 'Publication...') 
          : (isEditing ? 'Modifier la vacation' : 'Publier la vacation')
        }
      </Button>
    </form>
  );
};

export default VacationForm;
