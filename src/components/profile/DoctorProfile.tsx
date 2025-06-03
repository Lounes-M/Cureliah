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
import { Loader2, User, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, Languages, FileText, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadProfilePicture } from '@/services/profileService';

interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  sub_specialties: string[];
  experience_years: number;
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  languages: string[];
  bio: string;
  consultation_fee: number;
  availability: {
    days: string[];
    hours: string;
  };
  license_number: string;
  avatar_url: string;
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

export default function DoctorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
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

      // Fetch doctor profile
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (doctorError) throw doctorError;

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      setDoctorProfile(doctorData);
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

      const publicUrl = await uploadProfilePicture(user?.id || '', file, 'doctor');
      setDoctorProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
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
    if (!user || !doctorProfile || !userProfile) return;

    try {
      setSaving(true);

      // Update doctor profile
      const { error: doctorError } = await supabase
        .from('doctor_profiles')
        .update({
          specialty: doctorProfile.specialty,
          sub_specialties: doctorProfile.sub_specialties,
          experience_years: doctorProfile.experience_years,
          education: doctorProfile.education,
          languages: doctorProfile.languages,
          bio: doctorProfile.bio,
          consultation_fee: doctorProfile.consultation_fee,
          availability: doctorProfile.availability,
          license_number: doctorProfile.license_number,
          avatar_url: doctorProfile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (doctorError) throw doctorError;

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
        <h2 className="text-2xl font-bold">Profil Médecin</h2>
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
            <AvatarImage src={doctorProfile?.avatar_url} />
            <AvatarFallback className="text-lg">
              {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
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
          <TabsTrigger value="personal">
            <User className="w-4 h-4 mr-2" />
            Informations personnelles
          </TabsTrigger>
          <TabsTrigger value="professional">
            <Briefcase className="w-4 h-4 mr-2" />
            Informations professionnelles
          </TabsTrigger>
          <TabsTrigger value="availability">
            <Calendar className="w-4 h-4 mr-2" />
            Disponibilités
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Vos informations de contact et coordonnées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom</label>
                  <Input
                    value={userProfile?.first_name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <Input
                    value={userProfile?.last_name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                  />
                </div>
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

        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
              <CardDescription>
                Vos qualifications et expériences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Spécialité principale</label>
                <Input
                  value={doctorProfile?.specialty || ''}
                  onChange={(e) => setDoctorProfile(prev => prev ? { ...prev, specialty: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro de licence</label>
                <Input
                  value={doctorProfile?.license_number || ''}
                  onChange={(e) => setDoctorProfile(prev => prev ? { ...prev, license_number: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sous-spécialités</label>
                <div className="flex flex-wrap gap-2">
                  {doctorProfile?.sub_specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Années d'expérience</label>
                <Input
                  type="number"
                  value={doctorProfile?.experience_years || 0}
                  onChange={(e) => setDoctorProfile(prev => prev ? { ...prev, experience_years: parseInt(e.target.value) } : null)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Formation</label>
                <div className="space-y-4">
                  {doctorProfile?.education.map((edu, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span>{edu.degree} - {edu.institution} ({edu.year})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newEducation = [...(doctorProfile.education || [])];
                          newEducation.splice(index, 1);
                          setDoctorProfile(prev => prev ? { ...prev, education: newEducation } : null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEducation = [...(doctorProfile?.education || [])];
                        newEducation.push({ degree: '', institution: '', year: new Date().getFullYear() });
                        setDoctorProfile(prev => prev ? { ...prev, education: newEducation } : null);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une formation
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Langues parlées</label>
                <div className="flex flex-wrap gap-2">
                  {doctorProfile?.languages.map((lang, index) => (
                    <Badge key={index} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Biographie</label>
                <Textarea
                  value={doctorProfile?.bio || ''}
                  onChange={(e) => setDoctorProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tarif de consultation (€/heure)</label>
                <Input
                  type="number"
                  value={doctorProfile?.consultation_fee || 0}
                  onChange={(e) => setDoctorProfile(prev => prev ? { ...prev, consultation_fee: parseInt(e.target.value) } : null)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Disponibilités</CardTitle>
              <CardDescription>
                Vos horaires de disponibilité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jours de disponibilité</label>
                <div className="flex flex-wrap gap-2">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <Badge
                      key={day}
                      variant={doctorProfile?.availability.days.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const days = doctorProfile?.availability.days || [];
                        const newDays = days.includes(day)
                          ? days.filter(d => d !== day)
                          : [...days, day];
                        setDoctorProfile(prev => prev ? {
                          ...prev,
                          availability: { ...prev.availability, days: newDays }
                        } : null);
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Horaires</label>
                <Input
                  value={doctorProfile?.availability.hours || ''}
                  onChange={(e) => setDoctorProfile(prev => prev ? {
                    ...prev,
                    availability: { ...prev.availability, hours: e.target.value }
                  } : null)}
                  placeholder="ex: 9h-12h, 14h-18h"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 