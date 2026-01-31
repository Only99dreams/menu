import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { 
  usePurchaseOrders, 
  useCreatePurchaseOrder,
  useSuppliers,
  useInventoryItems
} from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Package, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function RestaurantPurchaseOrders() {
  const { toast } = useToast();
  const { data: restaurant } = useMyRestaurant();
  const { data: purchaseOrders, isLoading } = usePurchaseOrders(restaurant?.id);
  const { data: suppliers } = useSuppliers(restaurant?.id);
  const { data: inventoryItems } = useInventoryItems(restaurant?.id);
  const createOrder = useCreatePurchaseOrder();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    supplier_id: '',
    notes: '',
    items: [] as Array<{ inventory_item_id: string; quantity_ordered: number; unit_cost: number }>,
  });
  const [newItem, setNewItem] = useState({ inventory_item_id: '', quantity_ordered: 1, unit_cost: 0 });

  const handleAddItem = () => {
    if (!newItem.inventory_item_id) return;
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem],
    });
    setNewItem({ inventory_item_id: '', quantity_ordered: 1, unit_cost: 0 });
  };

  const handleCreateOrder = async () => {
    if (!restaurant || newOrder.items.length === 0) return;

    try {
      const totalAmount = newOrder.items.reduce(
        (sum, item) => sum + item.quantity_ordered * item.unit_cost, 
        0
      );

      await createOrder.mutateAsync({
        order: {
          restaurant_id: restaurant.id,
          supplier_id: newOrder.supplier_id || null,
          order_number: `PO-${Date.now()}`,
          status: 'pending',
          total_amount: totalAmount,
          notes: newOrder.notes || null,
          ordered_at: new Date().toISOString(),
          received_at: null,
          created_by: null,
        },
        items: newOrder.items,
      });
      toast({ title: 'Purchase order created' });
      setShowCreateDialog(false);
      setNewOrder({ supplier_id: '', notes: '', items: [] });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to create order' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'ordered': return Truck;
      case 'received': return CheckCircle;
      default: return Package;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'pending' as const;
      case 'ordered': return 'preparing' as const;
      case 'received': return 'delivered' as const;
      default: return 'secondary' as const;
    }
  };

  const headerActions = (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New Order</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Supplier</Label>
              <Select
                value={newOrder.supplier_id}
                onValueChange={(value) => setNewOrder({ ...newOrder, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={newOrder.notes}
                onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Add Items</Label>
            <div className="flex flex-wrap gap-2">
              <Select
                value={newItem.inventory_item_id}
                onValueChange={(value) => setNewItem({ ...newItem, inventory_item_id: value })}
              >
                <SelectTrigger className="flex-1 min-w-[150px]">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={newItem.quantity_ordered}
                onChange={(e) => setNewItem({ ...newItem, quantity_ordered: parseInt(e.target.value) || 1 })}
                className="w-20"
                placeholder="Qty"
              />
              <Input
                type="number"
                step="0.01"
                value={newItem.unit_cost}
                onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                className="w-24"
                placeholder="$ Cost"
              />
              <Button variant="outline" onClick={handleAddItem}>Add</Button>
            </div>
          </div>

          {newOrder.items.length > 0 && (
            <div className="border rounded-xl p-4 space-y-2">
              {newOrder.items.map((item, idx) => {
                const inventoryItem = inventoryItems?.find(i => i.id === item.inventory_item_id);
                return (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="truncate flex-1">{inventoryItem?.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {item.quantity_ordered} × ${item.unit_cost.toFixed(2)} = ${(item.quantity_ordered * item.unit_cost).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>
                  ${newOrder.items.reduce((sum, i) => sum + i.quantity_ordered * i.unit_cost, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button 
            variant="hero" 
            className="w-full" 
            onClick={handleCreateOrder}
            disabled={createOrder.isPending || newOrder.items.length === 0}
          >
            {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Purchase Orders"
      subtitle="Track orders from suppliers"
      headerActions={headerActions}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : purchaseOrders && purchaseOrders.length > 0 ? (
        <div className="space-y-4">
          {purchaseOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status);
            const supplier = suppliers?.find(s => s.id === order.supplier_id);
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <StatusIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {supplier?.name || 'No supplier'} • {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <p className="font-serif font-bold text-lg">${Number(order.total_amount).toFixed(2)}</p>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-serif font-semibold mb-2">No purchase orders</h3>
          <p className="text-muted-foreground mb-4">
            Create orders to track purchases from suppliers
          </p>
          <Button variant="hero" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Order
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
