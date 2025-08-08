import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  X, 
  MoreVertical, 
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react';
import { useUrgentNotifications } from '@/hooks/useUrgentNotifications';
import { UrgentNotificationService } from '@/services/urgentNotificationService';

interface UrgentNotificationDropdownProps {
  userId: string;
  userType: 'doctor' | 'establishment';
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (actionUrl?: string) => void;
}

export const UrgentNotificationDropdown: React.FC<UrgentNotificationDropdownProps> = ({
  userId,
  userType,
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    hasMore
  } = useUrgentNotifications({
    userId,
    userType,
    enableRealtime: true,
    enableToasts: false, // Pas de toasts dans le dropdown
    enableSound: true
  });

  const handleNotificationClick = async (notification: any) => {
    // Marquer comme lue si elle ne l'est pas
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Naviguer vers l'action si disponible
    if (notification.action_url && onNotificationClick) {
      onNotificationClick(notification.action_url);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 md:w-96 z-50">
      <Card className="shadow-lg border-0 ring-1 ring-black ring-opacity-5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600" />
              Notifications urgentes
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Tout lire
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mx-auto mb-1" />
              {error}
            </div>
          )}

          {loading && notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucune notification urgente</p>
              <p className="text-xs text-gray-400 mt-1">
                Vous serez alerté des nouvelles demandes urgentes
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-gray-100">
                {notifications.map((notification, index) => {
                  const icon = UrgentNotificationService.getNotificationIcon(notification.type);
                  const colorClasses = UrgentNotificationService.getNotificationColor(notification.type);
                  const timeAgo = UrgentNotificationService.formatNotificationTime(notification.created_at);

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full text-sm ${colorClasses}`}>
                          {icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {timeAgo}
                            </span>
                            
                            {notification.action_url && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                Voir
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Chargement...
                      </>
                    ) : (
                      <>Charger plus</>
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Composant bouton de notification avec badge
interface NotificationBellProps {
  userId: string;
  userType: 'doctor' | 'establishment';
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userId,
  userType,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { unreadCount } = useUrgentNotifications({
    userId,
    userType,
    enableRealtime: true,
    enableToasts: true,
    enableSound: true
  });

  const handleNotificationClick = (actionUrl?: string) => {
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <UrgentNotificationDropdown
        userId={userId}
        userType={userType}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNotificationClick={handleNotificationClick}
      />
      
      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
