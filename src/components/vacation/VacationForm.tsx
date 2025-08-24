import { useState, useEffect } from 'react';
import { VacationPost, TimeSlot, VacationStatus } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SpecialitySelector from './SpecialitySelector';
import DateSelector from './DateSelector';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TimeSlotSelector from './TimeSlotSelector';
import { logger } from "@/services/logger";

export interface VacationFormProps {
  vacationId?: string;
  isEditing?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  vacationData: Partial<VacationPost>;
  onChange: (data: Partial<VacationPost>) => void;
}

const VacationForm = ({
  vacationId,
  isEditing = false,
  onLoadingChange,
  vacationData,
  onChange
}: VacationFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(vacationData.time_slots || []);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(false);
    }
  }, [onLoadingChange]);

  const handleChange = (field: keyof VacationPost, value: any) => {
    onChange({ ...vacationData, [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field: keyof VacationPost, value: any): boolean => {
    switch (field) {
      case 'title':
        if (!value) {
          setErrors(prev => ({ ...prev, [field]: 'Le titre est requis' }));
          return false;
        }
        if (value.length < 5) {
          setErrors(prev => ({ ...prev, [field]: 'Le titre doit faire au moins 5 caractères' }));
          return false;
        }
        break;
      case 'speciality':
        if (!value) {
          setErrors(prev => ({ ...prev, [field]: 'La spécialité est requise' }));
          return false;
        }
        break;
      case 'start_date':
        if (!value) {
          setErrors(prev => ({ ...prev, [field]: 'La date de début est requise' }));
          return false;
        }
        break;
      case 'end_date':
        if (!value) {
          setErrors(prev => ({ ...prev, [field]: 'La date de fin est requise' }));
          return false;
        }
        if (value && vacationData.start_date && new Date(value) <= new Date(vacationData.start_date)) {
          setErrors(prev => ({ ...prev, [field]: 'La date de fin doit être postérieure à la date de début' }));
          return false;
        }
        break;
    }
    return true;
  };
  // Suppression de la gestion et de la validation du tarif horaire

  const handleBlur = (field: keyof VacationPost) => {
    const error = validateField(field, vacationData[field]);
    if (typeof error === 'string' && error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleTimeSlotsChange = (newTimeSlots: TimeSlot[]) => {
    setTimeSlots(newTimeSlots);
    onChange({
      ...vacationData,
      time_slots: newTimeSlots
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate all required fields
    const isTitleValid = validateField('title', vacationData.title);
    const isSpecialityValid = validateField('speciality', vacationData.speciality);
    const isStartDateValid = validateField('start_date', vacationData.start_date);
    const isEndDateValid = validateField('end_date', vacationData.end_date);
  // Suppression de la validation du tarif horaire

    // Validate time slots
    if (!timeSlots || timeSlots.length === 0) {
      setErrors(prev => ({ ...prev, time_slots: 'Au moins un créneau horaire est requis' }));
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins un créneau horaire",
        variant: "destructive"
      });
      return;
    }

  if (!isTitleValid || !isSpecialityValid || !isStartDateValid || !isEndDateValid) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure time slots are properly formatted and included
      const finalTimeSlots = timeSlots.map(slot => ({
        ...slot,
        vacation_id: vacationData.id || '', // Will be updated when vacation is saved
      }));

      const vacationPayload: Partial<VacationPost> = {
        ...vacationData,
        time_slots: finalTimeSlots,
        status: 'available' as VacationStatus
      };

      logger.info('Submitting vacation with time slots:', finalTimeSlots);
      onChange(vacationPayload);

      toast({
        title: "Succès",
        description: "Vacation sauvegardée avec succès",
      });
    } catch (error: any) {
      logger.error('Error saving vacation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder la vacation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={vacationData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          onBlur={() => handleBlur('title')}
          placeholder="Ex: Remplacement urgent en cardiologie"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="speciality">Spécialité</Label>
        <SpecialitySelector
          value={vacationData.speciality || ''}
          onChange={(value) => handleChange('speciality', value)}
          onBlur={() => handleBlur('speciality')}
          className={errors.speciality ? 'border-red-500' : ''}
        />
        {errors.speciality && (
          <p className="text-sm text-red-500">{errors.speciality}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="start_date">Date de début *</Label>
        <Input
          id="start_date"
          type="date"
          min={today}
          value={vacationData.start_date || ''}
          onChange={(e) => onChange({ ...vacationData, start_date: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="end_date">Date de fin *</Label>
        <Input
          id="end_date"
          type="date"
          min={vacationData.start_date || today}
          value={vacationData.end_date || ''}
          onChange={(e) => onChange({ ...vacationData, end_date: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Créneaux horaires *</Label>
        <TimeSlotSelector
          timeSlots={timeSlots}
          onChange={handleTimeSlotsChange}
        />
      </div>

      <div className="space-y-2">
  {/* Champ tarif horaire supprimé pour conformité réglementaire */}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          value={vacationData.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Ex: Paris, 75001"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={vacationData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Décrivez les détails de la vacation..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Exigences</Label>
        <Textarea
          id="requirements"
          value={vacationData.requirements || ''}
          onChange={(e) => handleChange('requirements', e.target.value)}
          placeholder="Listez les exigences spécifiques..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enregistrement...' : 'Publier la vacation'}
      </Button>
    </form>
  );
};

export default VacationForm;