import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateStaffInvitation } from '@/hooks/useRestaurantStaff';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Mail } from 'lucide-react';

interface StaffInviteDialogProps {
  restaurantId: string;
}

export function StaffInviteDialog({ restaurantId }: StaffInviteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createInvitation = useCreateStaffInvitation();
  
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'supervisor' | 'wait_staff'>('wait_staff');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !user) return;

    try {
      await createInvitation.mutateAsync({
        restaurant_id: restaurantId,
        email,
        role,
        invited_by: user.id,
      });
      
      toast({ 
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${email}`,
      });
      
      setOpen(false);
      setEmail('');
      setRole('wait_staff');
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ 
          variant: 'destructive',
          title: 'Already invited',
          description: 'This email has already been invited to your restaurant',
        });
      } else {
        toast({ 
          variant: 'destructive',
          title: 'Failed to send invitation',
          description: error.message,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          Invite Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Staff Member
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'supervisor' | 'wait_staff')}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wait_staff">Wait Staff</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {role === 'supervisor' 
                ? 'Supervisors can manage orders and view all tables' 
                : 'Wait staff can view assigned tables and manage their orders'}
            </p>
          </div>
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full"
            disabled={createInvitation.isPending}
          >
            {createInvitation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Send Invitation'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
