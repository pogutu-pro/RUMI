import { useState, useEffect, useCallback, useRef } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  sendMessage: (data: unknown) => void;
  lastMessage: MessageEvent | null;
}

export const useWebSocket = (
  url: string | null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  
  // Refs to keep track of state without triggering re-renders or dependency cycles
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  // Memoize handlers to prevent effect re-triggering
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  const connect = useCallback(() => {
    if (!url || isUnmountingRef.current) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      setStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        if (isUnmountingRef.current) {
          ws.close();
          return;
        }
        console.log('WebSocket Connected');
        setStatus('connected');
        reconnectCountRef.current = 0;
        onOpenRef.current?.(event);
      };

      ws.onmessage = (event) => {
        if (isUnmountingRef.current) return;
        setLastMessage(event);
        onMessageRef.current?.(event);
      };

      ws.onerror = (event) => {
        if (isUnmountingRef.current) return;
        console.error('WebSocket Error:', event);
        setStatus('error');
        onErrorRef.current?.(event);
      };

      ws.onclose = (event) => {
        if (isUnmountingRef.current) return;
        setStatus('disconnected');
        wsRef.current = null;
        onCloseRef.current?.(event);

        // Handle reconnection
        if (reconnect && reconnectCountRef.current < reconnectAttempts) {
          console.log(`WebSocket Attempting Reconnect (${reconnectCountRef.current + 1}/${reconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

    } catch (error) {
      console.error('WebSocket Connection Failed:', error);
      setStatus('error');
    }
  }, [url, reconnect, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    isUnmountingRef.current = false;
    
    if (url) {
      connect();
    } else {
      setStatus('disconnected');
    }

    return () => {
      isUnmountingRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, url]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    sendMessage,
    lastMessage,
  };
};
