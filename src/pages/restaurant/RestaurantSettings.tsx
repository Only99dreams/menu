import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRestaurant, useUpdateRestaurant } from '@/hooks/useRestaurants';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';
import { ShareableLink } from '@/components/restaurant/ShareableLink';
import { 
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Building2,
  Phone,
  MapPin,
  X,
  CreditCard
} from 'lucide-react';

export default function RestaurantSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const updateRestaurant = useUpdateRestaurant();
  const { uploading, uploadFile } = useFileUpload();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    logo_url: '',
    cover_image_url: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        logo_url: restaurant.logo_url || '',
        cover_image_url: restaurant.cover_image_url || '',
        bank_name: (restaurant as any).bank_name || '',
        bank_account_name: (restaurant as any).bank_account_name || '',
        bank_account_number: (restaurant as any).bank_account_number || '',
      });
    }
  }, [restaurant]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file, 'menu-images', restaurant?.id);
    if (result) {
      setFormData(prev => ({ ...prev, logo_url: result.url }));
      toast({ title: 'Logo uploaded successfully' });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file, 'menu-images', restaurant?.id);
    if (result) {
      setFormData(prev => ({ ...prev, cover_image_url: result.url }));
      toast({ title: 'Cover image uploaded successfully' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      await updateRestaurant.mutateAsync({
        id: restaurant.id,
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        phone: formData.phone || null,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        bank_name: formData.bank_name || null,
        bank_account_name: formData.bank_account_name || null,
        bank_account_number: formData.bank_account_number || null,
      } as any);
      toast({ title: 'Settings saved successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving settings' });
    }
  };

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      role="restaurant"
      title="Settings"
      subtitle="Manage your restaurant profile"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Cover Image Section */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Cover Image
            </CardTitle>
            <CardDescription>Displayed at the top of your menu page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[3/1] rounded-xl overflow-hidden bg-muted">
              {formData.cover_image_url ? (
                <>
                  <img
                    src={formData.cover_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <p className="text-sm">No cover image</p>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Cover Image
            </Button>
          </CardContent>
        </Card>

        {/* Logo & Name Section */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Restaurant Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                {formData.logo_url && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Restaurant Logo</label>
                <p className="text-sm text-muted-foreground">Upload a square image for best results</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Logo
                </Button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Restaurant Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your Restaurant Name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell customers about your restaurant..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Settings */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bank Account for Payments
            </CardTitle>
            <CardDescription>Configure bank details for customer payments on delivery orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Name</label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="e.g. First Bank, GTBank"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Name</label>
              <Input
                value={formData.bank_account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Number</label>
              <Input
                value={formData.bank_account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                placeholder="0123456789"
              />
            </div>
          </CardContent>
        </Card>

        {restaurant?.slug && (
          <ShareableLink restaurantSlug={restaurant.slug} restaurantName={restaurant.name} />
        )}

        {/* Save Button */}
        <div className="flex justify-end pb-4">
          <Button type="submit" size="lg" disabled={updateRestaurant.isPending}>
            {updateRestaurant.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
