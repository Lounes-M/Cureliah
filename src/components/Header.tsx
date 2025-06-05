import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LogOut, 
  User, 
  Calendar, 
  Search, 
  BookOpen, 
  ChevronDown, 
  Menu,
  LayoutDashboard,
  Settings,
  Bell,
  Building,
  Stethoscope
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NotificationDropdown from "./NotificationDropdown";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "/logo.png";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [establishmentName, setEstablishmentName] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    const fetchUnreadNotifications = async () => {
      if (user) {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);
        
        setUnreadNotifications(count || 0);
      }
    };

    fetchEstablishmentName();
    fetchUnreadNotifications();
  }, [user, profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur notre plateforme !",
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
      return `Dr ${profile.first_name} ${profile.last_name}`;
    }
    return user?.email?.split('@')[0] || "Utilisateur";
  };

  const getInitials = () => {
    if (profile?.user_type === "establishment" && establishmentName) {
      return establishmentName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  const getUserTypeIcon = () => {
    return profile?.user_type === "establishment" ? (
      <Building className="w-3 h-3" />
    ) : (
      <Stethoscope className="w-3 h-3" />
    );
  };

  const getUserTypeBadge = () => {
    return profile?.user_type === "establishment" ? "Établissement" : "Médecin";
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const NavigationLinks = ({ mobile = false, onLinkClick = () => {} }) => (
    <>
      {user && profile ? (
        <>
          {profile.user_type === "doctor" ? (
            <>
              <Link
                to="/doctor/dashboard"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  mobile ? 'w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                } ${isActivePath('/doctor/dashboard') ? 'text-blue-600 font-medium' : ''}`}
                onClick={onLinkClick}
              >
                <LayoutDashboard className="w-4 h-4" />
                Tableau de bord
              </Link>
              <Link
                to="/bookings"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  mobile ? 'w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                } ${isActivePath('/bookings') ? 'text-blue-600 font-medium' : ''}`}
                onClick={onLinkClick}
              >
                <BookOpen className="w-4 h-4" />
                Mes réservations
              </Link>
              <Link
                to="/doctor/manage-vacations"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  mobile ? 'w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                } ${isActivePath('/doctor/manage-vacations') ? 'text-blue-600 font-medium' : ''}`}
                onClick={onLinkClick}
              >
                <Calendar className="w-4 h-4" />
                Mes vacations
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/establishment/dashboard"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  mobile ? 'w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                } ${isActivePath('/establishment/dashboard') ? 'text-blue-600 font-medium' : ''}`}
                onClick={onLinkClick}
              >
                <LayoutDashboard className="w-4 h-4" />
                Tableau de bord
              </Link>
              <Link
                to="/establishment/search"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  mobile ? 'w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                } ${isActivePath('/establishment/search') ? 'text-blue-600 font-medium' : ''}`}
                onClick={onLinkClick}
              >
                <Search className="w-4 h-4" />
                Rechercher
              </Link>
              <Link
                to="/bookings"
                className={`flex items-center gap-2 transition-all duration-200 ${
                  mobile ? 'w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                } ${isActivePath('/bookings') ? 'text-blue-600 font-medium' : ''}`}
                onClick={onLinkClick}
              >
                <BookOpen className="w-4 h-4" />
                Mes réservations
              </Link>
            </>
          )}
        </>
      ) : (
        <>
          <a
            href="#fonctionnement"
            className={`transition-all duration-200 ${
              mobile ? 'block w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
            }`}
            onClick={onLinkClick}
          >
            Comment ça marche
          </a>
          <a
            href="#avantages"
            className={`transition-all duration-200 ${
              mobile ? 'block w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
            }`}
            onClick={onLinkClick}
          >
            Avantages
          </a>
          <a
            href="#temoignages"
            className={`transition-all duration-200 ${
              mobile ? 'block w-full p-3 rounded-lg hover:bg-blue-50' : 'text-gray-700 hover:text-blue-600'
            }`}
            onClick={onLinkClick}
          >
            Témoignages
          </a>
        </>
      )}
    </>
  );

  return (
    <header className="bg-gradient-to-r from-white via-blue-50/30 to-white shadow-lg border-b border-blue-100/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{ height: "45px" }}
                  className="w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            <NavigationLinks />
          </nav>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-3">
            {user && profile ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <NotificationDropdown />
                  {unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                    >
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Badge>
                  )}
                </div>

                {/* Menu utilisateur Desktop */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg"
                      >
                        <Avatar className="h-8 w-8 ring-2 ring-blue-100">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-gray-900 max-w-32 truncate">
                            {getDisplayName()}
                          </span>
                          <div className="flex items-center gap-1">
                            {getUserTypeIcon()}
                            <span className="text-xs text-gray-500">
                              {getUserTypeBadge()}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 bg-white/95 backdrop-blur-sm border-blue-100 shadow-xl"
                    >
                      <DropdownMenuLabel className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{getDisplayName()}</span>
                          <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-blue-100" />
                      <DropdownMenuItem 
                        onClick={() => navigate("/profile/complete")}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                        <User className="mr-3 h-4 w-4 text-blue-600" />
                        <span>Mon profil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/settings")}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                        <Settings className="mr-3 h-4 w-4 text-gray-600" />
                        <span>Paramètres</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-blue-100" />
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="cursor-pointer hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Déconnexion</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Menu mobile */}
                <div className="sm:hidden">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80 bg-white/95 backdrop-blur-sm">
                      <div className="flex flex-col h-full">
                        {/* Profil utilisateur mobile */}
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6">
                          <Avatar className="h-12 w-12 ring-2 ring-blue-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {getDisplayName()}
                            </span>
                            <div className="flex items-center gap-1">
                              {getUserTypeIcon()}
                              <span className="text-xs text-gray-600">
                                {getUserTypeBadge()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">
                              {user?.email}
                            </span>
                          </div>
                        </div>

                        {/* Navigation mobile */}
                        <nav className="flex-1 space-y-2">
                          <NavigationLinks 
                            mobile={true} 
                            onLinkClick={() => setMobileMenuOpen(false)} 
                          />
                        </nav>

                        {/* Actions mobiles */}
                        <div className="space-y-2 pt-6 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              navigate("/profile/complete");
                              setMobileMenuOpen(false);
                            }}
                            className="w-full justify-start hover:bg-blue-50"
                          >
                            <User className="mr-3 h-4 w-4" />
                            Mon profil
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              navigate("/settings");
                              setMobileMenuOpen(false);
                            }}
                            className="w-full justify-start hover:bg-blue-50"
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Paramètres
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="w-full justify-start hover:bg-red-50 text-red-600"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Déconnexion
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="hidden sm:flex hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200"
                >
                  <User className="w-4 h-4 mr-2" />
                  Connexion
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;