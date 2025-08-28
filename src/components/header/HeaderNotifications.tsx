/**
 * Composant de notifications intelligent pour le Header
 * Utilise le hook useSmartNotifications pour optimiser les performances
 */

import React from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { logger } from '@/services/logger';

interface HeaderNotificationsProps {
  userId?: string;
  userType?: 'doctor' | 'establishment' | 'admin';
}

export function HeaderNotifications({ userId, userType }: HeaderNotificationsProps) {
  const {
    unread,
    urgent,
    isRealTimeConnected,
    refreshNotifications,
    debug
  } = useSmartNotifications({
    userId,
    userType,
    enableRealtime: true,
    fallbackPollingInterval: 60000 // 1 minute
  });

  const hasNotifications = unread > 0;
  const hasUrgentNotifications = urgent > 0;

  const handleNotificationClick = () => {
    logger.userAction('notifications_opened', userId || '');
    // La logique d'ouverture des notifications sera gérée ici
  };

  const getNotificationIcon = () => {
    if (hasUrgentNotifications) {
      return (
        <div className="relative">
          <Bell className="h-5 w-5 text-red-600 animate-pulse" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full animate-pulse" />
        </div>
      );
    }

    if (hasNotifications) {
      return (
        <div className="relative">
          <Bell className="h-5 w-5 text-medical-blue" />
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-medical-blue rounded-full" />
        </div>
      );
    }

    return <Bell className="h-5 w-5 text-gray-600" />;
  };

  const getStatusIndicator = () => {
    if (!isRealTimeConnected && debug.pollingActive) {
      return (
        <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" 
             title="Mode polling - Temps réel non disponible" />
      );
    }

    if (isRealTimeConnected) {
      return (
        <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-medical-green-light rounded-full" 
             title="Temps réel connecté" />
      );
    }

    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-10 w-10 p-0 ${
            hasUrgentNotifications ? 'hover:bg-red-50' : 
            hasNotifications ? 'hover:bg-blue-50' : 'hover:bg-gray-100'
          }`}
          onClick={handleNotificationClick}
          aria-label={`${unread} notifications non lues${urgent > 0 ? `, ${urgent} urgentes` : ''}`}
        >
          {getNotificationIcon()}
          {getStatusIndicator()}
          
          {/* Badge de compteur */}
          {hasNotifications && (
            <Badge 
              className={`absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs font-bold ${
                hasUrgentNotifications 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-medical-blue text-white'
              }`}
              variant={hasUrgentNotifications ? 'destructive' : 'default'}
            >
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-2">
              {/* Indicateur de statut de connexion */}
              <div className={`flex items-center gap-1 text-xs ${
                isRealTimeConnected ? 'text-medical-green' : 'text-yellow-600'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  isRealTimeConnected ? 'bg-medical-green-light' : 'bg-yellow-500'
                }`} />
                {isRealTimeConnected ? 'Temps réel' : 'Polling'}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNotifications}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Messages selon l'état des notifications */}
          {!hasNotifications ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Notifications urgentes */}
              {hasUrgentNotifications && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <Bell className="h-4 w-4 animate-pulse" />
                    <span className="font-medium">
                      {urgent} notification{urgent > 1 ? 's' : ''} urgente{urgent > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Résumé des notifications */}
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">
                  {unread} notification{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}
                </p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-medical-blue"
                  onClick={() => {
                    log.userAction('view_all_notifications', userId);
                    // Navigation vers la page complète des notifications
                  }}
                >
                  Voir toutes les notifications →
                </Button>
              </div>
            </div>
          )}

          {/* Debug info en développement */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug: Erreurs: {debug.errorCount}</p>
              <p>Channel: {debug.realTimeChannel || 'None'}</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
