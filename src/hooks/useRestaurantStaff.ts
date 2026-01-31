import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffInvitation {
  id: string;
  restaurant_id: string;
  email: string;
  role: 'supervisor' | 'wait_staff';
  invited_by: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface RestaurantStaffMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'supervisor' | 'wait_staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export function useStaffInvitations(restaurantId?: string) {
  return useQuery({
    queryKey: ['staff-invitations', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StaffInvitation[];
    },
    enabled: !!restaurantId,
  });
}

export function useRestaurantStaffMembers(restaurantId?: string) {
  return useQuery({
    queryKey: ['restaurant-staff-members', restaurantId],
    queryFn: async () => {
      // First get staff members
      const { data: staffData, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (staffError) throw staffError;
      if (!staffData || staffData.length === 0) return [];

      // Then get their profiles
      const userIds = staffData.map(s => s.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return staffData.map(staff => ({
        ...staff,
        role: staff.role as 'supervisor' | 'wait_staff',
        profiles: profilesMap.get(staff.user_id) || null,
      })) as RestaurantStaffMember[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation: {
      restaurant_id: string;
      email: string;
      role: 'supervisor' | 'wait_staff';
      invited_by: string;
    }) => {
      const { data, error } = await supabase
        .from('staff_invitations')
        .insert(invitation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-invitations', data.restaurant_id] });
    },
  });
}

export function useDeleteStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from('staff_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-invitations', data.restaurantId] });
    },
  });
}

export function useUpdateStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<{ role: string; is_active: boolean }> 
    }) => {
      const { data, error } = await supabase
        .from('restaurant_staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff-members', data.restaurant_id] });
    },
  });
}

export function useRemoveStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from('restaurant_staff')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return { restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff-members', data.restaurantId] });
    },
  });
}
