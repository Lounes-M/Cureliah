/**
 * Composant Header mobile optimisé - Version légère
 * Extrait du Header principal pour réduire la complexité
 */

import React from 'react';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { NavigationItems } from './HeaderNavigation';
import { UserMenu } from './HeaderUserMenu';
import type { User } from '@/hooks/useAuth';

interface MobileHeaderProps {
  user: User | null;
  onSignOut: () => void;
  navigationItems: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
  }>;
}

export function MobileHeader({ user, onSignOut, navigationItems }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 w-10 p-0"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">
            {/* Header du menu mobile */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="Cureliah" 
                  className="h-8 w-8"
                />
                <span className="font-bold text-lg">Cureliah</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation mobile */}
            <div className="flex-1 py-4">
              <NavigationItems 
                items={navigationItems}
                isMobile={true}
                onItemClick={() => setIsOpen(false)}
              />
            </div>

            {/* Menu utilisateur mobile */}
            {user && (
              <div className="border-t p-4">
                <UserMenu 
                  user={user}
                  onSignOut={onSignOut}
                  isMobile={true}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
