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

interface BookingPayload {
  id: string;
  [key: string]: unknown;
}

interface NotificationPayload {
  id?: string;
  title: string;
  message: string;
  [key: string]: unknown;
}

interface PresencePayload {
  presences: Array<{
    user_id?: string;
    status?: string;
    last_seen?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface PresenceState {
  [key: string]: unknown;
}

interface PresenceItem {
  user_id?: string;
  status?: string;
  last_seen?: string;
  [key: string]: unknown;
}

interface BookingItem {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface MessageItem {
  id: string;
  content: string;
  sender_id: string;
  [key: string]: unknown;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  [key: string]: unknown;
}

interface SupabaseEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  table?: string;
}

// Type guards
function isBookingItem(payload: unknown): payload is BookingItem {
  return payload !== null && 
         typeof payload === 'object' && 
         'id' in payload && 
         'status' in payload;
}

function isMessageItem(payload: unknown): payload is MessageItem {
  return payload !== null && 
         typeof payload === 'object' && 
         'id' in payload && 
         'content' in payload && 
         'sender_id' in payload;
}

function isNotificationItem(payload: unknown): payload is NotificationItem {
  return payload !== null && 
         typeof payload === 'object' && 
         'id' in payload && 
         'title' in payload && 
         'message' in payload;
}

interface RealtimeEvent {
  type: RealtimeEventType;
  payload: BookingPayload | NotificationPayload | PresencePayload | unknown;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface RealtimeSubscription {
  id: string;
  channel: string;
  filters?: Record<string, unknown>;
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
      
      // TODO: Replace with logger.info('Realtime service initialized successfully');
      
    } catch (error) {
      // TODO: Replace with logger.error('Failed to initialize realtime service:', error);
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
  private handleSupabaseEvent(type: string, payload: unknown): void {
    const supabasePayload = payload as SupabaseEvent;
    let eventType: RealtimeEventType;
    
    switch (type) {
      case 'booking':
        eventType = supabasePayload.eventType === 'INSERT' ? 'booking_created' : 
                   supabasePayload.eventType === 'UPDATE' ? 'booking_updated' : 'booking_cancelled';
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
      payload: supabasePayload.new || supabasePayload.old || {},
      timestamp: new Date(),
      metadata: { source: 'supabase', table: supabasePayload.table }
    };

    this.emitEvent(event);
  }

  // Handle presence updates
  private handlePresenceUpdate(state: PresenceState): void {
    const event: RealtimeEvent = {
      type: 'user_status_changed',
      payload: { presenceState: state },
      timestamp: new Date(),
      metadata: { type: 'presence_sync' }
    };

    this.emitEvent(event);
  }

  private handleUserJoin(key: string, presences: PresenceItem[]): void {
    const event: RealtimeEvent = {
      type: 'user_status_changed',
      payload: { action: 'join', key, presences },
      timestamp: new Date(),
      metadata: { type: 'user_join' }
    };

    this.emitEvent(event);
  }

  private handleUserLeave(key: string, presences: PresenceItem[]): void {
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
        // TODO: Replace with logger.error('Error in realtime event callback:', error);
      }
    });

    // Also emit to generic subscribers
    this.subscriptions.forEach(subscription => {
      if (this.matchesSubscriptionFilters(event, subscription)) {
        try {
          subscription.callback(event);
        } catch (error) {
          // TODO: Replace with logger.error('Error in subscription callback:', error);
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
    filters?: Record<string, unknown>
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
  async sendMessage(channel: string, event: string, payload: unknown): Promise<void> {
    try {
      const supabaseChannel = supabase.channel(channel);
      await supabaseChannel.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (error) {
      // TODO: Replace with logger.error('Failed to send realtime message:', error);
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
      // TODO: Replace with logger.warn('Heartbeat failed:', error);
      this.connectionState = 'error';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // TODO: Replace with logger.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    
    setTimeout(() => {
      this.reconnectAttempts++;
      // TODO: Replace with logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts});`);
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
    filters?: Record<string, unknown>
  ) => {
    return realtimeService.current.subscribeToChannel(channel, callback, filters);
  }, []);

  const sendMessage = useCallback((channel: string, event: string, payload: unknown) => {
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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribeCreate = subscribe('booking_created', (event) => {
      if (isBookingItem(event.payload)) {
        setBookings(prev => [event.payload as BookingItem, ...prev]);
      }
    });

    const unsubscribeUpdate = subscribe('booking_updated', (event) => {
      const payload = event.payload as BookingPayload;
      setBookings(prev => prev.map(booking => 
        booking.id === payload.id ? { ...booking, ...payload } : booking
      ));
    });

    const unsubscribeCancel = subscribe('booking_cancelled', (event) => {
      const payload = event.payload as BookingPayload;
      setBookings(prev => prev.filter(booking => booking.id !== payload.id));
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
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribe = subscribe('message_received', (event) => {
      if (isMessageItem(event.payload)) {
        setMessages(prev => [event.payload as MessageItem, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { messages, unreadCount, markAsRead };
};

export const useRealtimeNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { subscribe } = useRealtime(userId);

  useEffect(() => {
    const unsubscribe = subscribe('notification_received', (event) => {
      const payload = event.payload as NotificationPayload;
      if (isNotificationItem(payload)) {
        setNotifications(prev => [payload as NotificationItem, ...prev]);
      }
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.message,
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
      const payload = event.payload as PresencePayload;
      if (event.metadata?.type === 'user_join') {
        payload.presences.forEach((presence) => {
          if (presence.user_id && typeof presence.user_id === 'string') {
            setOnlineUsers(prev => new Set([...prev, presence.user_id as string]));
          }
        });
      } else if (event.metadata?.type === 'user_leave') {
        payload.presences.forEach((presence) => {
          if (presence.user_id && typeof presence.user_id === 'string') {
            setOnlineUsers(prev => {
              const updated = new Set(prev);
              updated.delete(presence.user_id as string);
              return updated;
            });
          }
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return { onlineUsers: Array.from(onlineUsers) };
};

export { RealtimeService };
export type { RealtimeEvent, RealtimeEventType, ConnectionState };
