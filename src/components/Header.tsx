
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, Search, BookOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-xl font-bold text-medical-blue">Projet Med</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {user && profile ? (
              <>
                {profile.user_type === 'doctor' ? (
                  <>
                    <Link
                      to="/doctor/dashboard"
                      className="text-gray-700 hover:text-medical-blue transition-colors"
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      to="/doctor/create-vacation"
                      className="text-gray-700 hover:text-medical-blue transition-colors"
                    >
                      Créer une vacation
                    </Link>
                    <Link
                      to="/bookings"
                      className="text-gray-700 hover:text-medical-blue transition-colors flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Mes réservations
                    </Link>
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
                      to="/search"
                      className="text-gray-700 hover:text-medical-blue transition-colors flex items-center"
                    >
                      <Search className="w-4 h-4 mr-1" />
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
                <a href="#fonctionnement" className="text-gray-700 hover:text-medical-blue transition-colors">
                  Comment ça marche
                </a>
                <a href="#avantages" className="text-gray-700 hover:text-medical-blue transition-colors">
                  Avantages
                </a>
                <a href="#temoignages" className="text-gray-700 hover:text-medical-blue transition-colors">
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
                  {profile.first_name ? `${profile.first_name} ${profile.last_name}` : user.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile/complete')}>
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
