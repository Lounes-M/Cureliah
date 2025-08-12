import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Check, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Settings, 
  Loader2,
  Star,
  DollarSign,
  Clock,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Eye,
  Filter,
  Archive
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export default function NotificationCenter() {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(notification => {
    const isUnread = !notification.read_at;
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && isUnread);
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesFilter && matchesType;
  });

  const handleDeleteNotification = async (id: string) => {
    // TODO: Replace with logger.info('🗑️ Starting deletion for notification:', id);
    // TODO: Replace with logger.info('🔐 Current user ID:', user?.id);
    
    try {
      // TODO: Replace with logger.info('📞 Calling deleteNotification from hook...');
      await deleteNotification(id);
      // TODO: Replace with logger.info('✅ Delete operation completed successfully');
    } catch (error) {
      // TODO: Replace with logger.error('❌ Error in handleDeleteNotification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return Calendar;
      case 'review':
        return Star;
      case 'payment':
        return DollarSign;
      case 'message':
        return MessageSquare;
      case 'reminder':
        return Clock;
      case 'system':
        return Settings;
      case 'document':
        return FileText;
      case 'info':
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-medical-blue';
      case 'review':
        return 'text-yellow-600';
      case 'payment':
        return 'text-medical-green';
      case 'message':
        return 'text-purple-600';
      case 'reminder':
        return 'text-orange-600';
      case 'system':
        return 'text-gray-600';
      case 'document':
        return 'text-indigo-600';
      case 'info':
      default:
        return 'text-medical-blue';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} jour(s)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Centre de notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tout marquer lu
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                    Tous les types
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('booking')}>
                    Réservations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('review')}>
                    Avis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('payment')}>
                    Paiements
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('message')}>
                    Messages
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-medical-blue text-sm font-medium">Non lues</p>
                <p className="text-2xl font-bold text-blue-900">{unreadCount}</p>
              </div>
              <Bell className="w-8 h-8 text-medical-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-medical-green text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-green-900">{notifications.length}</p>
              </div>
              <Archive className="w-8 h-8 text-medical-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">
                Toutes ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Non lues ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-500">
                {filter === 'unread' ? 'Toutes vos notifications sont lues' : 
                 'Vous n\'avez aucune notification pour le moment'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-6 hover:bg-gray-50 transition-colors',
                        !notification.read_at && 'bg-blue-50/30'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-2 rounded-lg bg-gray-100 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read_at && (
                                <div className="w-2 h-2 bg-medical-blue rounded-full"></div>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.read_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Marquer comme lu"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.read_at && (
                                <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Marquer comme lu
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}