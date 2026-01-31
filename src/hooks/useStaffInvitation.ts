import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  restaurant_id: string;
  restaurants: {
    id: string;
    name: string;
    slug: string;
  };
}

export function usePendingInvitation(email: string | undefined) {
  return useQuery({
    queryKey: ['pending-invitation', email],
    queryFn: async () => {
      if (!email) return null;
      
      const { data, error } = await supabase
        .from('staff_invitations')
        .select(`
          id,
          email,
          role,
          status,
          restaurant_id,
          restaurants (
            id,
            name,
            slug
          )
        `)
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching invitation:', error);
        return null;
      }
      
      return data as PendingInvitation | null;
    },
    enabled: !!email,
  });
}

export function useAcceptInvitation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, userId }: { invitationId: string; userId: string }) => {
      // Get the invitation details
      const { data: invitation, error: invError } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (invError) throw invError;

      // Add user to restaurant_staff
      const { error: staffError } = await supabase
        .from('restaurant_staff')
        .insert({
          restaurant_id: invitation.restaurant_id,
          user_id: userId,
          role: invitation.role,
        });

      if (staffError) throw staffError;

      // Add role to user_roles
      const roleValue = invitation.role as 'supervisor' | 'wait_staff';
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: roleValue,
        });

      if (roleError && roleError.code !== '23505') {
        // Ignore duplicate role error
        throw roleError;
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('staff_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      return invitation;
    },
    onSuccess: (invitation) => {
      toast({
        title: 'Invitation accepted!',
        description: `You've joined the restaurant as ${invitation.role}`,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-invitation'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to accept invitation',
        description: error.message,
      });
    },
  });
}

export function useDeclineInvitation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('staff_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation declined',
        description: 'You can always ask for a new invitation later',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-invitation'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to decline invitation',
        description: error.message,
      });
    },
  });
}
