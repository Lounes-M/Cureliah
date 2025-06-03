import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, GraduationCap, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SPECIALITIES } from '@/utils/specialities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { uploadProfilePicture } from '@/services/profileService';

interface DoctorProfileFormProps {
  userId: string;
  existingProfile?: any;
  onSuccess: () => void;
}

export default function DoctorProfileForm({ userId, existingProfile, onSuccess }: DoctorProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(existingProfile?.avatar_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [doctorData, setDoctorData] = useState({
    speciality: existingProfile?.speciality || '',
    sub_specialties: existingProfile?.sub_specialties || [],
    license_number: existingProfile?.license_number || '',
    experience_years: existingProfile?.experience_years || '',
    education: existingProfile?.education || [],
    languages: existingProfile?.languages || [],
    bio: existingProfile?.bio || '',
    hourly_rate: existingProfile?.hourly_rate || '',
    availability: existingProfile?.availability || {
      days: [],
      hours: ''
    }
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

      const publicUrl = await uploadProfilePicture(userId, file, 'doctor');
      setProfileImageUrl(publicUrl);
      setDoctorData(prev => ({ ...prev, avatar_url: publicUrl }));
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

    if (!doctorData.speciality || !doctorData.license_number) {
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
        speciality: doctorData.speciality,
        sub_specialties: doctorData.sub_specialties,
        license_number: doctorData.license_number,
        experience_years: doctorData.experience_years ? parseInt(doctorData.experience_years) : null,
        education: doctorData.education,
        languages: doctorData.languages,
        bio: doctorData.bio || null,
        hourly_rate: doctorData.hourly_rate ? parseFloat(doctorData.hourly_rate) : null,
        availability: doctorData.availability,
        avatar_url: profileImageUrl
      };

      let result;
      
      if (existingProfile) {
        result = await supabase
          .from('doctor_profiles')
          .update(profileData)
          .eq('id', userId);
      } else {
        result = await supabase
          .from('doctor_profiles')
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
      console.error('Error saving doctor profile:', error);
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
                    {existingProfile?.first_name?.[0] || ''}{existingProfile?.last_name?.[0] || ''}
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
              <p className="mt-2 text-sm text-gray-500">Photo de profil</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Spécialité principale *</label>
                <Select 
                  value={doctorData.speciality} 
                  onValueChange={(value) => setDoctorData(prev => ({ ...prev, speciality: value }))}
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
                <label className="text-sm font-medium">Sous-spécialités</label>
                <div className="flex flex-wrap gap-2">
                  {doctorData.sub_specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecialties = doctorData.sub_specialties.filter((_, i) => i !== index);
                          setDoctorData(prev => ({ ...prev, sub_specialties: newSpecialties }));
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
                    placeholder="Ajouter une sous-spécialité"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !doctorData.sub_specialties.includes(value)) {
                          setDoctorData(prev => ({
                            ...prev,
                            sub_specialties: [...prev.sub_specialties, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = document.querySelector('input[placeholder="Ajouter une sous-spécialité"]') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !doctorData.sub_specialties.includes(value)) {
                        setDoctorData(prev => ({
                          ...prev,
                          sub_specialties: [...prev.sub_specialties, value]
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro de licence *</label>
                <Input
                  value={doctorData.license_number}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, license_number: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Années d'expérience</label>
                  <Input
                    type="number"
                    value={doctorData.experience_years}
                    onChange={(e) => setDoctorData(prev => ({ ...prev, experience_years: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tarif horaire (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={doctorData.hourly_rate}
                    onChange={(e) => setDoctorData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Formation</label>
                <div className="space-y-4">
                  {doctorData.education.map((edu, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <div className="flex gap-2">
                          <Input
                            value={edu.degree}
                            onChange={(e) => {
                              const newEducation = [...doctorData.education];
                              newEducation[index] = { ...edu, degree: e.target.value };
                              setDoctorData(prev => ({ ...prev, education: newEducation }));
                            }}
                            placeholder="Diplôme"
                            className="w-40"
                          />
                          <Input
                            value={edu.institution}
                            onChange={(e) => {
                              const newEducation = [...doctorData.education];
                              newEducation[index] = { ...edu, institution: e.target.value };
                              setDoctorData(prev => ({ ...prev, education: newEducation }));
                            }}
                            placeholder="Établissement"
                            className="w-40"
                          />
                          <Input
                            type="number"
                            value={edu.year}
                            onChange={(e) => {
                              const newEducation = [...doctorData.education];
                              newEducation[index] = { ...edu, year: parseInt(e.target.value) };
                              setDoctorData(prev => ({ ...prev, education: newEducation }));
                            }}
                            placeholder="Année"
                            className="w-24"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newEducation = [...doctorData.education];
                          newEducation.splice(index, 1);
                          setDoctorData(prev => ({ ...prev, education: newEducation }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        const newEducation = [...doctorData.education];
                        newEducation.push({
                          degree: '',
                          institution: '',
                          year: new Date().getFullYear()
                        });
                        setDoctorData(prev => ({ ...prev, education: newEducation }));
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
                  {doctorData.languages.map((language, index) => (
                    <Badge key={index} variant="secondary">
                      {language}
                      <button
                        type="button"
                        onClick={() => {
                          const newLanguages = doctorData.languages.filter((_, i) => i !== index);
                          setDoctorData(prev => ({ ...prev, languages: newLanguages }));
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
                    placeholder="Ajouter une langue"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !doctorData.languages.includes(value)) {
                          setDoctorData(prev => ({
                            ...prev,
                            languages: [...prev.languages, value]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = document.querySelector('input[placeholder="Ajouter une langue"]') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !doctorData.languages.includes(value)) {
                        setDoctorData(prev => ({
                          ...prev,
                          languages: [...prev.languages, value]
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Biographie</label>
                <Textarea
                  value={doctorData.bio}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  placeholder="Présentez-vous brièvement..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Disponibilités</label>
                <div className="flex flex-wrap gap-2">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <Badge
                      key={day}
                      variant={doctorData.availability.days.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const days = doctorData.availability.days;
                        const newDays = days.includes(day)
                          ? days.filter(d => d !== day)
                          : [...days, day];
                        setDoctorData(prev => ({
                          ...prev,
                          availability: { ...prev.availability, days: newDays }
                        }));
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
                <Input
                  value={doctorData.availability.hours}
                  onChange={(e) => setDoctorData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, hours: e.target.value }
                  }))}
                  placeholder="ex: 9h-12h, 14h-18h"
                />
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