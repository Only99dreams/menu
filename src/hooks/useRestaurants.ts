import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Restaurant {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

export function useRestaurantBySlug(slug: string) {
  return useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Restaurant | null;
    },
    enabled: !!slug,
  });
}

export function useMyRestaurant() {
  const queryClient = useQueryClient();
  
  // Listen for auth changes and invalidate ALL restaurant-related cache when user changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Clear all restaurant-related queries to prevent stale data
        queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
        queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.removeQueries({ queryKey: ['my-restaurant'] });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [queryClient]);
  
  return useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      // Force fresh user check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Restaurant | null;
    },
    staleTime: 0,
    gcTime: 0, // Don't cache results
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurant)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Restaurant> & { id: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] });
    },
  });
}
