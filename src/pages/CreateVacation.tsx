import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import VacationForm from '@/components/vacation/VacationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { VacationPost, VacationStatus, Speciality } from '@/types/database';
import { useDebounce } from '@/hooks/useDebounce';
import { v4 as uuidv4 } from 'uuid';

const CreateVacation = () => {
  const { vacationId } = useParams<{ vacationId: string }>();
  const isEditing = Boolean(vacationId);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VacationPost>>({
    title: '',
    description: '',
    speciality: 'general' as Speciality,
    start_date: '',
    end_date: '',
    hourly_rate: 0,
    location: '',
    requirements: '',
    status: 'draft' as VacationStatus
  });

  const debouncedFormData = useDebounce(formData, 2000);

  useEffect(() => {
    if (!user || profile?.user_type !== 'doctor') {
      navigate('/auth');
      return;
    }

    if (vacationId) {
      fetchVacation();
    }
  }, [user, profile, vacationId]);

  useEffect(() => {
    if (debouncedFormData && Object.keys(debouncedFormData).length > 0) {
      autoSaveDraft();
    }
  }, [debouncedFormData]);

  const fetchVacation = async () => {
    if (!vacationId || !user) return;

    setInitialLoading(true);
    try {
      // Fetch vacation data
      const { data: vacationData, error: vacationError } = await supabase
        .from('vacation_posts')
        .select('*')
        .eq('id', vacationId)
        .eq('doctor_id', user.id)
        .single();

      if (vacationError) throw vacationError;

      // Fetch time slots
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('vacation_id', vacationId);

      if (timeSlotsError) throw timeSlotsError;

      // Combine the data
      setFormData({
        ...vacationData,
        time_slots: timeSlotsData || []
      });
    } catch (error: any) {
      console.error('Error fetching vacation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la vacation",
        variant: "destructive"
      });
      navigate('/doctor/manage-vacations');
    } finally {
      setInitialLoading(false);
    }
  };

  const autoSaveDraft = async () => {
    if (!user || !debouncedFormData.title) return;

    setSaving(true);
    try {
      const vacationToSave = {
        ...debouncedFormData,
        doctor_id: user.id,
      };

      // Ensure dates are set to today if not provided
      if (!vacationToSave.start_date) {
        vacationToSave.start_date = new Date().toISOString().split('T')[0];
      }
      if (!vacationToSave.end_date) {
        vacationToSave.end_date = vacationToSave.start_date;
      }

      // Remove time_slots from vacationToSave as it's not a column
      delete vacationToSave.time_slots;

      let savedVacationId = vacationId;

      if (savedVacationId) {
        const { error } = await supabase
          .from('vacation_posts')
          .update(vacationToSave)
          .eq('id', savedVacationId)
          .eq('doctor_id', user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('vacation_posts')
          .insert({
            ...vacationToSave,
            id: uuidv4()
          })
          .select()
          .single();

        if (error) throw error;
        savedVacationId = data.id;
      }

      // Save time slots if they exist in formData
      if (formData.time_slots?.length) {
        // First, delete existing time slots and availability
        if (savedVacationId) {
          await supabase
            .from('vacation_availability')
            .delete()
            .eq('vacation_id', savedVacationId);

          await supabase
            .from('time_slots')
            .delete()
            .eq('vacation_id', savedVacationId);
        }

        // Then insert new time slots with unique IDs
        const timeSlotsToSave = formData.time_slots.map(slot => ({
          ...slot,
          id: uuidv4(),
          vacation_id: savedVacationId
        }));

        const { data: savedTimeSlots, error: timeSlotsError } = await supabase
          .from('time_slots')
          .insert(timeSlotsToSave)
          .select();

        if (timeSlotsError) throw timeSlotsError;

        // Generate availability for each day in the date range
        if (formData.start_date && formData.end_date) {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(formData.end_date);
          const availabilityToSave = [];

          for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            for (const timeSlot of savedTimeSlots) {
              availabilityToSave.push({
                id: uuidv4(),
                vacation_id: savedVacationId,
                date: date.toISOString().split('T')[0],
                time_slot_id: timeSlot.id,
                is_available: true
              });
            }
          }

          const { error: availabilityError } = await supabase
            .from('vacation_availability')
            .insert(availabilityToSave);

          if (availabilityError) throw availabilityError;
        }
      }
    } catch (error: any) {
      console.error('Error auto-saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation des champs requis
    if (!formData.title || !formData.speciality || !formData.start_date || !formData.end_date) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Validation des dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast({
        title: "Erreur de validation",
        description: "La date de début ne peut pas être dans le passé",
        variant: "destructive"
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Erreur de validation",
        description: "La date de fin ne peut pas être antérieure à la date de début",
        variant: "destructive"
      });
      return;
    }

    // Validation des créneaux horaires
    if (!formData.time_slots || formData.time_slots.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins un créneau horaire",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Créer une copie de formData sans time_slots
      const { time_slots, ...vacationData } = formData;
      
      const vacationToSave = {
        ...vacationData,
        doctor_id: user.id,
        status: 'available' as VacationStatus
      };

      let savedVacationId = vacationId;

      if (savedVacationId) {
        const { error } = await supabase
          .from('vacation_posts')
          .update(vacationToSave)
          .eq('id', savedVacationId)
          .eq('doctor_id', user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('vacation_posts')
          .insert({
            ...vacationToSave,
            id: uuidv4()
          })
          .select()
          .single();

        if (error) throw error;
        savedVacationId = data.id;
      }

      // Save time slots and availability
      if (time_slots?.length) {
        // First, delete existing time slots and availability
        if (savedVacationId) {
          await supabase
            .from('vacation_availability')
            .delete()
            .eq('vacation_id', savedVacationId);

          await supabase
            .from('time_slots')
            .delete()
            .eq('vacation_id', savedVacationId);
        }

        // Then insert new time slots with unique IDs
        const timeSlotsToSave = time_slots.map(slot => ({
          ...slot,
          id: uuidv4(),
          vacation_id: savedVacationId
        }));

        const { data: savedTimeSlots, error: timeSlotsError } = await supabase
          .from('time_slots')
          .insert(timeSlotsToSave)
          .select();

        if (timeSlotsError) throw timeSlotsError;

        // Generate availability for each day in the date range
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const availabilityToSave = [];

        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          for (const timeSlot of savedTimeSlots) {
            availabilityToSave.push({
              id: uuidv4(),
              vacation_id: savedVacationId,
              date: date.toISOString().split('T')[0],
              time_slot_id: timeSlot.id,
              is_available: true
            });
          }
        }

        const { error: availabilityError } = await supabase
          .from('vacation_availability')
          .insert(availabilityToSave);

        if (availabilityError) throw availabilityError;
      }

      toast({
        title: "Succès",
        description: isEditing ? "La vacation a été mise à jour" : "La vacation a été créée",
      });
      navigate('/doctor/manage-vacations');
    } catch (error: any) {
      console.error('Error saving vacation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder la vacation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !formData.title) {
      toast({
        title: "Erreur",
        description: "Le titre est requis pour enregistrer un brouillon",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Créer une copie de formData sans time_slots
      const { time_slots, ...vacationData } = formData;
      
      const vacationToSave = {
        ...vacationData,
        doctor_id: user.id,
        status: 'draft' as VacationStatus
      };

      let savedVacationId = vacationId;

      if (savedVacationId) {
        const { error } = await supabase
          .from('vacation_posts')
          .update(vacationToSave)
          .eq('id', savedVacationId)
          .eq('doctor_id', user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('vacation_posts')
          .insert({
            ...vacationToSave,
            id: uuidv4()
          })
          .select()
          .single();

        if (error) throw error;
        savedVacationId = data.id;
      }

      // Save time slots if they exist
      if (time_slots?.length) {
        // First, delete existing time slots and availability
        if (savedVacationId) {
          await supabase
            .from('vacation_availability')
            .delete()
            .eq('vacation_id', savedVacationId);

          await supabase
            .from('time_slots')
            .delete()
            .eq('vacation_id', savedVacationId);
        }

        // Then insert new time slots
        const timeSlotsToSave = time_slots.map(slot => ({
          ...slot,
          id: uuidv4(),
          vacation_id: savedVacationId
        }));

        const { data: savedTimeSlots, error: timeSlotsError } = await supabase
          .from('time_slots')
          .insert(timeSlotsToSave)
          .select();

        if (timeSlotsError) throw timeSlotsError;

        // Generate availability for each day in the date range
        if (formData.start_date && formData.end_date) {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(formData.end_date);
          const availabilityToSave = [];

          for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            for (const timeSlot of savedTimeSlots) {
              availabilityToSave.push({
                id: uuidv4(),
                vacation_id: savedVacationId,
                date: date.toISOString().split('T')[0],
                time_slot_id: timeSlot.id,
                is_available: true
              });
            }
          }

          const { error: availabilityError } = await supabase
            .from('vacation_availability')
            .insert(availabilityToSave);

          if (availabilityError) throw availabilityError;
        }
      }

      toast({
        title: "Succès",
        description: "Brouillon enregistré",
      });

      // Rediriger vers la page de gestion des vacations
      navigate('/doctor/manage-vacations');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le brouillon",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user || profile?.user_type !== 'doctor') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-red-600">Vous devez être connecté en tant que médecin pour créer une vacation.</div>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/doctor/manage-vacations')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux vacations
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Modifier la vacation' : 'Créer une nouvelle vacation'}
          </h1>
          <p className="text-gray-500">
            {isEditing
              ? 'Modifiez les détails de votre vacation'
              : 'Remplissez le formulaire ci-dessous pour créer une nouvelle vacation'}
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la vacation</CardTitle>
              <CardDescription>
                Remplissez tous les champs obligatoires marqués d'un astérisque (*)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VacationForm
                vacationId={vacationId}
                isEditing={isEditing}
                onLoadingChange={setInitialLoading}
                vacationData={formData}
                onChange={setFormData}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={loading || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer comme brouillon'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVacation;
