import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useSuppliers, useCreateSupplier } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, Phone, Mail, MapPin, Loader2 } from 'lucide-react';

export default function RestaurantSuppliers() {
  const { toast } = useToast();
  const { data: restaurant } = useMyRestaurant();
  const { data: suppliers, isLoading } = useSuppliers(restaurant?.id);
  const createSupplier = useCreateSupplier();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleAddSupplier = async () => {
    if (!restaurant || !newSupplier.name) return;

    try {
      await createSupplier.mutateAsync({
        ...newSupplier,
        restaurant_id: restaurant.id,
        is_active: true,
      });
      toast({ title: 'Supplier added successfully' });
      setShowAddDialog(false);
      setNewSupplier({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add supplier' });
    }
  };

  const headerActions = (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Supplier</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Company Name *</Label>
            <Input
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder="e.g., Fresh Farms Co."
            />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input
              value={newSupplier.contact_person}
              onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
              placeholder="e.g., John Smith"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Textarea
              value={newSupplier.address}
              onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              placeholder="Full address"
              rows={2}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={newSupplier.notes}
              onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
          <Button 
            variant="hero" 
            className="w-full" 
            onClick={handleAddSupplier}
            disabled={createSupplier.isPending}
          >
            {createSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Supplier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Suppliers"
      subtitle="Manage your vendor relationships"
      headerActions={headerActions}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : suppliers && suppliers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {suppliers.map((supplier, index) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="truncate">{supplier.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {supplier.contact_person && (
                    <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a href={`tel:${supplier.phone}`} className="hover:text-primary truncate">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-primary truncate">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-serif font-semibold mb-2">No suppliers yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your vendors to track purchases
          </p>
          <Button variant="hero" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Supplier
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
