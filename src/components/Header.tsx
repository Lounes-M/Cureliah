import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Calendar, Search, BookOpen } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NotificationDropdown from "./NotificationDropdown";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "/logo.png";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [establishmentName, setEstablishmentName] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchEstablishmentName = async () => {
      if (user && profile?.user_type === "establishment") {
        const { data, error } = await supabase
          .from("establishment_profiles")
          .select("name")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setEstablishmentName(data.name);
        }
      }
    };

    fetchEstablishmentName();
  }, [user, profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (profile?.user_type === "establishment" && establishmentName) {
      return establishmentName;
    }
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || "Utilisateur";
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              <img
                src={logoUrl}
                alt="Logo"
                style={{ height: "45px" }}
                className="w-auto object-contain"
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {user && profile ? (
              <>
                {profile.user_type === "doctor" ? (
                  <>
                    <Link
                      to="/doctor/dashboard"
                      className="text-gray-700 hover:text-medical-blue transition-colors"
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      to="/bookings"
                      className="text-gray-700 hover:text-medical-blue transition-colors flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Mes réservations
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/doctor/manage-vacations")}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Mes vacations
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/establishment/dashboard"
                      className="text-gray-700 hover:text-medical-blue transition-colors"
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      to="/establishment/search"
                      className="text-gray-700 hover:text-medical-blue transition-colors"
                    >
                      Rechercher
                    </Link>
                    <Link
                      to="/bookings"
                      className="text-gray-700 hover:text-medical-blue transition-colors flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Mes réservations
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <a
                  href="#fonctionnement"
                  className="text-gray-700 hover:text-medical-blue transition-colors"
                >
                  Comment ça marche
                </a>
                <a
                  href="#avantages"
                  className="text-gray-700 hover:text-medical-blue transition-colors"
                >
                  Avantages
                </a>
                <a
                  href="#temoignages"
                  className="text-gray-700 hover:text-medical-blue transition-colors"
                >
                  Témoignages
                </a>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user && profile ? (
              <>
                <NotificationDropdown />
                <span className="text-sm text-gray-700">
                  {getDisplayName()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/profile/complete")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")}>Se connecter</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
