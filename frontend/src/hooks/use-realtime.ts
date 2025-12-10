import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './use-websocket';
import { useAuthStore } from '@/stores/auth.store';

export type RealtimeEvent =
  | 'message.new'
  | 'message.read'  
  | 'notification.new'
  | 'booking.updated'
  | 'payment.completed'
  | 'user.status'
  | 'typing.start'
  | 'typing.stop';

export interface RealtimeMessage<T = unknown> {
  event: RealtimeEvent;
  channel: string;
  data: T;
  timestamp: string;
}

export interface UseRealtimeOptions {
  channels?: string[];
  autoConnect?: boolean;
}

/**
 * Hook for managing real-time updates via WebSocket
 * @param options - Configuration options
 * @returns Real-time subscription and event management functions
 */
export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const { channels = [], autoConnect = true } = options;
  const { user, isAuthenticated } = useAuthStore();
  
  const eventHandlersRef = useRef<
    Map<RealtimeEvent, Set<(data: any) => void>>
  >(new Map());

  // WebSocket connection
  const wsUrl = isAuthenticated && autoConnect ? '/ws/realtime/' : null;
  
  const { status, sendMessage, isConnected } = useWebSocket(wsUrl, {
    onMessage: (event: MessageEvent) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        
        // Call all handlers for this event type
        const handlers = eventHandlersRef.current.get(message.event);
        if (handlers) {
          handlers.forEach((handler) => handler(message.data));
        }
      } catch (error) {
        console.error('Failed to parse realtime message:', error);
      }
    },
    reconnect: true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  // Subscribe to channels on connection
  useEffect(() => {
    if (isConnected && channels.length > 0) {
      channels.forEach((channel) => {
        sendMessage({
          type: 'subscribe',
          channel,
        });
      });
    }
  }, [isConnected, channels, sendMessage]);

  /**
   * Subscribe to a channel
   */
  const subscribe = useCallback(
    (channel: string) => {
      if (isConnected) {
        sendMessage({
          type: 'subscribe',
          channel,
        });
      }
    },
    [isConnected, sendMessage]
  );

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback(
    (channel: string) => {
      if (isConnected) {
        sendMessage({
          type: 'unsubscribe',
          channel,
        });
      }
    },
    [isConnected, sendMessage]
  );

  /**
   * Listen for a specific event
   */
  const on = useCallback((event: RealtimeEvent, handler: (data: any) => void) => {
    const handlers = eventHandlersRef.current.get(event) || new Set();
    handlers.add(handler);
    eventHandlersRef.current.set(event, handlers);

    // Return cleanup function
    return () => {
      const handlers = eventHandlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(event);
        }
      }
    };
  }, []);

  /**
   * Emit an event to the server
   */
  const emit = useCallback(
    (event: RealtimeEvent, data: any, channel?: string) => {
      if (isConnected) {
        sendMessage({
          type: 'event',
          event,
          channel: channel || 'default',
          data,
        });
      }
    },
    [isConnected, sendMessage]
  );

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      emit(isTyping ? 'typing.start' : 'typing.stop', {}, `conversation:${conversationId}`);
    },
    [emit]
  );

  /**
   * Update user presence
   */
  const updatePresence = useCallback(
    (status: 'online' | 'away' | 'offline') => {
      if (isConnected && user) {
        sendMessage({
          type: 'presence',
          status,
          userId: user.id,
        });
      }
    },
    [isConnected, user, sendMessage]
  );

  return {
    status,
    isConnected,
    subscribe,
    unsubscribe,
    on,
    emit,
    sendTyping,
    updatePresence,
  };
};
