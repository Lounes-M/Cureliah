import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client.browser';

// WebSocket connection states
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Real-time event types
type RealtimeEventType = 
  | 'booking_created'
  | 'booking_updated'
  | 'booking_cancelled'
  | 'message_received'
  | 'user_status_changed'
  | 'notification_received'
  | 'appointment_reminder'
  | 'system_alert';

interface RealtimeEvent {
  type: RealtimeEventType;
  payload: any;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

interface RealtimeSubscription {
  id: string;
  channel: string;
  filters?: Record<string, any>;
  callback: (event: RealtimeEvent) => void;
}

class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventCallbacks: Map<RealtimeEventType, ((event: RealtimeEvent) => void)[]> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Initialize the realtime connection
  async initialize(userId?: string): Promise<void> {
    try {
      this.connectionState = 'connecting';
      
      // Initialize Supabase realtime
      if (userId) {
        await this.setupSupabaseRealtime(userId);
      }

      // Setup heartbeat to maintain connection
      this.startHeartbeat();
      
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      
      console.log('Realtime service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize realtime service:', error);
      this.connectionState = 'error';
      this.scheduleReconnect();
    }
  }

  // Setup Supabase realtime subscriptions
  private async setupSupabaseRealtime(userId: string): Promise<void> {
    // Subscribe to booking changes
    const bookingChannel = supabase
      .channel('booking_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleSupabaseEvent('booking', payload);
      })
      .subscribe();

    // Subscribe to messages
    const messageChannel = supabase
      .channel('message_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`
      }, (payload) => {
        this.handleSupabaseEvent('message', payload);
      })
      .subscribe();

    // Subscribe to notifications
    const notificationChannel = supabase
      .channel('notification_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleSupabaseEvent('notification', payload);
      })
      .subscribe();

    // Subscribe to user presence
    const presenceChannel = supabase
      .channel('user_presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        this.handlePresenceUpdate(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handleUserJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handleUserLeave(key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await presenceChannel.track({
            userId,
            online_at: new Date().toISOString(),
            status: 'online'
          });
        }
      });
  }

  // Handle Supabase realtime events
  private handleSupabaseEvent(type: string, payload: any): void {
    let eventType: RealtimeEventType;
    
    switch (type) {
      case 'booking':
        eventType = payload.eventType === 'INSERT' ? 'booking_created' : 
                   payload.eventType === 'UPDATE' ? 'booking_updated' : 'booking_cancelled';
        break;
      case 'message':
        eventType = 'message_received';
        break;
      case 'notification':
        eventType = 'notification_received';
        break;
      default:
        return;
    }

    const event: RealtimeEvent = {
      type: eventType,
      payload: payload.new || payload.old,
      timestamp: new Date(),
      metadata: { source: 'supabase', table: payload.table }
    };

    this.emitEvent(event);
  }

  // Handle presence updates
  private handlePresenceUpdate(state: any): void {
    const event: RealtimeEvent = {
      type: 'user_status_changed',
      payload: { presenceState: state },
      timestamp: new Date(),
      metadata: { type: 'presence_sync' }
    };

    this.emitEvent(event);
  }

  private handleUserJoin(key: string, presences: any[]): void {
    const event: RealtimeEvent = {
      type: 'user_status_changed',
      payload: { action: 'join', key, presences },
      timestamp: new Date(),
      metadata: { type: 'user_join' }
    };

    this.emitEvent(event);
  }

  private handleUserLeave(key: string, presences: any[]): void {
    const event: RealtimeEvent = {
      type: 'user_status_changed',
      payload: { action: 'leave', key, presences },
      timestamp: new Date(),
      metadata: { type: 'user_leave' }
    };

    this.emitEvent(event);
  }

  // Emit event to all subscribers
  private emitEvent(event: RealtimeEvent): void {
    const callbacks = this.eventCallbacks.get(event.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in realtime event callback:', error);
      }
    });

    // Also emit to generic subscribers
    this.subscriptions.forEach(subscription => {
      if (this.matchesSubscriptionFilters(event, subscription)) {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });
  }

  // Check if event matches subscription filters
  private matchesSubscriptionFilters(event: RealtimeEvent, subscription: RealtimeSubscription): boolean {
    if (!subscription.filters) return true;

    for (const [key, value] of Object.entries(subscription.filters)) {
      if (key === 'type' && event.type !== value) return false;
      if (key === 'userId' && event.userId !== value) return false;
      // Add more filter logic as needed
    }

    return true;
  }

  // Subscribe to specific event types
  subscribe(eventType: RealtimeEventType, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }

    const callbacks = this.eventCallbacks.get(eventType)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to channel with filters
  subscribeToChannel(
    channel: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ): string {
    const subscriptionId = `${channel}_${Date.now()}_${Math.random()}`;
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      filters,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  // Unsubscribe from channel
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  // Send message through realtime
  async sendMessage(channel: string, event: string, payload: any): Promise<void> {
    try {
      const supabaseChannel = supabase.channel(channel);
      await supabaseChannel.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (error) {
      console.error('Failed to send realtime message:', error);
    }
  }

  // Connection management
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  private async ping(): Promise<void> {
    try {
      // Simple ping to keep connection alive
      await this.sendMessage('heartbeat', 'ping', { timestamp: Date.now() });
    } catch (error) {
      console.warn('Heartbeat failed:', error);
      this.connectionState = 'error';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    
    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.initialize();
    }, delay);
  }

  // Get connection state
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Cleanup
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.subscriptions.clear();
    this.eventCallbacks.clear();
    this.connectionState = 'disconnected';

    // Unsubscribe from all Supabase channels
    supabase.removeAllChannels();
  }
}

