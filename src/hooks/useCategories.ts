import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export function useCategories(restaurantId?: string) {
  return useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('sort_order');
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!restaurantId,
  });
}

export function useCategoriesBySlug(slug: string) {
  return useQuery({
    queryKey: ['categories-by-slug', slug],
    queryFn: async () => {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!restaurant) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order');
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!slug,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.restaurant_id] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.restaurant_id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.restaurantId] });
    },
  });
}

export function useUpdateCategoriesOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ items, restaurantId }: { items: { id: string; sort_order: number }[]; restaurantId: string }) => {
      const updates = items.map(item => 
        supabase
          .from('categories')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.restaurantId] });
    },
  });
}
