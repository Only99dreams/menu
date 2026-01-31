import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  RestaurantStaffMember, 
  useUpdateStaffMember, 
  useRemoveStaffMember 
} from '@/hooks/useRestaurantStaff';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Shield, User, Trash2, Loader2 } from 'lucide-react';

interface StaffListProps {
  staff: RestaurantStaffMember[];
  restaurantId: string;
  isLoading: boolean;
}

export function StaffList({ staff, restaurantId, isLoading }: StaffListProps) {
  const { toast } = useToast();
  const updateStaff = useUpdateStaffMember();
  const removeStaff = useRemoveStaffMember();
  
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; staffId: string; name: string }>({
    open: false,
    staffId: '',
    name: '',
  });

  const handleRoleChange = async (staffId: string, newRole: 'supervisor' | 'wait_staff') => {
    try {
      await updateStaff.mutateAsync({ id: staffId, updates: { role: newRole } });
      toast({ title: 'Role updated successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update role' });
    }
  };

  const handleRemove = async () => {
    try {
      await removeStaff.mutateAsync({ id: removeDialog.staffId, restaurantId });
      toast({ title: 'Staff member removed' });
      setRemoveDialog({ open: false, staffId: '', name: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to remove staff member' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!staff || staff.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-serif font-semibold mb-2">No staff members yet</h3>
        <p className="text-muted-foreground">
          Invite staff members to help manage your restaurant
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {staff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profiles?.full_name || member.profiles?.email || 'Staff Member'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === 'supervisor' ? 'default' : 'secondary'}>
                      {member.role === 'supervisor' ? (
                        <><Shield className="w-3 h-3 mr-1" /> Supervisor</>
                      ) : (
                        <><User className="w-3 h-3 mr-1" /> Wait Staff</>
                      )}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'wait_staff' ? (
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'supervisor')}>
                            <Shield className="w-4 h-4 mr-2" />
                            Promote to Supervisor
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'wait_staff')}>
                            <User className="w-4 h-4 mr-2" />
                            Demote to Wait Staff
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setRemoveDialog({
                            open: true,
                            staffId: member.id,
                            name: member.profiles?.full_name || member.profiles?.email || 'this staff member',
                          })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AlertDialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ ...removeDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeDialog.name} from your team? 
              They will lose access to your restaurant's dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              {removeStaff.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
