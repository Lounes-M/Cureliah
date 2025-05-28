
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';

const CreateVacation = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [vacationData, setVacationData] = useState({
    title: '',
    description: '',
    speciality: '',
    hourly_rate: '',
    location: '',
    requirements: ''
  });

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

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
      const { error } = await supabase
        .from('vacation_posts')
        .insert({
          doctor_id: user.id,
          title: vacationData.title,
          description: vacationData.description || null,
          speciality: vacationData.speciality,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          hourly_rate: parseFloat(vacationData.hourly_rate),
          location: vacationData.location || null,
          requirements: vacationData.requirements || null
        });

      if (error) throw error;

      toast({
        title: "Vacation publiée !",
        description: "Votre vacation a été publiée avec succès.",
      });

      navigate('/doctor/dashboard');
    } catch (error: any) {
      console.error('Error creating vacation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || profile?.user_type !== 'doctor') {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/doctor/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Publier une nouvelle vacation</CardTitle>
            <CardDescription>
              Créez une annonce pour proposer vos services médicaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la vacation *</Label>
                <Input
                  id="title"
                  value={vacationData.title}
                  onChange={(e) => setVacationData({...vacationData, title: e.target.value})}
                  placeholder="Ex: Vacation de garde en cardiologie"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={vacationData.description}
                  onChange={(e) => setVacationData({...vacationData, description: e.target.value})}
                  placeholder="Décrivez les détails de la vacation..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speciality">Spécialité *</Label>
                  <Select 
                    value={vacationData.speciality} 
                    onValueChange={(value) => setVacationData({...vacationData, speciality: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Cardiologie</SelectItem>
                      <SelectItem value="neurology">Neurologie</SelectItem>
                      <SelectItem value="orthopedics">Orthopédie</SelectItem>
                      <SelectItem value="pediatrics">Pédiatrie</SelectItem>
                      <SelectItem value="psychiatry">Psychiatrie</SelectItem>
                      <SelectItem value="radiology">Radiologie</SelectItem>
                      <SelectItem value="surgery">Chirurgie</SelectItem>
                      <SelectItem value="general_medicine">Médecine générale</SelectItem>
                      <SelectItem value="dermatology">Dermatologie</SelectItem>
                      <SelectItem value="gynecology">Gynécologie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarif horaire (€) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={vacationData.hourly_rate}
                    onChange={(e) => setVacationData({...vacationData, hourly_rate: e.target.value})}
                    placeholder="120.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Date de fin *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date <= (startDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  value={vacationData.location}
                  onChange={(e) => setVacationData({...vacationData, location: e.target.value})}
                  placeholder="Ex: Paris, Marseille, Lyon..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Exigences particulières</Label>
                <Textarea
                  id="requirements"
                  value={vacationData.requirements}
                  onChange={(e) => setVacationData({...vacationData, requirements: e.target.value})}
                  placeholder="Ex: Expérience en urgences requise, garde de nuit..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Publication...' : 'Publier la vacation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateVacation;
