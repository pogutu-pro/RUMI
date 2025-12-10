import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from '@/lib/auth/token';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketOptions {
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
}

/**
 * Hook for managing WebSocket connections
 * @param url - WebSocket URL (relative or absolute)
 * @param options - Configuration options
 * @returns WebSocket management functions and state
 */
export const useWebSocket = (url: string | null, options: UseWebSocketOptions = {}) => {
  const {
    reconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback((path: string): string => {
    if (path.startsWith('ws://') || path.startsWith('wss://')) {
      return path;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    return `${protocol}//${host}${path.startsWith('/') ? '' : '/'}${path}`;
  }, []);

  const connect = useCallback(() => {
    if (!url || socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setStatus('connecting');
      const wsUrl = getWebSocketUrl(url);
      const token = getAccessToken();
      
      // Add token to URL if available
      const fullUrl = token ? `${wsUrl}?token=${token}` : wsUrl;
      
      const socket = new WebSocket(fullUrl);

      socket.onopen = (event) => {
        setStatus('connected');
        reconnectCountRef.current = 0;
        onOpen?.(event);
      };

      socket.onclose = (event) => {
        setStatus('disconnected');
        socketRef.current = null;
        onClose?.(event);

        // Attempt to reconnect
        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (event) => {
        setStatus('error');
        onError?.(event);
      };

      socket.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      socketRef.current = socket;
    } catch (error) {
      setStatus('error');
      console.error('WebSocket connection error:', error);
    }
  }, [url, getWebSocketUrl, reconnect, reconnectAttempts, reconnectInterval, onOpen, onClose, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('disconnected');
    reconnectCountRef.current = 0;
  }, []);

  const sendMessage = useCallback((data: string | object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(message);
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]); // Only reconnect if URL changes

  return {
    status,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
  };
};
