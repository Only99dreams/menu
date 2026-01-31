import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { RestaurantTable, useCreateTable } from '@/hooks/useStaff';
import { RestaurantStaffMember } from '@/hooks/useRestaurantStaff';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Users, 
  MapPin, 
  Edit2, 
  Trash2, 
  Loader2,
  Table as TableIcon,
  UserPlus
} from 'lucide-react';

interface TableManagementProps {
  tables: RestaurantTable[];
  staff: RestaurantStaffMember[];
  restaurantId: string;
  isLoading: boolean;
}

export function TableManagement({ tables, staff, restaurantId, isLoading }: TableManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTable = useCreateTable();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTable, setEditTable] = useState<RestaurantTable | null>(null);
  const [deleteTable, setDeleteTable] = useState<RestaurantTable | null>(null);
  const [assignTable, setAssignTable] = useState<RestaurantTable | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  
  const [newTable, setNewTable] = useState({
    table_number: 1,
    capacity: 4,
    location: '',
  });

  const updateTableMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<RestaurantTable> }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .update(data.updates)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables', restaurantId] });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables', restaurantId] });
    },
  });

  const assignStaffMutation = useMutation({
    mutationFn: async (data: { tableId: string; staffId: string }) => {
      const { error } = await supabase
        .from('staff_table_assignments')
        .insert({
          restaurant_id: restaurantId,
          table_id: data.tableId,
          staff_user_id: data.staffId,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-assignments', restaurantId] });
      toast({ title: 'Staff assigned to table' });
      setAssignTable(null);
      setSelectedStaff('');
    },
  });

  const handleAddTable = async () => {
    if (!restaurantId) return;

    try {
      await createTable.mutateAsync({
        restaurant_id: restaurantId,
        table_number: newTable.table_number,
        capacity: newTable.capacity,
        location: newTable.location || null,
        status: 'available',
        is_active: true,
      });
      toast({ title: 'Table added successfully' });
      setShowAddDialog(false);
      setNewTable({ table_number: (newTable.table_number || 0) + 1, capacity: 4, location: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add table' });
    }
  };

  const handleUpdateTable = async () => {
    if (!editTable) return;

    try {
      await updateTableMutation.mutateAsync({
        id: editTable.id,
        updates: {
          table_number: editTable.table_number,
          capacity: editTable.capacity,
          location: editTable.location,
        },
      });
      toast({ title: 'Table updated successfully' });
      setEditTable(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update table' });
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTable) return;

    try {
      await deleteTableMutation.mutateAsync(deleteTable.id);
      toast({ title: 'Table removed' });
      setDeleteTable(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to remove table' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{tables?.length || 0} tables configured</p>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Table Number</Label>
                  <Input
                    type="number"
                    value={newTable.table_number}
                    onChange={(e) => setNewTable({ ...newTable, table_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 2 })}
                  />
                </div>
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  placeholder="e.g., Patio, Near window"
                />
              </div>
              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleAddTable}
                disabled={createTable.isPending}
              >
                {createTable.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Table'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!tables || tables.length === 0) ? (
        <div className="text-center py-12">
          <TableIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-serif font-semibold mb-2">No tables configured</h3>
          <p className="text-muted-foreground mb-4">Add tables to manage seating and staff assignments</p>
          <Button variant="hero" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {tables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="interactive" className="text-center group">
                <CardContent className="pt-6 relative">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAssignTable(table)}>
                      <UserPlus className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTable(table)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTable(table)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3 text-xl font-bold text-primary">
                    {table.table_number}
                  </div>
                  <p className="font-medium">Table {table.table_number}</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                    <Users className="w-3 h-3" />
                    {table.capacity} seats
                  </div>
                  {table.location && (
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {table.location}
                    </div>
                  )}
                  <Badge 
                    variant={table.status === 'available' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {table.status}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTable} onOpenChange={(open) => !open && setEditTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table {editTable?.table_number}</DialogTitle>
          </DialogHeader>
          {editTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Table Number</Label>
                  <Input
                    type="number"
                    value={editTable.table_number}
                    onChange={(e) => setEditTable({ ...editTable, table_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={editTable.capacity}
                    onChange={(e) => setEditTable({ ...editTable, capacity: parseInt(e.target.value) || 2 })}
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={editTable.location || ''}
                  onChange={(e) => setEditTable({ ...editTable, location: e.target.value })}
                  placeholder="e.g., Patio, Near window"
                />
              </div>
              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleUpdateTable}
                disabled={updateTableMutation.isPending}
              >
                {updateTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={!!assignTable} onOpenChange={(open) => !open && setAssignTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Table {assignTable?.table_number}</DialogTitle>
          </DialogHeader>
          {assignTable && (
            <div className="space-y-4">
              {staff.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No staff members available. Invite staff first!
                </p>
              ) : (
                <>
                  <div>
                    <Label>Select Staff Member</Label>
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.user_id}>
                            {member.profiles?.full_name || member.profiles?.email || 'Staff'} 
                            ({member.role === 'supervisor' ? 'Supervisor' : 'Wait Staff'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    onClick={() => {
                      if (selectedStaff && assignTable) {
                        assignStaffMutation.mutate({ tableId: assignTable.id, staffId: selectedStaff });
                      }
                    }}
                    disabled={!selectedStaff || assignStaffMutation.isPending}
                  >
                    {assignStaffMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Staff'}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTable} onOpenChange={(open) => !open && setDeleteTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table {deleteTable?.table_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the table from your restaurant. Any active assignments will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTable}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
