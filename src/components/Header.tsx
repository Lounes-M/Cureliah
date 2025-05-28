
import { Button } from "@/components/ui/button";
import { User, Building2, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté(e) avec succès.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const handleDashboardClick = () => {
    if (profile?.user_type === 'doctor') {
      navigate('/doctor/dashboard');
    } else if (profile?.user_type === 'establishment') {
      navigate('/establishment/dashboard');
    } else {
      navigate('/profile/complete');
    }
  };

  const handleAuthClick = (userType: string) => {
    // Navigate to auth page and set the intended user type
    navigate('/auth', { state: { userType } });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Projet Med</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#fonctionnement" className="text-gray-600 hover:text-medical-blue transition-colors">
              Fonctionnement
            </a>
            <a href="#avantages" className="text-gray-600 hover:text-medical-blue transition-colors">
              Avantages
            </a>
            <a href="#faq" className="text-gray-600 hover:text-medical-blue transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <span className="text-sm text-gray-600">
                  Bonjour, {profile?.first_name || user.email}
                </span>
                <Button variant="outline" onClick={handleDashboardClick}>
                  Mon espace
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleAuthClick('establishment')} className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Espace Établissement</span>
                </Button>
                <Button onClick={() => handleAuthClick('doctor')} className="bg-medical-blue hover:bg-medical-blue-dark flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Espace Médecin</span>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-3">
              <a href="#fonctionnement" className="text-gray-600 hover:text-medical-blue transition-colors">
                Fonctionnement
              </a>
              <a href="#avantages" className="text-gray-600 hover:text-medical-blue transition-colors">
                Avantages
              </a>
              <a href="#faq" className="text-gray-600 hover:text-medical-blue transition-colors">
                FAQ
              </a>
              <div className="flex flex-col space-y-2 pt-3">
                {user ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Bonjour, {profile?.first_name || user.email}
                      </span>
                      <NotificationBell />
                    </div>
                    <Button variant="outline" onClick={handleDashboardClick} className="w-full">
                      Mon espace
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="w-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => handleAuthClick('establishment')} className="w-full">
                      <Building2 className="w-4 h-4 mr-2" />
                      Espace Établissement
                    </Button>
                    <Button onClick={() => handleAuthClick('doctor')} className="w-full bg-medical-blue hover:bg-medical-blue-dark">
                      <User className="w-4 h-4 mr-2" />
                      Espace Médecin
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
