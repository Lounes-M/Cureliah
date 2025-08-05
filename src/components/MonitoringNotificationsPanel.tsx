import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  Activity, 
  X, 
  Trash2,
  CheckCheck,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { useMonitoringNotifications } from '@/hooks/useMonitoringNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonitoringNotificationsPanelProps {
  className?: string;
}

const MonitoringNotificationsPanel: React.FC<MonitoringNotificationsPanelProps> = ({ 
  className = "" 
}) => {
  const {
    notifications,
    isConnected,
    markAsRead,
    clearAll,
    getUnreadCount,
    getCriticalCount
  } = useMonitoringNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'low': return <Activity className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'error': return 'Erreur';
      case 'performance_alert': return 'Performance';
      case 'system_health': return 'Santé Système';
      default: return 'Monitoring';
    }
  };

  const unreadCount = getUnreadCount();
  const criticalCount = getCriticalCount();

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`relative ${criticalCount > 0 ? 'border-red-500 bg-red-50' : ''}`}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            
            {/* Indicateur de connexion */}
            <div className="absolute -top-1 -left-1">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
            </div>

            {/* Badge de notifications */}
            {unreadCount > 0 && (
              <Badge 
                variant={criticalCount > 0 ? "destructive" : "default"}
                className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-96 p-0" 
          align="end"
          sideOffset={8}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications Monitoring
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Indicateur de connexion */}
                  <div className="flex items-center gap-1 text-xs">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Connecté</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">Déconnecté</span>
                      </>
                    )}
                  </div>
                  
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="h-6 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCheck className="h-8 w-8 mb-2" />
                  <p className="text-sm">Aucune notification</p>
                  <p className="text-xs">Tout fonctionne normalement</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-1 p-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.severity === 'critical' 
                            ? 'bg-red-50 border-red-200' 
                            : notification.severity === 'high'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                        } relative group`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Indicateur de sévérité */}
                          <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(notification.severity)}`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getSeverityIcon(notification.severity)}
                              <span className="text-xs font-medium text-muted-foreground">
                                {getTypeLabel(notification.type)}
                              </span>
                              <Badge 
                                variant={notification.severity === 'critical' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {notification.severity}
                              </Badge>
                            </div>
                            
                            <h4 className="text-sm font-medium mb-1">
                              {notification.title}
                            </h4>
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.timestamp), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </p>
                          </div>
                          
                          {/* Bouton de suppression */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MonitoringNotificationsPanel;
