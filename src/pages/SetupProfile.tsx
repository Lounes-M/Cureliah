import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client.browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/services/logger";
import { User, Building2, Stethoscope, ArrowRight, CheckCircle2, Users, Calendar, Shield } from "lucide-react";

const SetupProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeSelection = async () => {
    if (!selectedType || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          user_type: selectedType,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profil configuré !",
        description: `Votre compte ${selectedType === 'doctor' ? 'médecin' : 'établissement'} a été créé avec succès.`,
      });

      // Rediriger vers le bon dashboard
      if (selectedType === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/establishment/dashboard');
      }
    } catch (error) {
      logger.error("Erreur lors de la configuration du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de configurer votre profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur a déjà un type défini, rediriger
  if (profile?.user_type) {
    if (profile.user_type === 'doctor') {
      navigate('/doctor/dashboard');
    } else if (profile.user_type === 'establishment') {
      navigate('/establishment/dashboard');
    }
    return null;
  }

  const userMeta = user?.user_metadata as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête de bienvenue */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenue sur Cureliah !
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Bonjour {userMeta?.full_name || userMeta?.name || user?.email}
            </p>
            <p className="text-gray-500">
              Pour continuer, veuillez choisir le type de votre compte
            </p>
          </div>

          {/* Choix du type de compte */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Option Médecin */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === 'doctor' 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedType('doctor')}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedType === 'doctor' 
                    ? 'bg-medical-blue-light' 
                    : 'bg-blue-100'
                }`}>
                  <Stethoscope className={`w-8 h-8 ${
                    selectedType === 'doctor' ? 'text-white' : 'text-medical-blue'
                  }`} />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  Je suis un Médecin
                  {selectedType === 'doctor' && (
                    <CheckCircle2 className="w-5 h-5 text-medical-blue-light" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-center mb-4">
                  Publiez vos disponibilités et gérez vos vacations médicales
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-medical-blue-light" />
                    Gérer mes créneaux de disponibilité
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-medical-blue-light" />
                    Recevoir des demandes d'établissements
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-medical-blue-light" />
                    Profil vérifié et sécurisé
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Option Établissement */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === 'establishment' 
                  ? 'ring-2 ring-green-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedType('establishment')}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  selectedType === 'establishment' 
                    ? 'bg-medical-green-light' 
                    : 'bg-green-100'
                }`}>
                  <Building2 className={`w-8 h-8 ${
                    selectedType === 'establishment' ? 'text-white' : 'text-medical-green'
                  }`} />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  Je suis un Établissement
                  {selectedType === 'establishment' && (
                    <CheckCircle2 className="w-5 h-5 text-medical-green-light" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-center mb-4">
                  Trouvez et réservez des médecins vacataires pour votre établissement
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-medical-green-light" />
                    Réserver des créneaux médicaux
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-medical-green-light" />
                    Accéder aux profils de médecins
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-medical-green-light" />
                    Gestion sécurisée des réservations
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bouton de validation */}
          <div className="text-center">
            <Button 
              onClick={handleTypeSelection}
              disabled={!selectedType || loading}
              className={`px-8 py-3 text-lg font-semibold ${
                selectedType === 'doctor' 
                  ? 'bg-medical-blue hover:bg-medical-blue-dark' 
                  : selectedType === 'establishment'
                  ? 'bg-medical-green hover:bg-medical-green-dark'
                  : 'bg-gray-400'
              }`}
            >
              {loading ? (
                "Configuration en cours..."
              ) : selectedType ? (
                <>
                  Continuer comme {selectedType === 'doctor' ? 'Médecin' : 'Établissement'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                "Choisissez un type de compte"
              )}
            </Button>
            
            {selectedType && (
              <p className="text-sm text-gray-500 mt-3">
                Vous pourrez modifier ces informations plus tard dans vos paramètres
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupProfile;
