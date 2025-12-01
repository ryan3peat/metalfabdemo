import { useEffect, useRef, useCallback, useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useNotificationSound } from './useNotificationSound';

interface NotificationMessage {
  type: 'new_notification' | 'auth_success';
  notification?: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedQuoteId: string | null;
    relatedRequestId: string | null;
    isRead: boolean;
    createdAt: string;
  };
  clientId?: string;
}

export function useWebSocketNotifications(userId: string | undefined, enabled: boolean = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const { playNotificationSound } = useNotificationSound();

  const connect = useCallback(() => {
    if (!userId || !enabled) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔔 WebSocket connected');
        reconnectAttemptsRef.current = 0;
        
        ws.send(JSON.stringify({ type: 'auth', userId }));
      };

      ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);

          if (message.type === 'auth_success') {
            console.log('🔔 WebSocket authenticated');
            setIsConnected(true);
          }

          if (message.type === 'new_notification' && message.notification) {
            console.log('🔔 New notification received:', message.notification.title);
            
            playNotificationSound();

            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔔 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (enabled && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`🔔 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [userId, enabled, playNotificationSound]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected };
}
