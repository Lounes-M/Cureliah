import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Euro,
  Stethoscope,
  Save,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VacationFormData {
  title: string;
  description: string;
  location: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  start_time: string;
  end_time: string;
  hourly_rate: string;
  act_type: string;
  requirements: string;
  status: string;
}

const CreateVacation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VacationFormData>({
    title: '',
    description: '',
    location: '',
    start_date: undefined,
    end_date: undefined,
    start_time: '08:00',
    end_time: '18:00',
    hourly_rate: '',
    act_type: 'consultation',
    requirements: '',
    status: 'draft'
  });

  const actTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'surgery', label: 'Chirurgie' },
    { value: 'emergency', label: 'Urgences' },
    { value: 'home_visit', label: 'Visite à domicile' },
    { value: 'teleconsultation', label: 'Téléconsultation' }
  ];

  const handleInputChange = (field: keyof VacationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.location || !formData.start_date || !formData.end_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const vacationData = {
        doctor_id: user.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        start_time: formData.start_time,
        end_time: formData.end_time,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        act_type: formData.act_type,
        requirements: formData.requirements,
        status: isDraft ? 'draft' : 'available',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('vacation_posts')
        .insert([vacationData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: isDraft ? "Vacation sauvegardée en brouillon" : "Vacation créée et publiée",
      });

      navigate('/doctor/manage-vacations');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vacation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/doctor/manage-vacations')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux vacations
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créer une nouvelle vacation
          </h1>
          <p className="text-gray-600">
            Ajoutez une vacation à votre planning pour permettre aux établissements de vous réserver
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Informations de la vacation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Titre et description */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre de la vacation *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Ex: Remplacement médecin généraliste"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Décrivez les détails de la vacation..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Lieu et type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Lieu *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Ville, département"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="act_type">Type d'acte</Label>
                    <Select value={formData.act_type} onValueChange={(value) => handleInputChange('act_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, 'PPP', { locale: fr }) : 'Sélectionner'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => handleInputChange('start_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>Date de fin *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, 'PPP', { locale: fr }) : 'Sélectionner'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => handleInputChange('end_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Horaires */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Heure de début</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Heure de fin</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => handleInputChange('end_time', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarif */}
                <div>
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                      placeholder="45"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Exigences */}
                <div>
                  <Label htmlFor="requirements">Exigences particulières</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="Diplômes spécifiques, expérience requise..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aperçu et actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  Aperçu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {formData.title || 'Titre de la vacation'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.location || 'Lieu non spécifié'}
                  </p>
                </div>
                
                {formData.start_date && formData.end_date && (
                  <div className="text-sm">
                    <p className="font-medium">Période :</p>
                    <p className="text-gray-600">
                      Du {format(formData.start_date, 'dd/MM/yyyy', { locale: fr })} au {format(formData.end_date, 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                )}
                
                <div className="text-sm">
                  <p className="font-medium">Horaires :</p>
                  <p className="text-gray-600">
                    {formData.start_time} - {formData.end_time}
                  </p>
                </div>
                
                {formData.hourly_rate && (
                  <div className="text-sm">
                    <p className="font-medium">Tarif :</p>
                    <p className="text-gray-600">
                      {formData.hourly_rate}€/heure
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Publier la vacation
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="w-full"
                >
                  Sauvegarder en brouillon
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/doctor/manage-vacations')}
                  className="w-full"
                >
                  Annuler
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVacation;
