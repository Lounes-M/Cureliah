import React, { useState } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UrgentNotificationDropdown } from './notifications/UrgentNotificationDropdown';
import { useUrgentNotifications } from '@/hooks/useUrgentNotifications';

interface UrgentNotificationBellProps {
  userId: string;
  userType: 'doctor' | 'establishment';
}

export const UrgentNotificationBell: React.FC<UrgentNotificationBellProps> = ({
  userId,
  userType
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useUrgentNotifications({
    userId,
    userType,
    enableRealtime: true,
    enableToasts: false,
    enableSound: true
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse bg-orange-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <UrgentNotificationDropdown
          userId={userId}
          userType={userType}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onNotificationClick={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
