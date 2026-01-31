import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrackedOrder {
  id: string;
  table_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export function useOrderTracking(orderId: string | null) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Fetch initial order
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, table_number, status, total_amount, created_at, updated_at')
        .eq('id', orderId)
        .single();

      if (!error && data) {
        setOrder(data as TrackedOrder);
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          setOrder(payload.new as TrackedOrder);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order, loading };
}

export function useRecentOrders(restaurantId: string | undefined, tableNumber: number) {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // Fetch recent orders for this table (last 2 hours)
    const fetchOrders = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, table_number, status, total_amount, created_at, updated_at')
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber)
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as TrackedOrder[]);
      }
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to realtime updates for this table
    const channel = supabase
      .channel(`table-orders-${restaurantId}-${tableNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as TrackedOrder;
            if (newOrder.table_number === tableNumber) {
              setOrders(prev => [newOrder, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id ? payload.new as TrackedOrder : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableNumber]);

  return { orders, loading };
}

export const ORDER_STATUSES = {
  pending: {
    label: 'Order Received',
    description: 'Your order has been received',
    color: 'bg-yellow-500',
    step: 1,
  },
  preparing: {
    label: 'Preparing',
    description: 'The kitchen is preparing your food',
    color: 'bg-blue-500',
    step: 2,
  },
  ready: {
    label: 'Ready',
    description: 'Your order is ready to be served',
    color: 'bg-green-500',
    step: 3,
  },
  completed: {
    label: 'Completed',
    description: 'Order has been delivered',
    color: 'bg-primary',
    step: 4,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order was cancelled',
    color: 'bg-destructive',
    step: 0,
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;
