import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Supplier {
  id: string;
  restaurant_id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  supplier_id: string | null;
  name: string;
  sku: string | null;
  unit: string;
  quantity_in_stock: number;
  minimum_stock_level: number;
  cost_per_unit: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  restaurant_id: string;
  supplier_id: string | null;
  order_number: string;
  status: string;
  total_amount: number;
  notes: string | null;
  ordered_at: string | null;
  received_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  created_at: string;
}

export interface WasteLogEntry {
  id: string;
  restaurant_id: string;
  inventory_item_id: string;
  quantity: number;
  reason: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface MenuItemIngredient {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity_required: number;
  created_at: string;
}

// Suppliers
export function useSuppliers(restaurantId?: string) {
  return useQuery({
    queryKey: ['suppliers', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.restaurant_id] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.restaurant_id] });
    },
  });
}

// Inventory Items
export function useInventoryItems(restaurantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ['inventory', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', data.restaurant_id] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', data.restaurant_id] });
    },
  });
}

// Purchase Orders
export function usePurchaseOrders(restaurantId?: string) {
  return useQuery({
    queryKey: ['purchase-orders', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      order, 
      items 
    }: { 
      order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>; 
      items: Array<{ inventory_item_id: string; quantity_ordered: number; unit_cost: number }>;
    }) => {
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .insert(order)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        ...item,
        purchase_order_id: orderData.id,
        quantity_received: 0,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data.restaurant_id] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items }: { 
      orderId: string; 
      items: Array<{ id: string; quantity_received: number; inventory_item_id: string }>;
    }) => {
      // Update purchase order status
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .update({ status: 'received', received_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      // Update each item's received quantity and inventory
      for (const item of items) {
        // Update PO item
        await supabase
          .from('purchase_order_items')
          .update({ quantity_received: item.quantity_received })
          .eq('id', item.id);

        // Update inventory
        const { data: inventoryItem } = await supabase
          .from('inventory_items')
          .select('quantity_in_stock')
          .eq('id', item.inventory_item_id)
          .single();

        if (inventoryItem) {
          await supabase
            .from('inventory_items')
            .update({ 
              quantity_in_stock: Number(inventoryItem.quantity_in_stock) + item.quantity_received 
            })
            .eq('id', item.inventory_item_id);
        }
      }

      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', data.restaurant_id] });
    },
  });
}

// Waste Log
export function useWasteLog(restaurantId?: string) {
  return useQuery({
    queryKey: ['waste-log', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waste_log')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WasteLogEntry[];
    },
    enabled: !!restaurantId,
  });
}

export function useLogWaste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<WasteLogEntry, 'id' | 'created_at'>) => {
      // Log the waste
      const { data, error } = await supabase
        .from('waste_log')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;

      // Deduct from inventory
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('quantity_in_stock')
        .eq('id', entry.inventory_item_id)
        .single();

      if (inventoryItem) {
        await supabase
          .from('inventory_items')
          .update({ 
            quantity_in_stock: Math.max(0, Number(inventoryItem.quantity_in_stock) - entry.quantity)
          })
          .eq('id', entry.inventory_item_id);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waste-log', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', data.restaurant_id] });
    },
  });
}

// Menu Item Ingredients
export function useMenuItemIngredients(menuItemId?: string) {
  return useQuery({
    queryKey: ['menu-item-ingredients', menuItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select('*')
        .eq('menu_item_id', menuItemId!);

      if (error) throw error;
      return data as MenuItemIngredient[];
    },
    enabled: !!menuItemId,
  });
}

export function useLinkIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: Omit<MenuItemIngredient, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .insert(link)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-ingredients', data.menu_item_id] });
    },
  });
}

// Low stock items
export function useLowStockItems(restaurantId?: string) {
  return useQuery({
    queryKey: ['low-stock', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true);

      if (error) throw error;
      
      // Filter items where stock is at or below minimum level
      return (data as InventoryItem[]).filter(
        item => Number(item.quantity_in_stock) <= Number(item.minimum_stock_level)
      );
    },
    enabled: !!restaurantId,
  });
}
