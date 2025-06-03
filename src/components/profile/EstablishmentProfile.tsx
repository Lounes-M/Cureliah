import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Mail, Phone, MapPin, Calendar, Users, Briefcase, FileText, Globe, CreditCard, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadProfilePicture } from '@/services/profileService';

interface EstablishmentProfile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  specialties: string[];
  description: string;
  services: string[];
  facilities: string[];
  staff_count: number;
  operating_hours: {
    days: string[];
    hours: string;
  };
  insurance_accepted: string[];
  payment_methods: string[];
  siret: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  profile_picture_url: string;
}

export default function EstablishmentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishmentProfile, setEstablishmentProfile] = useState<EstablishmentProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch establishment profile
      const { data: establishmentData, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (establishmentError) throw establishmentError;

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      setEstablishmentProfile(establishmentData);
      setUserProfile(userData);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les profils",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setProfileImage(file);

      const publicUrl = await uploadProfilePicture(user?.id || '', file, 'establishment');
      setEstablishmentProfile(prev => prev ? { ...prev, logo_url: publicUrl } : null);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user || !establishmentProfile || !userProfile) return;

    try {
      setSaving(true);

      // Update establishment profile
      const { error: establishmentError } = await supabase
        .from('establishment_profiles')
        .update({
          name: establishmentProfile.name,
          type: establishmentProfile.type,
          specialties: establishmentProfile.specialties,
          description: establishmentProfile.description,
          services: establishmentProfile.services,
          facilities: establishmentProfile.facilities,
          staff_count: establishmentProfile.staff_count,
          operating_hours: establishmentProfile.operating_hours,
          insurance_accepted: establishmentProfile.insurance_accepted,
          payment_methods: establishmentProfile.payment_methods,
          siret: establishmentProfile.siret,
          logo_url: establishmentProfile.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (establishmentError) throw establishmentError;

      // Update user profile
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          phone: userProfile.phone,
          address: userProfile.address,
          city: userProfile.city,
          postal_code: userProfile.postal_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userError) throw userError;

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
    } catch (error: any) {
      console.error('Error saving profiles:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde du profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Chargement du profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profil Établissement</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={establishmentProfile?.logo_url} />
            <AvatarFallback className="text-lg">
              {establishmentProfile?.name?.[0] || 'E'}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="profile-image"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 text-gray-600" />
          </label>
          <input
            id="profile-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="w-4 h-4 mr-2" />
            Informations générales
          </TabsTrigger>
          <TabsTrigger value="services">
            <Briefcase className="w-4 h-4 mr-2" />
            Services et équipements
          </TabsTrigger>
          <TabsTrigger value="operating">
            <Calendar className="w-4 h-4 mr-2" />
            Horaires et paiement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Informations de base de l'établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom de l'établissement</label>
                <Input
                  value={establishmentProfile?.name || ''}
                  onChange={(e) => setEstablishmentProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'établissement</label>
                <Input
                  value={establishmentProfile?.type || ''}
                  onChange={(e) => setEstablishmentProfile(prev => prev ? { ...prev, type: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro SIRET</label>
                <Input
                  value={establishmentProfile?.siret || ''}
                  onChange={(e) => setEstablishmentProfile(prev => prev ? { ...prev, siret: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={establishmentProfile?.description || ''}
                  onChange={(e) => setEstablishmentProfile(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Spécialités</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentProfile?.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Effectif</label>
                <Input
                  type="number"
                  value={establishmentProfile?.staff_count || 0}
                  onChange={(e) => setEstablishmentProfile(prev => prev ? { ...prev, staff_count: parseInt(e.target.value) } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={userProfile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  value={userProfile?.phone || ''}
                  onChange={(e) => setUserProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <Input
                  value={userProfile?.address || ''}
                  onChange={(e) => setUserProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ville</label>
                  <Input
                    value={userProfile?.city || ''}
                    onChange={(e) => setUserProfile(prev => prev ? { ...prev, city: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code postal</label>
                  <Input
                    value={userProfile?.postal_code || ''}
                    onChange={(e) => setUserProfile(prev => prev ? { ...prev, postal_code: e.target.value } : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services et équipements</CardTitle>
              <CardDescription>
                Services proposés et équipements disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Services proposés</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentProfile?.services.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Équipements</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentProfile?.facilities.map((facility, index) => (
                    <Badge key={index} variant="outline">
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operating">
          <Card>
            <CardHeader>
              <CardTitle>Horaires et paiement</CardTitle>
              <CardDescription>
                Horaires d'ouverture et méthodes de paiement acceptées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jours d'ouverture</label>
                <div className="flex flex-wrap gap-2">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <Badge
                      key={day}
                      variant={establishmentProfile?.operating_hours.days.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const days = establishmentProfile?.operating_hours.days || [];
                        const newDays = days.includes(day)
                          ? days.filter(d => d !== day)
                          : [...days, day];
                        setEstablishmentProfile(prev => prev ? {
                          ...prev,
                          operating_hours: { ...prev.operating_hours, days: newDays }
                        } : null);
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Horaires d'ouverture</label>
                <Input
                  value={establishmentProfile?.operating_hours.hours || ''}
                  onChange={(e) => setEstablishmentProfile(prev => prev ? {
                    ...prev,
                    operating_hours: { ...prev.operating_hours, hours: e.target.value }
                  } : null)}
                  placeholder="ex: 9h-12h, 14h-18h"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assurances acceptées</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentProfile?.insurance_accepted.map((insurance, index) => (
                    <Badge key={index} variant="secondary">
                      {insurance}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Méthodes de paiement acceptées</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentProfile?.payment_methods.map((method, index) => (
                    <Badge key={index} variant="outline">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 