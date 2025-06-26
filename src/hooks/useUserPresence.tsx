import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';
import { useAuth } from '@/hooks/useAuth';
import { UserPresence, UserStatus } from '@/types/database';

export function useUserPresence() {
  const { user } = useAuth();
  const [userPresences, setUserPresences] = useState<Record<string, UserPresence>>({});

  useEffect(() => {
    if (!user) return;

    // Set user as online when hook initializes
    updateUserStatus('online');

    // Listen for real-time presence updates
    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          const presence = payload.new as UserPresence;
          if (presence) {
            setUserPresences(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));
          }
        }
      )
      .subscribe();

    // Fetch initial presence data
    fetchAllPresences();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserStatus('away');
      } else {
        updateUserStatus('online');
      }
    };

    // Set up beforeunload listener
    const handleBeforeUnload = () => {
      updateUserStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Update presence every 30 seconds while active
    const interval = setInterval(() => {
      if (!document.hidden) {
        updateUserStatus('online');
      }
    }, 30000);

    return () => {
      updateUserStatus('offline');
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [user]);

  const fetchAllPresences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*');

      if (error) throw error;

      const presenceMap: Record<string, UserPresence> = {};
      data?.forEach(presence => {
        presenceMap[presence.user_id] = presence;
      });
      setUserPresences(presenceMap);
    } catch (error) {
      console.error('Error fetching user presences:', error);
    }
  };

  const updateUserStatus = async (status: UserStatus) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_user_presence', {
        status_param: status
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getUserStatus = (userId: string): UserStatus => {
    const presence = userPresences[userId];
    if (!presence) return 'offline';

    // Consider user offline if last seen was more than 5 minutes ago
    const lastSeen = new Date(presence.last_seen);
    const now = new Date();
    const timeDiff = now.getTime() - lastSeen.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 5) return 'offline';
    return presence.status;
  };

  return {
    userPresences,
    updateUserStatus,
    getUserStatus
  };
}
