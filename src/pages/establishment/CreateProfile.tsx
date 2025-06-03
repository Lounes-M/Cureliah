import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

const CreateProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    establishment_name: '',
    siret: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    description: '',
    specialties: '',
    opening_hours: '',
    website: '',
    social_media: '',
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
      if (!user?.id) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer un profil.",
          variant: "destructive",
        });
        return;
      }

      // 1. Vérifier si le SIRET existe déjà
      const { data: existingSiret, error: siretError } = await supabase
        .from('establishment_profiles')
        .select('siret')
        .eq('siret', profileData.siret)
        .single();

      if (existingSiret) {
        toast({
          title: "Erreur",
          description: "Ce numéro SIRET est déjà utilisé par un autre établissement.",
          variant: "destructive",
        });
        return;
      }

      // 2. Créer le profil de base
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: location.state.email,
            user_type: 'establishment',
            first_name: location.state.firstName,
            last_name: location.state.lastName,
            is_active: true,
            is_verified: false,
            updated_at: new Date().toISOString()
          }
        ]);

      if (profileError) {
        console.error('Error creating base profile:', profileError);
        throw profileError;
      }

      // 3. Créer le profil établissement
      const { error: establishmentError } = await supabase
        .from('establishment_profiles')
        .insert([
          {
            id: user.id,
            name: profileData.establishment_name,
            siret: profileData.siret,
            phone: profileData.phone,
            address: profileData.address,
            city: profileData.city,
            postal_code: profileData.postal_code,
            description: profileData.description,
            specialties: profileData.specialties,
            opening_hours: profileData.opening_hours,
            website: profileData.website,
            social_media: profileData.social_media,
            updated_at: new Date().toISOString()
          }
        ]);

      if (establishmentError) {
        console.error('Error creating establishment profile:', establishmentError);
        throw establishmentError;
      }

      toast({
        title: "Profil créé !",
        description: "Votre profil a été créé avec succès.",
      });

      // Rediriger vers le tableau de bord
      navigate('/establishment/dashboard');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du profil.",
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
            <CardTitle>Créer votre profil établissement</CardTitle>
            <CardDescription>
              Complétez votre profil pour commencer à publier des offres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="establishment_name">Nom de l'établissement</Label>
                  <Input
                    id="establishment_name"
                    value={profileData.establishment_name}
                    onChange={(e) => setProfileData({ ...profileData, establishment_name: e.target.value })}
                    placeholder="Clinique Example"
                  />
                </div>

                <div>
                  <Label htmlFor="siret">Numéro SIRET</Label>
                  <Input
                    id="siret"
                    value={profileData.siret}
                    onChange={(e) => setProfileData({ ...profileData, siret: e.target.value })}
                    placeholder="123 456 789 00012"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    placeholder="Présentez votre établissement..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="specialties">Spécialités recherchées</Label>
                  <Textarea
                    id="specialties"
                    value={profileData.specialties}
                    onChange={(e) => setProfileData({ ...profileData, specialties: e.target.value })}
                    placeholder="Listez les spécialités médicales que vous recherchez..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="opening_hours">Horaires d'ouverture</Label>
                  <Textarea
                    id="opening_hours"
                    value={profileData.opening_hours}
                    onChange={(e) => setProfileData({ ...profileData, opening_hours: e.target.value })}
                    placeholder="Lundi - Vendredi: 9h - 19h..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="social_media">Réseaux sociaux</Label>
                  <Input
                    id="social_media"
                    value={profileData.social_media}
                    onChange={(e) => setProfileData({ ...profileData, social_media: e.target.value })}
                    placeholder="LinkedIn, Twitter, etc."
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