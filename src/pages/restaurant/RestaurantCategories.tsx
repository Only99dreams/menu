import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useUpdateCategoriesOrder, Category } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Loader2,
  Trash2,
  Edit2,
  X,
  Save,
  GripVertical,
  FolderOpen
} from 'lucide-react';

export default function RestaurantCategories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const { data: categories, isLoading: categoriesLoading } = useCategories(restaurant?.id);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateOrder = useUpdateCategoriesOrder();
  
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (categories) {
      setOrderedCategories([...categories].sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [categories]);

  const handleReorder = (newOrder: Category[]) => {
    setOrderedCategories(newOrder);
  };

  const saveOrder = async () => {
    if (!restaurant) return;
    
    const updates = orderedCategories.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));
    
    try {
      await updateOrder.mutateAsync({ items: updates, restaurantId: restaurant.id });
      toast({ title: 'Order saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving order' });
    }
  };

  const hasOrderChanged = categories && orderedCategories.some((cat, index) => 
    categories.findIndex(c => c.id === cat.id) !== index
  );

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: formData.name,
          description: formData.description || null,
        });
        toast({ title: 'Category updated' });
      } else {
        await createCategory.mutateAsync({
          restaurant_id: restaurant.id,
          name: formData.name,
          description: formData.description || null,
          sort_order: orderedCategories.length,
        });
        toast({ title: 'Category created' });
      }
      resetForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving category' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!restaurant || !confirm('Delete this category? Items will be uncategorized.')) return;
    
    try {
      await deleteCategory.mutateAsync({ id, restaurantId: restaurant.id });
      toast({ title: 'Category deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting category' });
    }
  };

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
        <span className="hidden sm:inline">Add Category</span>
      </Button>
    </>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Categories"
      subtitle="Organize your menu items"
      headerActions={headerActions}
    >
      <div className="space-y-6 max-w-3xl">
        {/* Add/Edit Form */}
        {showForm && (
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingCategory ? 'Edit Category' : 'New Category'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Appetizers, Main Course, Desserts"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                    {(createCategory.isPending || updateCategory.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        {categoriesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !orderedCategories || orderedCategories.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Category
            </Button>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Drag categories to reorder. Click "Save Order" to persist changes.</p>
            <Reorder.Group axis="y" values={orderedCategories} onReorder={handleReorder} className="space-y-2">
              {orderedCategories.map((category) => (
                <Reorder.Item key={category.id} value={category}>
                  <Card variant="interactive" className="p-3 sm:p-4 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-muted-foreground hidden sm:block">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button size="icon" variant="outline" onClick={() => handleEdit(category)} className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                          <Edit2 className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteCategory.isPending}
                          className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                        >
                          <Trash2 className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">Delete</span>
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
