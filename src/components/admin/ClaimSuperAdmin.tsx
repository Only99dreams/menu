import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, CheckCircle } from 'lucide-react';

export function ClaimSuperAdmin() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    if (!session?.access_token) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'Please log in first to claim super admin access.',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('assign-super-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          variant: 'destructive',
          title: 'Cannot claim admin',
          description: data.error,
        });
      } else {
        setClaimed(true);
        toast({
          title: 'Success!',
          description: data.message,
        });
        // Reload the page to refresh roles
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to claim super admin role',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card variant="glass" className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <CardTitle>Claim Super Admin Access</CardTitle>
        <CardDescription>
          As the first user, you can become the platform administrator.
          This is a one-time action.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {claimed ? (
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span>Super admin role assigned! Redirecting...</span>
          </div>
        ) : (
          <Button 
            variant="hero" 
            size="lg" 
            onClick={handleClaim} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Claim Super Admin
              </>
            )}
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Note: Only available if no super admin exists yet.
        </p>
      </CardContent>
    </Card>
  );
}
