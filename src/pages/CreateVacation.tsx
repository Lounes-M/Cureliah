import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLogger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client.browser";
import Header from "@/components/Header";
import VacationForm from "@/components/vacation/VacationForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
  MapPin,
  Euro,
  Users,
  Eye,
  Send,
  RefreshCw,
} from "lucide-react";
import { VacationPost, VacationStatus, Speciality } from "@/types/database";
import { useDebounce } from "@/hooks/useDebounce";
import { v4 as uuidv4 } from "uuid";

interface ValidationErrors {
  title?: string;
  speciality?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  hourly_rate?: string;
  time_slots?: string;
}

const CreateVacation = () => {
  const { vacationId } = useParams<{ vacationId: string }>();
  const isEditing = Boolean(vacationId);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const logger = useLogger();

  // États principaux
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const [formData, setFormData] = useState<Partial<VacationPost>>({
    title: "",
    description: "",
    speciality: "general" as Speciality,
    start_date: "",
    end_date: "",
    hourly_rate: 0,
    location: "",
    requirements: "",
    status: "draft" as VacationStatus,
  });

  const debouncedFormData = useDebounce(formData, 2000);

  // Calculer le pourcentage de completion
  const calculateCompletion = useCallback((data: Partial<VacationPost>) => {
    const requiredFields = [
      "title",
      "speciality",
      "start_date",
      "end_date",
      "location",
      "hourly_rate",
    ];
    const optionalFields = ["description", "requirements"];
    const timeSlots = data.time_slots || [];

    let completed = 0;
    let total = requiredFields.length + optionalFields.length + 1; // +1 pour time_slots

    // Champs obligatoires (poids: 2)
    requiredFields.forEach((field) => {
      if (
        data[field as keyof typeof data] &&
        String(data[field as keyof typeof data]).trim() !== ""
      ) {
        completed += 2;
      }
      total += 1; // Poids supplémentaire pour les champs obligatoires
    });

    // Champs optionnels (poids: 1)
    optionalFields.forEach((field) => {
      if (
        data[field as keyof typeof data] &&
        String(data[field as keyof typeof data]).trim() !== ""
      ) {
        completed += 1;
      }
    });

    // Créneaux horaires (poids: 2)
    if (timeSlots.length > 0) {
      completed += 2;
    }
    total += 1;

    return Math.round((completed / total) * 100);
  }, []);

  // Validation en temps réel
  const validateForm = useCallback(
    (data: Partial<VacationPost>): ValidationErrors => {
      const errors: ValidationErrors = {};

      if (!data.title || data.title.trim().length < 3) {
        errors.title = "Le titre doit contenir au moins 3 caractères";
      }

      if (!data.speciality) {
        errors.speciality = "La spécialité est obligatoire";
      }

      if (!data.start_date) {
        errors.start_date = "La date de début est obligatoire";
      } else {
        const startDate = new Date(data.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          errors.start_date = "La date de début ne peut pas être dans le passé";
        }
      }

      if (!data.end_date) {
        errors.end_date = "La date de fin est obligatoire";
      } else if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        if (endDate < startDate) {
          errors.end_date =
            "La date de fin ne peut pas être antérieure à la date de début";
        }
      }

      if (!data.location || data.location.trim().length < 2) {
        errors.location = "Le lieu doit contenir au moins 2 caractères";
      }

      if (!data.hourly_rate || data.hourly_rate <= 0) {
        errors.hourly_rate = "Le taux horaire doit être supérieur à 0";
      }

      if (!data.time_slots || data.time_slots.length === 0) {
        errors.time_slots = "Au moins un créneau horaire est requis";
      }

      return errors;
    },
    []
  );

  // Effets
  useEffect(() => {
    if (!user || profile?.user_type !== "doctor") {
      navigate("/auth");
      return;
    }

    if (vacationId) {
      fetchVacation();
    }
  }, [user, profile, vacationId]);

  useEffect(() => {
    const completion = calculateCompletion(formData);
    setCompletionPercentage(completion);

    const errors = validateForm(formData);
    setValidationErrors(errors);

    setHasUnsavedChanges(true);
  }, [formData, calculateCompletion, validateForm]);

  useEffect(() => {
    if (
      debouncedFormData &&
      Object.keys(debouncedFormData).length > 0 &&
      hasUnsavedChanges
    ) {
      autoSaveDraft();
    }
  }, [debouncedFormData]);

  // Fonctions principales
  const fetchVacation = async () => {
    if (!vacationId || !user) return;

    setInitialLoading(true);
    try {
      const { data: vacationData, error: vacationError } = await supabase
        .from("vacation_posts")
        .select("*")
        .eq("id", vacationId)
        .eq("doctor_id", user.id)
        .single();

      if (vacationError) throw vacationError;

      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("vacation_id", vacationId);

      if (timeSlotsError) throw timeSlotsError;

      setFormData({
        ...vacationData,
        time_slots: timeSlotsData || [],
      });

      setHasUnsavedChanges(false);
    } catch (error: any) {
      logger.error("Error fetching vacation", error as Error, { vacationId }, 'CreateVacation', 'fetch_vacation_error');
      toast({
        title: "Erreur",
        description: "Impossible de charger la vacation",
        variant: "destructive",
      });
      navigate("/doctor/manage-vacations");
    } finally {
      setInitialLoading(false);
    }
  };

  const autoSaveDraft = async () => {
    if (!user || !debouncedFormData.title || saving) return;

    setSaving(true);
    try {
      const vacationToSave = {
        ...debouncedFormData,
        doctor_id: user.id,
        status: "draft" as VacationStatus,
      };

      if (!vacationToSave.start_date) {
        vacationToSave.start_date = new Date().toISOString().split("T")[0];
      }
      if (!vacationToSave.end_date) {
        vacationToSave.end_date = vacationToSave.start_date;
      }

      delete vacationToSave.time_slots;

      let savedVacationId = vacationId;

      if (savedVacationId) {
        const { error } = await supabase
          .from("vacation_posts")
          .update(vacationToSave)
          .eq("id", savedVacationId)
          .eq("doctor_id", user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("vacation_posts")
          .insert({
            ...vacationToSave,
            id: uuidv4(),
          })
          .select()
          .single();

        if (error) throw error;
        savedVacationId = data.id;

        // Mettre à jour l'URL si c'est une nouvelle vacation
        window.history.replaceState(
          null,
          "",
          `/doctor/vacation/edit/${savedVacationId}`
        );
      }

      // Sauvegarder les créneaux horaires
      if (formData.time_slots?.length && savedVacationId) {
        await saveTimeSlots(savedVacationId, formData.time_slots);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error: any) {
      logger.error("Error auto-saving draft", error as Error, { vacationId, formData }, 'CreateVacation', 'auto_save_error');
    } finally {
      setSaving(false);
    }
  };

  const saveTimeSlots = async (vacationId: string, timeSlots: any[]) => {
    // Supprimer les anciens créneaux
    await supabase
      .from("vacation_availability")
      .delete()
      .eq("vacation_id", vacationId);

    await supabase.from("time_slots").delete().eq("vacation_id", vacationId);

    // Insérer les nouveaux créneaux
    const timeSlotsToSave = timeSlots.map((slot) => ({
      ...slot,
      id: uuidv4(),
      vacation_id: vacationId,
    }));

    const { data: savedTimeSlots, error: timeSlotsError } = await supabase
      .from("time_slots")
      .insert(timeSlotsToSave)
      .select();

    if (timeSlotsError) throw timeSlotsError;

    // Générer les disponibilités
    if (formData.start_date && formData.end_date && savedTimeSlots) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const availabilityToSave = [];

      for (
        let date = new Date(startDate);
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        for (const timeSlot of savedTimeSlots) {
          availabilityToSave.push({
            id: uuidv4(),
            vacation_id: vacationId,
            date: date.toISOString().split("T")[0],
            time_slot_id: timeSlot.id,
            is_available: true,
          });
        }
      }

      const { error: availabilityError } = await supabase
        .from("vacation_availability")
        .insert(availabilityToSave);

      if (availabilityError) throw availabilityError;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs avant de publier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { time_slots, ...vacationData } = formData;

      const vacationToSave = {
        ...vacationData,
        doctor_id: user.id,
        status: "available" as VacationStatus,
      };

      let savedVacationId = vacationId;

      if (savedVacationId) {
        const { error } = await supabase
          .from("vacation_posts")
          .update(vacationToSave)
          .eq("id", savedVacationId)
          .eq("doctor_id", user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("vacation_posts")
          .insert({
            ...vacationToSave,
            id: uuidv4(),
          })
          .select()
          .single();

        if (error) throw error;
        savedVacationId = data.id;
      }

      if (time_slots?.length && savedVacationId) {
        await saveTimeSlots(savedVacationId, time_slots);
      }

      toast({
        title: "Succès",
        description: isEditing
          ? "La vacation a été mise à jour et publiée"
          : "La vacation a été créée et publiée",
      });
      navigate("/doctor/manage-vacations");
    } catch (error: any) {
      logger.error("Error saving vacation", error as Error, { vacationId, formData }, 'CreateVacation', 'save_vacation_error');
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier la vacation",
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    await autoSaveDraft();
    toast({
      title: "Succès",
      description: "Brouillon enregistré avec succès",
    });
  };

  const getStatusIcon = () => {
    if (saving)
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    if (hasUnsavedChanges) return <Clock className="w-4 h-4 text-orange-600" />;
    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (saving) return "Enregistrement...";
    if (hasUnsavedChanges) return "Modifications non sauvegardées";
    if (lastSaved) return `Sauvegardé ${lastSaved.toLocaleTimeString()}`;
    return "Sauvegardé";
  };

  const canPublish =
    completionPercentage >= 80 && Object.keys(validationErrors).length === 0;

  if (!user || profile?.user_type !== "doctor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-red-600 mb-2">
              Accès restreint
            </div>
            <div className="text-gray-600">
              Vous devez être connecté en tant que médecin pour créer une
              vacation.
            </div>
            <Button onClick={() => navigate("/auth")} className="mt-4">
              Se connecter
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-lg font-medium">
              Chargement de la vacation...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec navigation et statut */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/doctor/manage-vacations")}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux vacations
            </Button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                {getStatusIcon()}
                <span className="text-gray-600">{getStatusText()}</span>
              </div>

              <Badge
                variant={formData.status === "draft" ? "secondary" : "default"}
              >
                {formData.status === "draft" ? "Brouillon" : "Publié"}
              </Badge>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEditing
                ? "Modifier la vacation"
                : "Créer une nouvelle vacation"}
            </h1>
            <p className="text-gray-600">
              {isEditing
                ? "Modifiez les détails de votre vacation et publiez-la pour la rendre visible"
                : "Créez une nouvelle vacation en remplissant tous les champs requis"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Détails de la vacation
                    </CardTitle>
                    <CardDescription>
                      Remplissez tous les champs obligatoires marqués d'un
                      astérisque (*)
                    </CardDescription>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {completionPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">Complété</div>
                    <Progress
                      value={completionPercentage}
                      className="w-20 h-2 mt-1"
                    />
                  </div>
                </div>
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

            {/* Alertes de validation */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert
                variant="warning"
                className="border-orange-200 bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">
                    Veuillez corriger les erreurs suivantes :
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Panneau latéral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Résumé de la vacation */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Aperçu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-medium">Période</div>
                    <div className="text-gray-600">
                      {formData.start_date && formData.end_date
                        ? `${new Date(
                            formData.start_date
                          ).toLocaleDateString()} - ${new Date(
                            formData.end_date
                          ).toLocaleDateString()}`
                        : "Non définie"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-medium">Lieu</div>
                    <div className="text-gray-600">
                      {formData.location || "Non défini"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Euro className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-medium">Taux horaire</div>
                    <div className="text-gray-600">
                      {formData.hourly_rate || 0}€/h
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="font-medium">Créneaux</div>
                    <div className="text-gray-600">
                      {formData.time_slots?.length || 0} créneau(x)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !canPublish}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isEditing
                      ? "Mettre à jour et publier"
                      : "Créer et publier"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer comme brouillon
                  </Button>

                  {formData.status === "available" && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/vacation/${vacationId}`)}
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Aperçu public
                    </Button>
                  )}
                </div>

                {!canPublish && (
                  <div className="mt-4 text-xs text-gray-500">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Complétez au moins 80% du formulaire pour publier
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVacation;
