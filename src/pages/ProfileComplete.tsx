
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { SPECIALITIES, ESTABLISHMENT_TYPES } from '@/utils/specialities';

const ProfileComplete = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [doctorData, setDoctorData] = useState({
    speciality: '',
    license_number: '',
    experience_years: '',
    hourly_rate: '',
    bio: ''
  });

  const [establishmentData, setEstablishmentData] = useState({
    name: '',
    establishment_type: '',
    siret: '',
    address: '',
    city: '',
    postal_code: '',
    description: ''
  });

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }
  }, [user, profile]);

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .insert({
          id: user.id,
          speciality: doctorData.speciality,
          license_number: doctorData.license_number,
          experience_years: doctorData.experience_years ? parseInt(doctorData.experience_years) : null,
          hourly_rate: doctorData.hourly_rate ? parseFloat(doctorData.hourly_rate) : null,
          bio: doctorData.bio || null
        });

      if (error) throw error;

      toast({
        title: "Profil complété !",
        description: "Votre profil médecin a été créé avec succès.",
      });

      navigate('/doctor/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEstablishmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('establishment_profiles')
        .insert({
          id: user.id,
          name: establishmentData.name,
          establishment_type: establishmentData.establishment_type as any,
          siret: establishmentData.siret || null,
          address: establishmentData.address || null,
          city: establishmentData.city || null,
          postal_code: establishmentData.postal_code || null,
          description: establishmentData.description || null
        });

      if (error) throw error;

      toast({
        title: "Profil complété !",
        description: "Votre profil établissement a été créé avec succès.",
      });

      navigate('/establishment/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen">
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
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Complétez votre profil</CardTitle>
            <CardDescription>
              {profile.user_type === 'doctor' 
                ? 'Complétez votre profil médecin pour commencer à publier des vacations'
                : 'Complétez votre profil établissement pour commencer à réserver des vacations'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.user_type === 'doctor' ? (
              <form onSubmit={handleDoctorSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="speciality">Spécialité *</Label>
                  <Select 
                    value={doctorData.speciality} 
                    onValueChange={(value) => setDoctorData({...doctorData, speciality: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPECIALITIES).map(([key, speciality]) => (
                        <SelectItem key={key} value={key}>
                          {speciality.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number">Numéro de licence *</Label>
                  <Input
                    id="license_number"
                    value={doctorData.license_number}
                    onChange={(e) => setDoctorData({...doctorData, license_number: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Années d'expérience</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      value={doctorData.experience_years}
                      onChange={(e) => setDoctorData({...doctorData, experience_years: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={doctorData.hourly_rate}
                      onChange={(e) => setDoctorData({...doctorData, hourly_rate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    value={doctorData.bio}
                    onChange={(e) => setDoctorData({...doctorData, bio: e.target.value})}
                    placeholder="Présentez-vous brièvement..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Création...' : 'Créer mon profil médecin'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEstablishmentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'établissement *</Label>
                  <Input
                    id="name"
                    value={establishmentData.name}
                    onChange={(e) => setEstablishmentData({...establishmentData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishment_type">Type d'établissement *</Label>
                  <Select 
                    value={establishmentData.establishment_type} 
                    onValueChange={(value) => setEstablishmentData({...establishmentData, establishment_type: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESTABLISHMENT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={establishmentData.siret}
                    onChange={(e) => setEstablishmentData({...establishmentData, siret: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={establishmentData.address}
                    onChange={(e) => setEstablishmentData({...establishmentData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={establishmentData.city}
                      onChange={(e) => setEstablishmentData({...establishmentData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={establishmentData.postal_code}
                      onChange={(e) => setEstablishmentData({...establishmentData, postal_code: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={establishmentData.description}
                    onChange={(e) => setEstablishmentData({...establishmentData, description: e.target.value})}
                    placeholder="Décrivez votre établissement..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Création...' : 'Créer mon profil établissement'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileComplete;
