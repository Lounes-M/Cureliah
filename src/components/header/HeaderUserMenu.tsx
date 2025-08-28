/**
 * Menu utilisateur du Header
 * Gère les actions utilisateur et le profil
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  LogOut, 
  Crown,
  Building,
  Stethoscope
} from 'lucide-react';
import { logger } from '@/services/logger';

interface UserProfile {
  id: string;
  email?: string;
  user_type: 'doctor' | 'establishment' | 'admin';
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface UserMenuProps {
  user: UserProfile;
  onSignOut: () => void;
  isMobile?: boolean;
  subscriptionPlan?: 'essentiel' | 'pro' | 'premium';
  subscriptionStatus?: 'active' | 'inactive' | 'trial';
}

export function UserMenu({ 
  user, 
  onSignOut, 
  isMobile = false,
  subscriptionPlan = 'essentiel',
  subscriptionStatus = 'inactive'
}: UserMenuProps) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    logger.userAction('sign_out', user.id);
    onSignOut();
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'doctor': return Stethoscope;
      case 'establishment': return Building;
      case 'admin': return Crown;
      default: return User;
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'doctor': return 'Médecin';
      case 'establishment': return 'Établissement';
      case 'admin': return 'Administrateur';
      default: return 'Utilisateur';
    }
  };

  const getSubscriptionBadge = () => {
    if (subscriptionStatus === 'active') {
      const colors = {
        essentiel: 'bg-blue-100 text-blue-800',
        pro: 'bg-purple-100 text-purple-800', 
        premium: 'bg-gold-100 text-gold-800'
      };
      return (
        <Badge className={`text-xs ${colors[subscriptionPlan]} border-0`}>
          {subscriptionPlan.toUpperCase()}
        </Badge>
      );
    }
    return null;
  };

  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Profil utilisateur mobile */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.first_name} {user.last_name}
              </p>
              {getSubscriptionBadge()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {React.createElement(getUserTypeIcon(user.user_type), { 
                className: "h-3 w-3 text-gray-500" 
              })}
              <p className="text-xs text-gray-500">
                {getUserTypeLabel(user.user_type)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions mobile */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-left h-auto p-3"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4 mr-3" />
            <span>Mon Profil</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-left h-auto p-3"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-3" />
            <span>Paramètres</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-left h-auto p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span>Se déconnecter</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          data-user-menu-trigger
          aria-label="Menu utilisateur"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {user.first_name} {user.last_name}
              </p>
              {getSubscriptionBadge()}
            </div>
            
            <div className="flex items-center gap-2">
              {React.createElement(getUserTypeIcon(user.user_type), { 
                className: "h-3 w-3 text-muted-foreground" 
              })}
              <p className="text-xs leading-none text-muted-foreground">
                {getUserTypeLabel(user.user_type)}
              </p>
            </div>
            
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Mon Profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
