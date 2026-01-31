import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { 
  useInventoryItems, 
  useCreateInventoryItem, 
  useUpdateInventoryItem,
  useSuppliers,
  useLowStockItems,
  useLogWaste
} from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  Search,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';

export default function RestaurantInventory() {
  const { toast } = useToast();
  const { data: restaurant } = useMyRestaurant();
  const { data: inventoryItems, isLoading } = useInventoryItems(restaurant?.id);
  const { data: suppliers } = useSuppliers(restaurant?.id);
  const { data: lowStockItems } = useLowStockItems(restaurant?.id);
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const logWaste = useLogWaste();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWasteDialog, setShowWasteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [wasteReason, setWasteReason] = useState('');
  
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    unit: 'unit',
    quantity_in_stock: 0,
    minimum_stock_level: 10,
    cost_per_unit: 0,
    category: '',
    supplier_id: '',
  });

  const filteredItems = inventoryItems?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = async () => {
    if (!restaurant || !newItem.name) return;

    try {
      await createItem.mutateAsync({
        ...newItem,
        restaurant_id: restaurant.id,
        supplier_id: newItem.supplier_id || null,
        is_active: true,
      });
      toast({ title: 'Item added successfully' });
      setShowAddDialog(false);
      setNewItem({
        name: '',
        sku: '',
        unit: 'unit',
        quantity_in_stock: 0,
        minimum_stock_level: 10,
        cost_per_unit: 0,
        category: '',
        supplier_id: '',
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add item' });
    }
  };

  const handleLogWaste = async () => {
    if (!restaurant || !selectedItem || !wasteQuantity) return;

    try {
      await logWaste.mutateAsync({
        restaurant_id: restaurant.id,
        inventory_item_id: selectedItem,
        quantity: parseFloat(wasteQuantity),
        reason: wasteReason || null,
        logged_by: null,
      });
      toast({ title: 'Waste logged successfully' });
      setShowWasteDialog(false);
      setSelectedItem(null);
      setWasteQuantity('');
      setWasteReason('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to log waste' });
    }
  };

  const getStockStatus = (item: { quantity_in_stock: number; minimum_stock_level: number }) => {
    const qty = Number(item.quantity_in_stock);
    const min = Number(item.minimum_stock_level);
    if (qty === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (qty <= min) return { label: 'Low Stock', variant: 'pending' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const headerActions = (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={newItem.sku}
                onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                placeholder="e.g., TOM-001"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Unit</Label>
              <Select
                value={newItem.unit}
                onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="g">Gram</SelectItem>
                  <SelectItem value="l">Liter</SelectItem>
                  <SelectItem value="ml">Milliliter</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="case">Case</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                placeholder="e.g., Produce"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={newItem.quantity_in_stock}
                onChange={(e) => setNewItem({ ...newItem, quantity_in_stock: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Min Level</Label>
              <Input
                type="number"
                value={newItem.minimum_stock_level}
                onChange={(e) => setNewItem({ ...newItem, minimum_stock_level: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={newItem.cost_per_unit}
                onChange={(e) => setNewItem({ ...newItem, cost_per_unit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          {suppliers && suppliers.length > 0 && (
            <div>
              <Label>Supplier</Label>
              <Select
                value={newItem.supplier_id}
                onValueChange={(value) => setNewItem({ ...newItem, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button 
            variant="hero" 
            className="w-full" 
            onClick={handleAddItem}
            disabled={createItem.isPending}
          >
            {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Inventory"
      subtitle="Manage your stock and supplies"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-warning text-base sm:text-lg">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                {lowStockItems.length} item(s) are running low
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <Badge key={item.id} variant="outline" className="border-warning text-warning text-xs">
                    {item.name}: {item.quantity_in_stock} {item.unit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Inventory - Mobile Cards / Desktop Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <>
            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-3">
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                return (
                  <Card key={item.id} variant="glass" className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.sku || 'No SKU'}</p>
                      </div>
                      <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity_in_stock} {item.unit}</span>
                      <span className="font-medium">${Number(item.cost_per_unit).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedItem(item.id);
                          setShowWasteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Log Waste
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <Card className="hidden lg:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Item</th>
                        <th className="text-left p-4 font-medium">SKU</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-right p-4 font-medium">Stock</th>
                        <th className="text-right p-4 font-medium">Min</th>
                        <th className="text-right p-4 font-medium">Cost</th>
                        <th className="text-center p-4 font-medium">Status</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const status = getStockStatus(item);
                        return (
                          <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                            <td className="p-4 font-medium">{item.name}</td>
                            <td className="p-4 text-muted-foreground">{item.sku || '-'}</td>
                            <td className="p-4 text-muted-foreground">{item.category || '-'}</td>
                            <td className="p-4 text-right">{item.quantity_in_stock} {item.unit}</td>
                            <td className="p-4 text-right text-muted-foreground">{item.minimum_stock_level}</td>
                            <td className="p-4 text-right">${Number(item.cost_per_unit).toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedItem(item.id);
                                    setShowWasteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-serif font-semibold mb-2">No inventory items</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your stock by adding items
            </p>
            <Button variant="hero" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}
      </div>

      {/* Waste Dialog */}
      <Dialog open={showWasteDialog} onOpenChange={setShowWasteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Waste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(e.target.value)}
                placeholder="Amount wasted"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                placeholder="e.g., Expired, Damaged"
              />
            </div>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleLogWaste}
              disabled={logWaste.isPending}
            >
              {logWaste.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Waste'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
