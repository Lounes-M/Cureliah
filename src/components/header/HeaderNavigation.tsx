/**
 * Composant de navigation du Header
 * Gère les éléments de navigation principaux
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
  external?: boolean;
  requiresAuth?: boolean;
  userTypes?: Array<'doctor' | 'establishment' | 'admin'>;
}

interface NavigationItemsProps {
  items: NavigationItem[];
  isMobile?: boolean;
  onItemClick?: () => void;
  userType?: 'doctor' | 'establishment' | 'admin' | null;
  isAuthenticated?: boolean;
}

export function NavigationItems({ 
  items, 
  isMobile = false, 
  onItemClick,
  userType,
  isAuthenticated = false 
}: NavigationItemsProps) {
  const location = useLocation();

  const filteredItems = items.filter(item => {
    // Filtrer selon l'authentification
    if (item.requiresAuth && !isAuthenticated) return false;
    
    // Filtrer selon le type d'utilisateur
    if (item.userTypes && userType && !item.userTypes.includes(userType)) return false;
    
    return true;
  });

  if (isMobile) {
    return (
      <nav className="flex flex-col gap-2 px-4">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href || item.isActive;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-medical-blue text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-2">
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.href || item.isActive;
        const Icon = item.icon;

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-medical-blue text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          );
        }

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-medical-blue text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Configuration des éléments de navigation par type d'utilisateur
 */
import { 
  LayoutDashboard, 
  Search, 
  Calendar, 
  BookOpen, 
  Building,
  Stethoscope,
  Users,
  Settings,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export const NAVIGATION_CONFIG: Record<string, NavigationItem[]> = {
  guest: [
    {
      label: "Recherche",
      href: "/search", 
      icon: Search,
      requiresAuth: false
    },
    {
      label: "Comment ça marche",
      href: "/how-it-works",
      icon: HelpCircle,
      requiresAuth: false
    }
  ],
  
  doctor: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      requiresAuth: true,
      userTypes: ['doctor']
    },
    {
      label: "Recherche",
      href: "/search",
      icon: Search,
      requiresAuth: true
    },
    {
      label: "Mon Planning",
      href: "/calendar", 
      icon: Calendar,
      requiresAuth: true,
      userTypes: ['doctor']
    },
    {
      label: "Mes Réservations",
      href: "/my-bookings",
      icon: BookOpen,
      requiresAuth: true,
      userTypes: ['doctor']
    }
  ],

  establishment: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      requiresAuth: true,
      userTypes: ['establishment']
    },
    {
      label: "Recherche Médecins",
      href: "/search",
      icon: Stethoscope,
      requiresAuth: true
    },
    {
      label: "Gestion Établissement",
      href: "/establishment/management",
      icon: Building,
      requiresAuth: true,
      userTypes: ['establishment']
    }
  ],

  admin: [
    {
      label: "Administration",
      href: "/admin",
      icon: Settings,
      requiresAuth: true,
      userTypes: ['admin']
    },
    {
      label: "Utilisateurs",
      href: "/admin/users", 
      icon: Users,
      requiresAuth: true,
      userTypes: ['admin']
    },
    {
      label: "Analytiques",
      href: "/admin/analytics",
      icon: BarChart3,
      requiresAuth: true,
      userTypes: ['admin']
    }
  ]
};
