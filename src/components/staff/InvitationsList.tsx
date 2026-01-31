import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaffInvitation, useDeleteStaffInvitation } from '@/hooks/useRestaurantStaff';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { Mail, Trash2, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface InvitationsListProps {
  invitations: StaffInvitation[];
  restaurantId: string;
  isLoading: boolean;
}

export function InvitationsList({ invitations, restaurantId, isLoading }: InvitationsListProps) {
  const { toast } = useToast();
  const deleteInvitation = useDeleteStaffInvitation();

  const handleDelete = async (id: string) => {
    try {
      await deleteInvitation.mutateAsync({ id, restaurantId });
      toast({ title: 'Invitation cancelled' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to cancel invitation' });
    }
  };

  const getStatusBadge = (invitation: StaffInvitation) => {
    if (invitation.status === 'accepted') {
      return <Badge variant="delivered"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
    }
    if (invitation.status === 'declined') {
      return <Badge variant="cancelled"><XCircle className="w-3 h-3 mr-1" /> Declined</Badge>;
    }
    if (isPast(new Date(invitation.expires_at))) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    return <Badge variant="preparing"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-serif font-semibold mb-2">No pending invitations</h3>
        <p className="text-muted-foreground">
          Click "Invite Staff" to send an invitation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation, index) => (
        <motion.div
          key={invitation.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.role === 'supervisor' ? 'Supervisor' : 'Wait Staff'} • 
                      Sent {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(invitation)}
                  {invitation.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(invitation.id)}
                      disabled={deleteInvitation.isPending}
                    >
                      {deleteInvitation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
