import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Calendar,
  Plus,
  Search,
  Building2,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NotificationBell from './NotificationBell';
import { Link } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

type Profile = Database['public']['Tables']['profiles']['Row'];
type EstablishmentProfile = Database['public']['Tables']['establishment_profiles']['Row'];

const UserNavigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [establishmentProfile, setEstablishmentProfile] = useState<EstablishmentProfile | null>(null);

  useEffect(() => {
    const fetchEstablishmentProfile = async () => {
      if (user && profile?.user_type === 'establishment') {
        const { data, error } = await supabase
          .from('establishment_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setEstablishmentProfile(data);
        }
      }
    };

    fetchEstablishmentProfile();
  }, [user, profile]);

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

  const getUserType = () => {
    return profile?.user_type || user?.user_metadata?.user_type;
  };

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    navigate(path);
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (establishmentProfile?.name) {
      return establishmentProfile.name[0].toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (profile?.user_type === 'establishment' && establishmentProfile?.name) {
      return establishmentProfile.name;
    }
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Utilisateur';
  };

  const userType = getUserType();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center space-x-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Projet Med</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-gray-600 hover:text-medical-blue">
                  {userType === 'doctor' ? (
                    <>
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Espace Médecin
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Espace Établissement
                    </>
                  )}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white shadow-lg border rounded-lg p-4 min-w-64">
                  <div className="grid gap-3">
                    {userType === 'doctor' ? (
                      <>
                        <Button 
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleNavigation('/doctor/dashboard')}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Tableau de bord
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleNavigation('/doctor/create-vacation')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nouvelle vacation
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleNavigation('/establishment/dashboard')}
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Tableau de bord
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleNavigation('/establishment/search')}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Rechercher des médecins
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleNavigation('/establishment/profile')}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Mon profil
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleNavigation('/bookings')}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Mes réservations
                        </Button>
                      </>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-medical-blue text-white text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white shadow-lg border" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userType === 'doctor' ? 'Médecin' : 'Établissement'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation(userType === 'doctor' ? '/profile/complete' : '/establishment/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserNavigation;
