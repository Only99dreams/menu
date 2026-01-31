import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  full_name?: string;
  created_at: string;
}

export interface StaffTableAssignment {
  id: string;
  restaurant_id: string;
  staff_user_id: string;
  table_id: string;
  shift_id: string | null;
  assignment_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Shift {
  id: string;
  restaurant_id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity: number;
  status: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRestaurantTables(restaurantId?: string) {
  return useQuery({
    queryKey: ['restaurant-tables', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true)
        .order('table_number');

      if (error) throw error;
      return data as RestaurantTable[];
    },
    enabled: !!restaurantId,
  });
}

export function useShifts(restaurantId?: string) {
  return useQuery({
    queryKey: ['shifts', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true)
        .order('start_time');

      if (error) throw error;
      return data as Shift[];
    },
    enabled: !!restaurantId,
  });
}

export function useStaffAssignments(restaurantId?: string, date?: string) {
  return useQuery({
    queryKey: ['staff-assignments', restaurantId, date],
    queryFn: async () => {
      let query = supabase
        .from('staff_table_assignments')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_active', true);

      if (date) {
        query = query.eq('assignment_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StaffTableAssignment[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (table: Omit<RestaurantTable, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert(table)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables', data.restaurant_id] });
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shift: Omit<Shift, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('shifts')
        .insert(shift)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts', data.restaurant_id] });
    },
  });
}

export function useCreateStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: Omit<StaffTableAssignment, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('staff_table_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-assignments', data.restaurant_id] });
    },
  });
}

export function useStaffNotifications(userId?: string) {
  return useQuery({
    queryKey: ['staff-notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .eq('staff_user_id', userId!)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications', data.staff_user_id] });
    },
  });
}
