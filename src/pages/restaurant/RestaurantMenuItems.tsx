import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useUpdateMenuItemsOrder, MenuItem } from '@/hooks/useMenuItems';
import { useCategories } from '@/hooks/useCategories';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Move3D,
  Image as ImageIcon,
  X,
  Save,
  GripVertical
} from 'lucide-react';

export default function RestaurantMenuItems() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems(restaurant?.id);
  const { data: categories } = useCategories(restaurant?.id);
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const updateOrder = useUpdateMenuItemsOrder();
  const { uploading, uploadFile } = useFileUpload();
  
  const [orderedItems, setOrderedItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    model_url: '',
  });
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (menuItems) {
      setOrderedItems([...menuItems].sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [menuItems]);

  const handleReorder = (newOrder: MenuItem[]) => {
    setOrderedItems(newOrder);
  };

  const saveOrder = async () => {
    const updates = orderedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));
    
    try {
      await updateOrder.mutateAsync(updates);
      toast({ title: 'Order saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving order' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category_id: '', image_url: '', model_url: '' });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category_id: item.category_id || '',
      image_url: item.image_url || '',
      model_url: item.model_url || '',
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file, 'menu-images', restaurant?.id);
    if (result) {
      setFormData(prev => ({ ...prev, image_url: result.url }));
      toast({ title: 'Image uploaded successfully' });
    }
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast({ 
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a .glb or .gltf file',
      });
      return;
    }
    
    const result = await uploadFile(file, 'models', restaurant?.id);
    if (result) {
      setFormData(prev => ({ ...prev, model_url: result.url }));
      toast({ title: '3D model uploaded successfully' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const itemData = {
      restaurant_id: restaurant.id,
      category_id: formData.category_id || null,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      image_url: formData.image_url || null,
      model_url: formData.model_url || null,
      is_available: true,
      is_featured: false,
      sort_order: orderedItems.length,
    };

    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...itemData });
        toast({ title: 'Menu item updated' });
      } else {
        await createItem.mutateAsync(itemData);
        toast({ title: 'Menu item created' });
      }
      resetForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving item' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    await deleteItem.mutateAsync(id);
    toast({ title: 'Menu item deleted' });
  };

  const hasOrderChanged = menuItems && orderedItems.some((item, index) => 
    menuItems.findIndex(m => m.id === item.id) !== index
  );

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const headerActions = (
    <>
      {hasOrderChanged && (
        <Button variant="outline" size="sm" onClick={saveOrder} disabled={updateOrder.isPending}>
          {updateOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 sm:mr-2" />}
          <span className="hidden sm:inline">Save Order</span>
        </Button>
      )}
      <Button size="sm" onClick={() => setShowForm(true)}>
        <Plus className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Add Item</span>
      </Button>
    </>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Menu Items"
      subtitle={restaurant?.name}
      headerActions={headerActions}
    >
      <div className="space-y-6 max-w-5xl">
        {/* Add/Edit Form */}
        {showForm && (
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingItem ? 'Edit Item' : 'New Menu Item'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Wagyu Steak"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="29.99"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">No category</option>
                      {categories?.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Premium A5 wagyu with seasonal vegetables"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image</label>
                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      Upload
                    </Button>
                    {formData.image_url && (
                      <div className="flex items-center gap-2">
                        <img src={formData.image_url} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3D Model Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">3D Model for AR</label>
                  
                  {/* AI Generation - Coming Soon */}
                  <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Move3D className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">AI 3D Model Generation</p>
                        <p className="text-xs text-muted-foreground">
                          Upload a food photo to automatically generate a 3D model for AR
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    </div>
                  </div>
                  
                  {/* Manual Upload */}
                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      ref={modelInputRef}
                      type="file"
                      accept=".glb,.gltf"
                      onChange={handleModelUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => modelInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Move3D className="w-4 h-4 mr-2" />}
                      Upload 3D Model
                    </Button>
                    {formData.model_url && (
                      <div className="flex items-center gap-2">
                        <Badge variant="ar">
                          <Move3D className="w-3 h-3 mr-1" />
                          AR Ready
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormData(prev => ({ ...prev, model_url: '' }))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Or manually upload a .glb/.gltf file</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                    {(createItem.isPending || updateItem.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Menu Items List */}
        {itemsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !orderedItems || orderedItems.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <p className="text-muted-foreground mb-4">No menu items yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Drag items to reorder. Click "Save Order" to persist changes.</p>
            <Reorder.Group axis="y" values={orderedItems} onReorder={handleReorder} className="space-y-3">
              {orderedItems.map((item) => (
                <Reorder.Item key={item.id} value={item}>
                  <Card variant="interactive" className="cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
                      <div className="text-muted-foreground hidden sm:block">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate text-sm sm:text-base">{item.name}</h3>
                          {item.model_url && (
                            <Badge variant="ar" className="flex-shrink-0 hidden sm:flex">
                              <Move3D className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {item.description || 'No description'}
                        </p>
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-primary flex-shrink-0">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button size="icon" variant="outline" onClick={() => handleEdit(item)} className="h-8 w-8 sm:h-9 sm:w-9">
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteItem.isPending}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