// React hook for realtime functionality
export const useRealtime = (userId?: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const realtimeService = useRef(RealtimeService.getInstance());

  useEffect(() => {
    const service = realtimeService.current;
    
    if (userId && !isInitialized) {
      service.initialize(userId).then(() => {
        setIsInitialized(true);
      });
    }

    // Monitor connection state
    const checkConnection = setInterval(() => {
      setConnectionState(service.getConnectionState());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
    };
  }, [userId, isInitialized]);

  const subscribe = useCallback((
    eventType: RealtimeEventType,
    callback: (event: RealtimeEvent) => void
  ) => {
    return realtimeService.current.subscribe(eventType, callback);
  }, []);

  const subscribeToChannel = useCallback((
    channel: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ) => {
    return realtimeService.current.subscribeToChannel(channel, callback, filters);
  }, []);

  const sendMessage = useCallback((channel: string, event: string, payload: any) => {
    return realtimeService.current.sendMessage(channel, event, payload);
  }, []);

  const addEvent = useCallback((event: RealtimeEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
  }, []);

  return {
    connectionState,
    events,
    subscribe,
    subscribeToChannel,
    sendMessage,
    addEvent,
    isConnected: connectionState === 'connected'
  };
};

// Hook for specific realtime features
export const useRealtimeBookings = (userId: string) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribeCreate = subscribe('booking_created', (event) => {
      setBookings(prev => [event.payload, ...prev]);
    });

    const unsubscribeUpdate = subscribe('booking_updated', (event) => {
      setBookings(prev => prev.map(booking => 
        booking.id === event.payload.id ? { ...booking, ...event.payload } : booking
      ));
    });

    const unsubscribeCancel = subscribe('booking_cancelled', (event) => {
      setBookings(prev => prev.filter(booking => booking.id !== event.payload.id));
    });

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeCancel();
    };
  }, [subscribe]);

  return { bookings };
};

export const useRealtimeMessages = (userId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribe = subscribe('message_received', (event) => {
      setMessages(prev => [event.payload, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [subscribe]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { messages, unreadCount, markAsRead };
};

export const useRealtimeNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribe = subscribe('notification_received', (event) => {
      setNotifications(prev => [event.payload, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(event.payload.title, {
          body: event.payload.message,
          icon: '/logo.png'
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return { notifications };
};

export const useUserPresence = (userId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribe = subscribe('user_status_changed', (event) => {
      if (event.metadata?.type === 'user_join') {
        event.payload.presences.forEach((presence: any) => {
          setOnlineUsers(prev => new Set([...prev, presence.userId]));
        });
      } else if (event.metadata?.type === 'user_leave') {
        event.payload.presences.forEach((presence: any) => {
          setOnlineUsers(prev => {
            const updated = new Set(prev);
            updated.delete(presence.userId);
            return updated;
          });
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return { onlineUsers: Array.from(onlineUsers) };
};

export { RealtimeService };
export type { RealtimeEvent, RealtimeEventType, ConnectionState };
