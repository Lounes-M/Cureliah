import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Upload, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ESTABLISHMENT_TYPES } from '@/utils/specialities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { uploadProfilePicture } from '@/services/profileService';

interface EstablishmentProfileFormProps {
  userId: string;
  existingProfile?: any;
  onSuccess: () => void;
}

export default function EstablishmentProfileForm({ userId, existingProfile, onSuccess }: EstablishmentProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(existingProfile?.logo_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [establishmentData, setEstablishmentData] = useState({
    name: existingProfile?.name || '',
    establishment_type: existingProfile?.establishment_type || '',
    siret: existingProfile?.siret || '',
    address: existingProfile?.address || '',
    city: existingProfile?.city || '',
    postal_code: existingProfile?.postal_code || '',
    description: existingProfile?.description || '',
    specialties: existingProfile?.specialties || [],
    services: existingProfile?.services || [],
    facilities: existingProfile?.facilities || [],
    staff_count: existingProfile?.staff_count || '',
    operating_hours: existingProfile?.operating_hours || {
      days: [],
      hours: ''
    },
    insurance_accepted: existingProfile?.insurance_accepted || [],
    payment_methods: existingProfile?.payment_methods || []
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      setProfileImage(file);

      const publicUrl = await uploadProfilePicture(userId, file, 'establishment');
      setProfileImageUrl(publicUrl);
      setEstablishmentData(prev => ({ ...prev, logo_url: publicUrl }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive"
      });
      return;
    }

    if (!establishmentData.name || !establishmentData.establishment_type || !establishmentData.siret) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const profileData = {
        name: establishmentData.name,
        establishment_type: establishmentData.establishment_type,
        siret: establishmentData.siret,
        address: establishmentData.address,
        city: establishmentData.city,
        postal_code: establishmentData.postal_code,
        description: establishmentData.description || null,
        specialties: establishmentData.specialties,
        services: establishmentData.services,
        facilities: establishmentData.facilities,
        staff_count: establishmentData.staff_count ? parseInt(establishmentData.staff_count) : null,
        operating_hours: establishmentData.operating_hours,
        insurance_accepted: establishmentData.insurance_accepted,
        payment_methods: establishmentData.payment_methods,
        logo_url: profileImageUrl
      };

      let result;
      
      if (existingProfile) {
        result = await supabase
          .from('establishment_profiles')
          .update(profileData)
          .eq('id', userId);
      } else {
        result = await supabase
          .from('establishment_profiles')
          .insert({
            id: userId,
            ...profileData
          });
      }

      const { error } = result;

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving establishment profile:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde du profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {establishmentData.name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 text-gray-600" />
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {profileImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImageUrl(null);
                    }}
                    className="absolute top-0 right-0 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">Logo de l'établissement</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom de l'établissement *</label>
                <Input
                  value={establishmentData.name}
                  onChange={(e) => setEstablishmentData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'établissement *</label>
                <Select 
                  value={establishmentData.establishment_type} 
                  onValueChange={(value) => setEstablishmentData(prev => ({ ...prev, establishment_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type d'établissement" />
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
                <label className="text-sm font-medium">Numéro SIRET *</label>
                <Input
                  value={establishmentData.siret}
                  onChange={(e) => setEstablishmentData(prev => ({ ...prev, siret: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse</label>
                  <Input
                    value={establishmentData.address}
                    onChange={(e) => setEstablishmentData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ville</label>
                  <Input
                    value={establishmentData.city}
                    onChange={(e) => setEstablishmentData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Code postal</label>
                <Input
                  value={establishmentData.postal_code}
                  onChange={(e) => setEstablishmentData(prev => ({ ...prev, postal_code: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={establishmentData.description}
                  onChange={(e) => setEstablishmentData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Décrivez votre établissement..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Spécialités</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecialties = establishmentData.specialties.filter((_, i) => i !== index);
                          setEstablishmentData(prev => ({ ...prev, specialties: newSpecialties }));
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une spécialité"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !establishmentData.specialties.includes(value)) {
                          setEstablishmentData(prev => ({
                            ...prev,
                            specialties: [...prev.specialties, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Services proposés</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentData.services.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                      <button
                        type="button"
                        onClick={() => {
                          const newServices = establishmentData.services.filter((_, i) => i !== index);
                          setEstablishmentData(prev => ({ ...prev, services: newServices }));
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un service"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !establishmentData.services.includes(value)) {
                          setEstablishmentData(prev => ({
                            ...prev,
                            services: [...prev.services, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Équipements</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentData.facilities.map((facility, index) => (
                    <Badge key={index} variant="secondary">
                      {facility}
                      <button
                        type="button"
                        onClick={() => {
                          const newFacilities = establishmentData.facilities.filter((_, i) => i !== index);
                          setEstablishmentData(prev => ({ ...prev, facilities: newFacilities }));
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un équipement"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !establishmentData.facilities.includes(value)) {
                          setEstablishmentData(prev => ({
                            ...prev,
                            facilities: [...prev.facilities, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de personnel</label>
                <Input
                  type="number"
                  value={establishmentData.staff_count}
                  onChange={(e) => setEstablishmentData(prev => ({ ...prev, staff_count: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Horaires d'ouverture</label>
                <div className="flex flex-wrap gap-2">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <Badge
                      key={day}
                      variant={establishmentData.operating_hours.days.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const days = establishmentData.operating_hours.days;
                        const newDays = days.includes(day)
                          ? days.filter(d => d !== day)
                          : [...days, day];
                        setEstablishmentData(prev => ({
                          ...prev,
                          operating_hours: { ...prev.operating_hours, days: newDays }
                        }));
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
                <Input
                  value={establishmentData.operating_hours.hours}
                  onChange={(e) => setEstablishmentData(prev => ({
                    ...prev,
                    operating_hours: { ...prev.operating_hours, hours: e.target.value }
                  }))}
                  placeholder="ex: 9h-12h, 14h-18h"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assurances acceptées</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentData.insurance_accepted.map((insurance, index) => (
                    <Badge key={index} variant="secondary">
                      {insurance}
                      <button
                        type="button"
                        onClick={() => {
                          const newInsurance = establishmentData.insurance_accepted.filter((_, i) => i !== index);
                          setEstablishmentData(prev => ({ ...prev, insurance_accepted: newInsurance }));
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une assurance"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !establishmentData.insurance_accepted.includes(value)) {
                          setEstablishmentData(prev => ({
                            ...prev,
                            insurance_accepted: [...prev.insurance_accepted, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Moyens de paiement acceptés</label>
                <div className="flex flex-wrap gap-2">
                  {establishmentData.payment_methods.map((method, index) => (
                    <Badge key={index} variant="secondary">
                      {method}
                      <button
                        type="button"
                        onClick={() => {
                          const newMethods = establishmentData.payment_methods.filter((_, i) => i !== index);
                          setEstablishmentData(prev => ({ ...prev, payment_methods: newMethods }));
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un moyen de paiement"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !establishmentData.payment_methods.includes(value)) {
                          setEstablishmentData(prev => ({
                            ...prev,
                            payment_methods: [...prev.payment_methods, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 