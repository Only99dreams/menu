import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Order {
  id: string;
  restaurant_id: string;
  table_number: number;
  status: string;
  total_amount: number;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
  menu_items?: {
    name: string;
    image_url: string | null;
  } | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export function useOrders(restaurantId?: string) {
  const queryClient = useQueryClient();
  
  // Set up realtime subscription
  useEffect(() => {
    if (!restaurantId) return;
    
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);
  
  return useQuery({
    queryKey: ['orders', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      order, 
      items 
    }: { 
      order: Omit<Order, 'id' | 'created_at' | 'updated_at'>; 
      items: Array<{ menu_item_id: string; quantity: number; unit_price: number; notes?: string }>;
    }) => {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        ...item,
        order_id: orderData.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.restaurant_id] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.restaurant_id] });
    },
  });
}

export function useOrderItems(orderId?: string) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_items (
            name,
            image_url
          )
        `)
        .eq('order_id', orderId!);
      
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}
