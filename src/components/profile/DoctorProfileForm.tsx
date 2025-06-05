import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  GraduationCap,
  Upload,
  Camera,
  Loader2,
  User,
  MapPin,
  Globe,
  Clock,
  Star,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALITIES } from "@/utils/specialities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadProfilePicture } from "@/services/profileService";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface DoctorProfileFormProps {
  userId: string;
  existingProfile?: any;
  onSuccess: () => void;
}

interface Education {
  degree: string;
  institution: string;
  year: number;
}

interface Availability {
  days: string[];
  hours: string;
}

export default function DoctorProfileForm({
  userId,
  existingProfile,
  onSuccess,
}: DoctorProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    existingProfile?.avatar_url || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newSubSpecialty, setNewSubSpecialty] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const [doctorData, setDoctorData] = useState({
    first_name: existingProfile?.first_name || "",
    last_name: existingProfile?.last_name || "",
    speciality: existingProfile?.speciality || "",
    sub_specialties: existingProfile?.sub_specialties || [],
    license_number: existingProfile?.license_number || "",
    experience_years: existingProfile?.experience_years || "",
    education: existingProfile?.education || [],
    languages: existingProfile?.languages || [],
    bio: existingProfile?.bio || "",
    hourly_rate: existingProfile?.hourly_rate || "",
    availability: existingProfile?.availability || {
      days: [],
      hours: "",
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);
      setProfileImage(file);

      const publicUrl = await uploadProfilePicture(userId, file, "doctor");
      setProfileImageUrl(publicUrl);

      toast({
        title: "Image uploadée",
        description: "Votre photo de profil a été mise à jour",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible de télécharger l'image. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const addSubSpecialty = () => {
    const value = newSubSpecialty.trim();
    if (value && !doctorData.sub_specialties.includes(value)) {
      setDoctorData((prev) => ({
        ...prev,
        sub_specialties: [...prev.sub_specialties, value],
      }));
      setNewSubSpecialty("");
    }
  };

  const removeSubSpecialty = (index: number) => {
    setDoctorData((prev) => ({
      ...prev,
      sub_specialties: prev.sub_specialties.filter((_, i) => i !== index),
    }));
  };

  const addLanguage = () => {
    const value = newLanguage.trim();
    if (value && !doctorData.languages.includes(value)) {
      setDoctorData((prev) => ({
        ...prev,
        languages: [...prev.languages, value],
      }));
      setNewLanguage("");
    }
  };

  const removeLanguage = (index: number) => {
    setDoctorData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  const addEducation = () => {
    setDoctorData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          institution: "",
          year: new Date().getFullYear(),
        },
      ],
    }));
  };

  const updateEducation = (
    index: number,
    field: keyof Education,
    value: string | number
  ) => {
    setDoctorData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (index: number) => {
    setDoctorData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const toggleAvailabilityDay = (day: string) => {
    setDoctorData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter((d) => d !== day)
          : [...prev.availability.days, day],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !doctorData.first_name ||
      !doctorData.last_name ||
      !doctorData.speciality ||
      !doctorData.license_number
    ) {
      toast({
        title: "Champs obligatoires manquants",
        description:
          "Veuillez remplir tous les champs marqués d'un astérisque (*)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        first_name: doctorData.first_name.trim(),
        last_name: doctorData.last_name.trim(),
        speciality: doctorData.speciality,
        sub_specialties: doctorData.sub_specialties,
        license_number: doctorData.license_number.trim(),
        experience_years: doctorData.experience_years
          ? parseInt(doctorData.experience_years)
          : null,
        education: doctorData.education.filter(
          (edu) => edu.degree && edu.institution
        ),
        languages: doctorData.languages,
        bio: doctorData.bio?.trim() || null,
        hourly_rate: doctorData.hourly_rate
          ? parseFloat(doctorData.hourly_rate)
          : null,
        availability: doctorData.availability,
        avatar_url: profileImageUrl,
      };

      let result;

      if (existingProfile) {
        result = await supabase
          .from("doctor_profiles")
          .update(profileData)
          .eq("id", userId);
      } else {
        result = await supabase.from("doctor_profiles").insert({
          id: userId,
          ...profileData,
        });
      }

      const { error } = result;
      if (error) throw error;

      toast({
        title: "Profil sauvegardé",
        description: "Votre profil professionnel a été mis à jour avec succès",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving doctor profile:", error);
      toast({
        title: "Erreur de sauvegarde",
        description:
          error.message ||
          "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section Photo de profil */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Photo de profil
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
                  <AvatarImage
                    src={profileImageUrl || undefined}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                    {doctorData.first_name?.[0] || ""}
                    {doctorData.last_name?.[0] || ""}
                  </AvatarFallback>
                </Avatar>

                <label
                  htmlFor="profile-image"
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </label>

                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                />

                {profileImageUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => {
                      setProfileImage(null);
                      setProfileImageUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  Photo de profil
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG ou GIF • Maximum 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Informations personnelles */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={doctorData.first_name}
                  onChange={(e) =>
                    setDoctorData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder="Jean"
                  required
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={doctorData.last_name}
                  onChange={(e) =>
                    setDoctorData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  placeholder="Dupont"
                  required
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Biographie professionnelle
              </Label>
              <Textarea
                value={doctorData.bio}
                onChange={(e) =>
                  setDoctorData((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                placeholder="Présentez votre parcours, votre approche médicale et vos domaines d'expertise..."
                className="transition-all focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Cette description sera visible par les patients et
                établissements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section Spécialités */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Spécialités médicales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Spécialité principale <span className="text-red-500">*</span>
              </Label>
              <Select
                value={doctorData.speciality}
                onValueChange={(value) =>
                  setDoctorData((prev) => ({ ...prev, speciality: value }))
                }
                required
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Sélectionnez votre spécialité principale" />
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
              <Label className="text-sm font-medium">Sous-spécialités</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {doctorData.sub_specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {specialty}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0 hover:bg-transparent"
                      onClick={() => removeSubSpecialty(index)}
                    >
                      <X className="h-3 w-3 hover:text-red-500" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSubSpecialty}
                  onChange={(e) => setNewSubSpecialty(e.target.value)}
                  placeholder="Ex: Cardiologie interventionnelle"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubSpecialty();
                    }
                  }}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSubSpecialty}
                  disabled={!newSubSpecialty.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Informations professionnelles */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license_number" className="text-sm font-medium">
                  Numéro RPPS <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="license_number"
                  value={doctorData.license_number}
                  onChange={(e) =>
                    setDoctorData((prev) => ({
                      ...prev,
                      license_number: e.target.value,
                    }))
                  }
                  placeholder="12345678901"
                  required
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="experience_years"
                  className="text-sm font-medium"
                >
                  Années d'expérience
                </Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={doctorData.experience_years}
                  onChange={(e) =>
                    setDoctorData((prev) => ({
                      ...prev,
                      experience_years: e.target.value,
                    }))
                  }
                  placeholder="5"
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="hourly_rate"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <div className="space-y-2" />
                  Tarif horaire (€)
                </Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={doctorData.hourly_rate}
                  onChange={(e) =>
                    setDoctorData((prev) => ({
                      ...prev,
                      hourly_rate: e.target.value,
                    }))
                  }
                  placeholder="75.00"
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Formation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Formation académique
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEducation}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une formation
                </Button>
              </div>

              <div className="space-y-3">
                {doctorData.education.map((edu, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <GraduationCap className="w-5 h-5 text-gray-500 mt-0.5" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(index, "degree", e.target.value)
                        }
                        placeholder="Diplôme (ex: Doctorat en Médecine)"
                        className="transition-all focus:ring-2 focus:ring-blue-500"
                      />
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(index, "institution", e.target.value)
                        }
                        placeholder="Établissement"
                        className="transition-all focus:ring-2 focus:ring-blue-500"
                      />
                      <Input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={edu.year}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "year",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="Année"
                        className="transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Langues */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Langues parlées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {doctorData.languages.map((language, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {language}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0 hover:bg-transparent"
                    onClick={() => removeLanguage(index)}
                  >
                    <X className="h-3 w-3 hover:text-red-500" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Ex: Français, Anglais, Espagnol..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLanguage();
                  }
                }}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addLanguage}
                disabled={!newLanguage.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Disponibilités */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Disponibilités générales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                Jours de disponibilité
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={
                      doctorData.availability.days.includes(day)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleAvailabilityDay(day)}
                    className="transition-all"
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm font-medium">
                Créneaux horaires habituels
              </Label>
              <Input
                id="hours"
                value={doctorData.availability.hours}
                onChange={(e) =>
                  setDoctorData((prev) => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      hours: e.target.value,
                    },
                  }))
                }
                placeholder="Ex: 9h-12h, 14h-18h"
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Ces informations sont indicatives. Vous pourrez définir vos
                créneaux précis dans la section planning.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
