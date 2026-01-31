import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useMenuItems(restaurantId?: string) {
  return useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () => {
      let query = supabase.from('menu_items').select('*');
      
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }
      
      const { data, error } = await query.order('sort_order');
      
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurantId,
  });
}

export function useMenuItemsBySlug(slug: string) {
  return useQuery({
    queryKey: ['menu-items-by-slug', slug],
    queryFn: async () => {
      // First get the restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (restaurantError) throw restaurantError;
      if (!restaurant) return [];
      
      // Then get menu items
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!slug,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

export function useUpdateMenuItemsOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map(item => 
        supabase
          .from('menu_items')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
}

// Sample 3D food models from free sources
export const SAMPLE_3D_MODELS = [
  {
    name: 'Burger',
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  },
  {
    name: 'Pizza',
    url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
  },
];
