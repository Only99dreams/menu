import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UseOrderNotificationsOptions {
  restaurantId?: string;
  enabled?: boolean;
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (order: any) => void;
}

export function useOrderNotifications({ 
  restaurantId, 
  enabled = true,
  onNewOrder,
  onOrderUpdate
}: UseOrderNotificationsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Request notification permission
  useEffect(() => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  // Create audio element for notification sound - use a more audible beep
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a more audible notification sound using oscillator
      audioRef.current = new Audio();
      // Use a base64-encoded beep sound
      audioRef.current.src = 'data:audio/wav;base64,UklGRl9vT19teleGEmMId3pNDJokIjAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVxvT19teleGEmMId3pNDJokIj////+BhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2te';
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    // Create a more reliable notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      // Fallback to audio element
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, []);

  const showNewOrderNotification = useCallback((tableNumber: number, total: number, orderId: string) => {
    // In-app toast with action
    toast({
      title: `🍽️ New Order - Table ${tableNumber}`,
      description: `$${total.toFixed(2)} - Click to view details`,
      duration: 10000,
    });

    // Play sound
    playNotificationSound();

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🍽️ New Order!', {
        body: `Table ${tableNumber} - $${total.toFixed(2)}`,
        icon: '/pwa-192x192.png',
        tag: `order-${orderId}`,
        requireInteraction: true,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [toast, playNotificationSound]);

  const showOrderUpdateNotification = useCallback((tableNumber: number, status: string) => {
    const statusEmoji: Record<string, string> = {
      preparing: '👨‍🍳',
      ready: '✅',
      completed: '🎉',
      cancelled: '❌',
    };
    
    toast({
      title: `${statusEmoji[status] || '📝'} Order Updated - Table ${tableNumber}`,
      description: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      duration: 5000,
    });
  }, [toast]);

  // Subscribe to realtime order updates (both INSERT and UPDATE)
  useEffect(() => {
    if (!restaurantId || !enabled) return;

    console.log('Setting up realtime subscription for restaurant:', restaurantId);

    const channel = supabase
      .channel(`orders-realtime-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('New order received:', payload.new);
          const order = payload.new as any;
          showNewOrderNotification(order.table_number, Number(order.total_amount), order.id);
          onNewOrder?.(order);
          // Invalidate orders query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order updated:', payload.new);
          const order = payload.new as any;
          const oldOrder = payload.old as any;
          
          // Only show notification if status changed
          if (order.status !== oldOrder.status) {
            showOrderUpdateNotification(order.table_number, order.status);
          }
          
          onOrderUpdate?.(order);
          // Invalidate orders query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [restaurantId, enabled, showNewOrderNotification, showOrderUpdateNotification, onNewOrder, onOrderUpdate, queryClient]);

  return {
    isConnected,
    requestPermission: () => {
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    },
    hasPermission: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
  };
}
