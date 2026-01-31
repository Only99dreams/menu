import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingInvitation, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useStaffInvitation';
import { Store, UserPlus, X, Loader2 } from 'lucide-react';

export function AcceptInvitationBanner() {
  const { user } = useAuth();
  const { data: invitation, isLoading } = usePendingInvitation(user?.email);
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  if (isLoading || !invitation || !user) return null;

  const handleAccept = () => {
    acceptInvitation.mutate({
      invitationId: invitation.id,
      userId: user.id,
    });
  };

  const handleDecline = () => {
    declineInvitation.mutate(invitation.id);
  };

  const isProcessing = acceptInvitation.isPending || declineInvitation.isPending;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
      >
        <Card variant="glass" className="border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Staff Invitation</h3>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {invitation.role.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You've been invited to join <strong className="text-foreground">{invitation.restaurants?.name}</strong>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {acceptInvitation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDecline}
                    disabled={isProcessing}
                  >
                    {declineInvitation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
