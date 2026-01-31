import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingInvitation, useAcceptInvitation } from '@/hooks/useStaffInvitation';
import { Store, UserPlus, Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, loading: authLoading } = useAuth();
  const { data: invitation, isLoading: inviteLoading } = usePendingInvitation(user?.email);
  const acceptInvitation = useAcceptInvitation();

  // If user is logged in and has accepted, redirect to dashboard
  useEffect(() => {
    if (acceptInvitation.isSuccess) {
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [acceptInvitation.isSuccess, navigate]);

  const handleAccept = () => {
    if (invitation && user) {
      acceptInvitation.mutate({
        invitationId: invitation.id,
        userId: user.id,
      });
    }
  };

  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - prompt to login/signup
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="text-center">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign in to accept invitation</CardTitle>
              <CardDescription>
                You need to be logged in to accept this staff invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild variant="hero" className="w-full">
                <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                  Sign In
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to={`/signup?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // No pending invitation for this user
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="text-center">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>No invitation found</CardTitle>
              <CardDescription>
                This invitation may have expired or already been used. Please contact the restaurant owner for a new invitation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/">Go Home</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Accepted successfully
  if (acceptInvitation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="text-center">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <CardTitle>Welcome to the team!</CardTitle>
              <CardDescription>
                You've successfully joined {invitation.restaurants?.name}. Redirecting to your dashboard...
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show invitation details
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card variant="glass">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>You're invited!</CardTitle>
            <CardDescription>
              You've been invited to join the team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold">{invitation.restaurants?.name}</h3>
              <Badge className="capitalize">
                {invitation.role.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="hero"
                className="w-full gap-2"
                onClick={handleAccept}
                disabled={acceptInvitation.isPending}
              >
                {acceptInvitation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Accept Invitation
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Maybe Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
