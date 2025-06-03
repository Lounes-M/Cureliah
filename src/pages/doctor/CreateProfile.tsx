import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SPECIALITIES } from '@/utils/specialities';
import Header from '@/components/Header';

const CreateProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    speciality: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    bio: '',
    experience_years: '',
    education: '',
    certifications: '',
    languages: '',
    availability: '',
    hourly_rate: '',
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      navigate('/auth');
      return;
    }

    // Vérifier si les données de l'utilisateur sont présentes
    if (!location.state?.email) {
      navigate('/auth');
      return;
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profil créé !",
        description: "Votre profil a été créé avec succès.",
      });

      // Rediriger vers le tableau de bord
      navigate('/doctor/dashboard');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du profil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Créer votre profil médecin</CardTitle>
            <CardDescription>
              Complétez votre profil pour commencer à proposer vos services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="speciality">Spécialité</Label>
                  <Select
                    value={profileData.speciality}
                    onValueChange={(value) => setProfileData({ ...profileData, speciality: value })}
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

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="123 rue Example"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={profileData.postal_code}
                      onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                      placeholder="75000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Parlez-nous de vous..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="experience_years">Années d'expérience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={profileData.experience_years}
                    onChange={(e) => setProfileData({ ...profileData, experience_years: e.target.value })}
                    placeholder="5"
                  />
                </div>

                <div>
                  <Label htmlFor="education">Formation</Label>
                  <Textarea
                    id="education"
                    value={profileData.education}
                    onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                    placeholder="Votre parcours de formation..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">Certifications</Label>
                  <Textarea
                    id="certifications"
                    value={profileData.certifications}
                    onChange={(e) => setProfileData({ ...profileData, certifications: e.target.value })}
                    placeholder="Vos certifications..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Langues parlées</Label>
                  <Input
                    id="languages"
                    value={profileData.languages}
                    onChange={(e) => setProfileData({ ...profileData, languages: e.target.value })}
                    placeholder="Français, Anglais, Espagnol..."
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Disponibilités</Label>
                  <Textarea
                    id="availability"
                    value={profileData.availability}
                    onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })}
                    placeholder="Vos disponibilités habituelles..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={profileData.hourly_rate}
                    onChange={(e) => setProfileData({ ...profileData, hourly_rate: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création en cours..." : "Créer mon profil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProfile; 