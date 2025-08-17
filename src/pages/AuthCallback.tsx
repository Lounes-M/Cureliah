import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client.browser';
import { Loader2 } from 'lucide-react';
import { logger } from "@/services/logger";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Gérer les erreurs d'URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          logger.error('OAuth error occurred', new Error(error));
          toast({
            title: "Erreur d'authentification",
            description: errorDescription || "Une erreur s'est produite lors de la connexion",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        // Attendre que l'authentification soit complète
        if (!loading) {
          if (user) {
            logger.info('User connected via OAuth', { userEmail: user.email });

            // Vérifier si c'est un utilisateur OAuth (Google/LinkedIn)
            const isOAuthUser = (user as any).app_metadata?.provider !== 'email';
            const userMeta = user.user_metadata as any;
            const appMeta = (user as any).app_metadata as any;
            
            if (isOAuthUser && !profile) {
              // Créer le profil pour les nouveaux utilisateurs OAuth
              const { error: insertError } = await supabase
                .from("user_profiles")
                .insert([
                  {
                    id: user.id,
                    email: user.email,
                    first_name: userMeta?.full_name?.split(' ')[0] || 
                                userMeta?.name?.split(' ')[0] || 
                                userMeta?.given_name || '',
                    last_name: userMeta?.full_name?.split(' ').slice(1).join(' ') || 
                               userMeta?.name?.split(' ').slice(1).join(' ') || 
                               userMeta?.family_name || '',
                    avatar_url: userMeta?.avatar_url || 
                                userMeta?.picture,
                    user_type: null, // L'utilisateur devra choisir son type
                    is_email_verified: true, // OAuth providers vérifient l'email
                    provider: appMeta?.provider || 'oauth',
                  },
                ]);

              if (insertError) {
                logger.error("Erreur lors de la création du profil", insertError);
              } else {
                logger.info("Profil créé pour l'utilisateur OAuth", { userId: user.id });
              }
            }

            toast({
              title: "Connexion réussie !",
              description: `Bienvenue ${userMeta?.full_name || userMeta?.name || user.email}`,
            });

            // Redirection basée sur le type d'utilisateur
            if (profile?.user_type === "doctor") {
              navigate('/doctor/dashboard');
            } else if (profile?.user_type === "establishment") {
              navigate('/establishment/dashboard');
            } else if (profile?.user_type === "admin") {
              navigate('/admin');
            } else {
              // Si pas de type défini, rediriger vers la page de choix de profil
              navigate('/setup-profile');
            }
          } else {
            logger.warn('Aucun utilisateur trouvé après OAuth');
            toast({
              title: "Erreur de connexion",
              description: "La connexion a échoué. Veuillez réessayer.",
              variant: "destructive",
            });
            navigate('/auth');
          }
        }
      } catch (error) {
        logger.error('Erreur inattendue lors du callback OAuth', error as Error);
        toast({
          title: "Erreur",
          description: "Une erreur inattendue s'est produite",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [user, loading, profile, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-medical-blue" />
        <p className="text-gray-600">Finalisation de la connexion...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
