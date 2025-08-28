/**
 * Header Principal Refactorisé - Version optimisée
 * Réduit de 727 lignes à ~150 lignes en utilisant des composants modulaires
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MobileHeader } from './header/MobileHeader';
import { NavigationItems, NAVIGATION_CONFIG } from './header/HeaderNavigation';
import { UserMenu } from './header/HeaderUserMenu';
import { HeaderNotifications } from './header/HeaderNotifications';
import { logger } from '@/services/logger';

// Import statique du logo (optimisation bundler)
import logoUrl from '/logo.png';

export default function Header() {
  const { user, profile, signOut } = useAuth();

  // Gestion de la déconnexion
  const handleSignOut = async () => {
    try {
      logger.userAction('sign_out_initiated', user?.id || '');
      await signOut();
      logger.userAction('sign_out_completed', user?.id || '');
    } catch (error) {
      logger.error('Sign out failed', error as Error, { userId: user?.id });
    }
  };

  // Configuration de navigation selon le type d'utilisateur
  const getNavigationItems = () => {
    if (!user) {
      return NAVIGATION_CONFIG.guest;
    }

    const userType = user.user_type;
    return NAVIGATION_CONFIG[userType] || NAVIGATION_CONFIG.guest;
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et nom */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Retour à l'accueil Cureliah"
            >
              <img 
                src={logoUrl} 
                alt="Cureliah" 
                className="h-8 w-8"
                width={32}
                height={32}
              />
              <span className="font-bold text-xl text-gray-900">
                Cureliah
              </span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <div className="flex items-center gap-4">
            <NavigationItems 
              items={navigationItems}
              userType={user?.user_type}
              isAuthenticated={!!user}
              isMobile={false}
            />
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <HeaderNotifications 
                  userId={user.id}
                  userType={user.user_type}
                />

                {/* Menu utilisateur desktop */}
                <div className="hidden md:block">
                  <UserMenu 
                    user={{
                      id: user.id,
                      email: user.email,
                      user_type: user.user_type,
                      first_name: profile?.first_name,
                      last_name: profile?.last_name,
                      avatar_url: profile?.avatar_url
                    }}
                    onSignOut={handleSignOut}
                  />
                </div>
              </>
            ) : (
              /* Boutons de connexion/inscription pour visiteurs */
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  asChild
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Link to="/auth?mode=signin">
                    Se connecter
                  </Link>
                </Button>
                <Button 
                  asChild
                  className="bg-medical-blue hover:bg-medical-blue-dark"
                >
                  <Link to="/auth?mode=signup&type=doctor">
                    S'inscrire
                  </Link>
                </Button>
              </div>
            )}

            {/* Menu mobile */}
            <MobileHeader 
              user={user ? {
                id: user.id,
                email: user.email,
                user_type: user.user_type,
                first_name: profile?.first_name,
                last_name: profile?.last_name,
                avatar_url: profile?.avatar_url
              } : null}
              onSignOut={handleSignOut}
              navigationItems={navigationItems.map(item => ({
                ...item,
                isActive: false // sera calculé dans le composant
              }))}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Hook pour les raccourcis clavier du Header
 * Séparé pour une meilleure organisation
 */
function useHeaderKeyboardShortcuts() {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + U pour ouvrir le menu utilisateur
      if (event.altKey && event.key === 'u') {
        event.preventDefault();
        const trigger = document.querySelector('[data-user-menu-trigger]') as HTMLButtonElement;
        if (trigger) {
          trigger.click();
          log.userAction('keyboard_shortcut_user_menu');
        }
      }
      
      // Alt + N pour ouvrir les notifications
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        const notificationButton = document.querySelector('[aria-label*="notifications"]') as HTMLButtonElement;
        if (notificationButton) {
          notificationButton.click();
          log.userAction('keyboard_shortcut_notifications');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

// Export du hook pour utilisation optionnelle
export { useHeaderKeyboardShortcuts };
