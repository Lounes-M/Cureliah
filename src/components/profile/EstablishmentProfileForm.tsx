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
  Building2,
  Upload,
  Camera,
  Loader2,
  MapPin,
  Globe,
  Clock,
  Shield,
  CreditCard,
  Users,
  Stethoscope,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Wifi,
  Car,
  Accessibility,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client.browser";
import { ESTABLISHMENT_TYPES } from "@/utils/specialities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadProfilePicture } from "@/services/profileService";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/services/logger";

interface EstablishmentProfileFormProps {
  userId: string;
  existingProfile?: any;
  onSuccess: () => void;
}

export default function EstablishmentProfileForm({
  userId,
  existingProfile,
  onSuccess,
}: EstablishmentProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    existingProfile?.logo_url || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newService, setNewService] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [newInsurance, setNewInsurance] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  const [establishmentData, setEstablishmentData] = useState({
    name: existingProfile?.name || "",
    establishment_type: existingProfile?.establishment_type || "",
    siret: existingProfile?.siret || "",
    address: existingProfile?.address || "",
    city: existingProfile?.city || "",
    postal_code: existingProfile?.postal_code || "",
    phone: existingProfile?.phone || "",
    email: existingProfile?.email || "",
    website: existingProfile?.website || "",
    description: existingProfile?.description || "",
    specialties: existingProfile?.specialties || [],
    services: existingProfile?.services || [],
    facilities: existingProfile?.facilities || [],
    staff_count: existingProfile?.staff_count || "",
    bed_count: existingProfile?.bed_count || "",
    operating_hours: existingProfile?.operating_hours || {
      days: [],
      hours: "",
    },
    insurance_accepted: existingProfile?.insurance_accepted || [],
    payment_methods: existingProfile?.payment_methods || [],
    certifications: existingProfile?.certifications || [],
    emergency_services: existingProfile?.emergency_services || false,
    parking_available: existingProfile?.parking_available || false,
    wheelchair_accessible: existingProfile?.wheelchair_accessible || false,
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

      const publicUrl = await uploadProfilePicture(userId, file, "establishment");
      setProfileImageUrl(publicUrl);

      toast({
        title: "Logo uploadé",
        description: "Votre logo a été mis à jour avec succès",
      });
    } catch (error: any) {
      logger.error("Error uploading image:", error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible de télécharger l'image. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Fonctions d'ajout et de suppression pour les listes
  const addSpecialty = () => {
    const value = newSpecialty.trim();
    if (value && !establishmentData.specialties.includes(value)) {
      setEstablishmentData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, value],
      }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (index: number) => {
    setEstablishmentData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const addService = () => {
    const value = newService.trim();
    if (value && !establishmentData.services.includes(value)) {
      setEstablishmentData((prev) => ({
        ...prev,
        services: [...prev.services, value],
      }));
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setEstablishmentData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const addFacility = () => {
    const value = newFacility.trim();
    if (value && !establishmentData.facilities.includes(value)) {
      setEstablishmentData((prev) => ({
        ...prev,
        facilities: [...prev.facilities, value],
      }));
      setNewFacility("");
    }
  };

  const removeFacility = (index: number) => {
    setEstablishmentData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index),
    }));
  };

  const addInsurance = () => {
    const value = newInsurance.trim();
    if (value && !establishmentData.insurance_accepted.includes(value)) {
      setEstablishmentData((prev) => ({
        ...prev,
        insurance_accepted: [...prev.insurance_accepted, value],
      }));
      setNewInsurance("");
    }
  };

  const removeInsurance = (index: number) => {
    setEstablishmentData((prev) => ({
      ...prev,
      insurance_accepted: prev.insurance_accepted.filter((_, i) => i !== index),
    }));
  };

  const addPaymentMethod = () => {
    const value = newPaymentMethod.trim();
    if (value && !establishmentData.payment_methods.includes(value)) {
      setEstablishmentData((prev) => ({
        ...prev,
        payment_methods: [...prev.payment_methods, value],
      }));
      setNewPaymentMethod("");
    }
  };

  const removePaymentMethod = (index: number) => {
    setEstablishmentData((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.filter((_, i) => i !== index),
    }));
  };

  const toggleOperatingDay = (day: string) => {
    setEstablishmentData((prev) => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        days: prev.operating_hours.days.includes(day)
          ? prev.operating_hours.days.filter((d) => d !== day)
          : [...prev.operating_hours.days, day],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !establishmentData.name ||
      !establishmentData.establishment_type ||
      !establishmentData.siret
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
        name: establishmentData.name.trim(),
        establishment_type: establishmentData.establishment_type,
        siret: establishmentData.siret.trim(),
        address: establishmentData.address?.trim() || null,
        city: establishmentData.city?.trim() || null,
        postal_code: establishmentData.postal_code?.trim() || null,
        phone: establishmentData.phone?.trim() || null,
        email: establishmentData.email?.trim() || null,
        website: establishmentData.website?.trim() || null,
        description: establishmentData.description?.trim() || null,
        specialties: establishmentData.specialties,
        services: establishmentData.services,
        facilities: establishmentData.facilities,
        staff_count: establishmentData.staff_count
          ? parseInt(establishmentData.staff_count)
          : null,
        bed_count: establishmentData.bed_count
          ? parseInt(establishmentData.bed_count)
          : null,
        operating_hours: establishmentData.operating_hours,
        insurance_accepted: establishmentData.insurance_accepted,
        payment_methods: establishmentData.payment_methods,
        certifications: establishmentData.certifications,
        emergency_services: establishmentData.emergency_services,
        parking_available: establishmentData.parking_available,
        wheelchair_accessible: establishmentData.wheelchair_accessible,
        logo_url: profileImageUrl,
      };

      let result;

      if (existingProfile) {
        result = await supabase
          .from("establishment_profiles")
          .update(profileData)
          .eq("id", userId);
      } else {
        result = await supabase.from("establishment_profiles").insert({
          id: userId,
          ...profileData,
        });
      }

      const { error } = result;
      if (error) throw error;

      toast({
        title: "Profil sauvegardé",
        description: "Votre profil d'établissement a été mis à jour avec succès",
      });

      onSuccess();
    } catch (error: any) {
      logger.error("Error saving establishment profile:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Building2 className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Profil Établissement
              </h1>
              <p className="text-gray-600 mt-1">Configurez votre établissement de santé</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Logo */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Logo de l'établissement
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
                      {establishmentData.name?.[0] || "🏥"}
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
                    Logo de l'établissement
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG ou GIF • Maximum 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Informations générales */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nom de l'établissement <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={establishmentData.name}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: Clinique du Parc"
                    required
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Type d'établissement <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={establishmentData.establishment_type}
                    onValueChange={(value) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        establishment_type: value,
                      }))
                    }
                    required
                  >
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500">
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
                  <Label htmlFor="siret" className="text-sm font-medium">
                    Numéro SIRET <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="siret"
                    value={establishmentData.siret}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        siret: e.target.value,
                      }))
                    }
                    placeholder="12345678901234"
                    required
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Téléphone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={establishmentData.phone}
                      onChange={(e) =>
                        setEstablishmentData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="01 23 45 67 89"
                      className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={establishmentData.email}
                      onChange={(e) =>
                        setEstablishmentData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="contact@clinique.fr"
                      className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">
                    Site web
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="website"
                      value={establishmentData.website}
                      onChange={(e) =>
                        setEstablishmentData((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      placeholder="https://www.clinique.fr"
                      className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Description de l'établissement
                </Label>
                <Textarea
                  value={establishmentData.description}
                  onChange={(e) =>
                    setEstablishmentData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Décrivez votre établissement, ses valeurs, ses spécificités..."
                  className="transition-all focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500">
                  Cette description sera visible par les médecins et patients
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section Adresse */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={establishmentData.address}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="123 Rue de la Santé"
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code" className="text-sm font-medium">
                    Code postal
                  </Label>
                  <Input
                    id="postal_code"
                    value={establishmentData.postal_code}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                    placeholder="75001"
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Ville
                  </Label>
                  <Input
                    id="city"
                    value={establishmentData.city}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Paris"
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Spécialités et Services */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Spécialités et Services
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Spécialités */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Spécialités médicales</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {establishmentData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {specialty}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 hover:bg-transparent"
                        onClick={() => removeSpecialty(index)}
                      >
                        <X className="h-3 w-3 hover:text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Ex: Cardiologie, Neurologie..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpecialty();
                      }
                    }}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSpecialty}
                    disabled={!newSpecialty.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Services proposés</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {establishmentData.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {service}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 hover:bg-transparent"
                        onClick={() => removeService(index)}
                      >
                        <X className="h-3 w-3 hover:text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Ex: Chirurgie ambulatoire, Urgences..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService();
                      }
                    }}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addService}
                    disabled={!newService.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Équipements */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Équipements médicaux</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {establishmentData.facilities.map((facility, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {facility}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 hover:bg-transparent"
                        onClick={() => removeFacility(index)}
                      >
                        <X className="h-3 w-3 hover:text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    placeholder="Ex: Scanner, IRM, Bloc opératoire..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFacility();
                      }
                    }}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFacility}
                    disabled={!newFacility.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Capacité et Personnel */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Capacité et Personnel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="staff_count" className="text-sm font-medium">
                    Nombre de personnel médical
                  </Label>
                  <Input
                    id="staff_count"
                    type="number"
                    min="1"
                    value={establishmentData.staff_count}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        staff_count: e.target.value,
                      }))
                    }
                    placeholder="25"
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bed_count" className="text-sm font-medium">
                    Nombre de lits (si applicable)
                  </Label>
                  <Input
                    id="bed_count"
                    type="number"
                    min="0"
                    value={establishmentData.bed_count}
                    onChange={(e) =>
                      setEstablishmentData((prev) => ({
                        ...prev,
                        bed_count: e.target.value,
                      }))
                    }
                    placeholder="50"
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Options d'accessibilité et services */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Services et accessibilité</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emergency_services"
                        checked={establishmentData.emergency_services}
                        onChange={(e) =>
                          setEstablishmentData((prev) => ({
                            ...prev,
                            emergency_services: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-medical-blue rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-red-500" />
                      <Label htmlFor="emergency_services" className="text-sm font-medium cursor-pointer">
                        Services d'urgence 24h/24
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="parking_available"
                        checked={establishmentData.parking_available}
                        onChange={(e) =>
                          setEstablishmentData((prev) => ({
                            ...prev,
                            parking_available: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-medical-blue rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-medical-blue-light" />
                      <Label htmlFor="parking_available" className="text-sm font-medium cursor-pointer">
                        Parking disponible
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="wheelchair_accessible"
                        checked={establishmentData.wheelchair_accessible}
                        onChange={(e) =>
                          setEstablishmentData((prev) => ({
                            ...prev,
                            wheelchair_accessible: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-medical-blue rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Accessibility className="w-5 h-5 text-medical-green-light" />
                      <Label htmlFor="wheelchair_accessible" className="text-sm font-medium cursor-pointer">
                        Accessible PMR
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Horaires */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horaires d'ouverture
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Jours d'ouverture</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={
                        establishmentData.operating_hours.days.includes(day)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleOperatingDay(day)}
                      className="transition-all"
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="text-sm font-medium">
                  Horaires d'ouverture
                </Label>
                <Input
                  id="hours"
                  value={establishmentData.operating_hours.hours}
                  onChange={(e) =>
                    setEstablishmentData((prev) => ({
                      ...prev,
                      operating_hours: {
                        ...prev.operating_hours,
                        hours: e.target.value,
                      },
                    }))
                  }
                  placeholder="Ex: 8h-18h, Urgences 24h/24"
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Précisez les horaires généraux de votre établissement
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section Assurances et Paiements */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Assurances et Paiements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Assurances */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assurances acceptées</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {establishmentData.insurance_accepted.map((insurance, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {insurance}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 hover:bg-transparent"
                        onClick={() => removeInsurance(index)}
                      >
                        <X className="h-3 w-3 hover:text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newInsurance}
                    onChange={(e) => setNewInsurance(e.target.value)}
                    placeholder="Ex: Sécurité Sociale, Mutuelle..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInsurance();
                      }
                    }}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInsurance}
                    disabled={!newInsurance.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Moyens de paiement */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Moyens de paiement acceptés
                </Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {establishmentData.payment_methods.map((method, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {method}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 hover:bg-transparent"
                        onClick={() => removePaymentMethod(index)}
                      >
                        <X className="h-3 w-3 hover:text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    placeholder="Ex: Carte bancaire, Espèces, Chèque..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPaymentMethod();
                      }
                    }}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPaymentMethod}
                    disabled={!newPaymentMethod.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Certifications */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Certifications et Accréditations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Certifications qualité</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {establishmentData.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {cert}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 hover:bg-transparent"
                        onClick={() => {
                          setEstablishmentData((prev) => ({
                            ...prev,
                            certifications: prev.certifications.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <X className="h-3 w-3 hover:text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: HAS, ISO 9001, Certification qualité..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !establishmentData.certifications.includes(value)) {
                          setEstablishmentData((prev) => ({
                            ...prev,
                            certifications: [...prev.certifications, value],
                          }));
                          input.value = "";
                        }
                      }
                    }}
                    className="transition-all focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !establishmentData.certifications.includes(value)) {
                        setEstablishmentData((prev) => ({
                          ...prev,
                          certifications: [...prev.certifications, value],
                        }));
                        input.value = "";
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Ajoutez vos certifications et accréditations officielles
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
              className="px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-300"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-purple-200 transition-all duration-300 transform hover:scale-105 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}