import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Download, Printer, Loader2 } from 'lucide-react';

export default function RestaurantQRCodes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();

  // Fetch actual tables for this restaurant
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['restaurant-tables', restaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurant!.id)
        .eq('is_active', true)
        .order('table_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleDownloadAll = () => {
    // In production, this would generate a PDF with all QR codes
    console.log('Downloading all QR codes...');
  };

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <DashboardLayout role="restaurant" title="QR Codes" subtitle="No restaurant found">
        <Card variant="glass" className="text-center py-12">
          <p className="text-muted-foreground">You don't have a restaurant yet.</p>
        </Card>
      </DashboardLayout>
    );
  }

  const headerActions = (
    <>
      <Button variant="outline" size="sm" onClick={handleDownloadAll}>
        <Download className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Download All</span>
      </Button>
      <Button variant="outline" size="sm" className="hidden sm:flex">
        <Printer className="w-4 h-4 mr-2" />
        Print All
      </Button>
      <Button variant="hero" size="sm" onClick={() => navigate('/dashboard/settings')}>
        <Plus className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Manage Tables</span>
      </Button>
    </>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="QR Codes"
      subtitle={restaurant.name}
      headerActions={headerActions}
    >
      <div className="space-y-8">
        {/* Main Restaurant QR */}
        <Card variant="premium">
          <CardHeader>
            <CardTitle>Main Restaurant QR Code</CardTitle>
            <CardDescription>
              This QR code opens your menu without a specific table number. 
              Customers can enter their table number manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <QRCodeGenerator 
                restaurantSlug={restaurant.slug}
                restaurantName={restaurant.name}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table QR Codes */}
        <div>
          <h2 className="text-xl font-serif font-semibold mb-4">Table QR Codes</h2>
          <p className="text-muted-foreground mb-6">
            Each table has a unique QR code that automatically fills in the table number for ordering.
          </p>
          
          {tablesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !tables || tables.length === 0 ? (
            <Card variant="glass" className="text-center py-12">
              <p className="text-muted-foreground mb-4">No tables configured yet</p>
              <Button onClick={() => navigate('/dashboard/settings')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tables in Settings
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {tables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <QRCodeGenerator 
                    restaurantSlug={restaurant.slug}
                    restaurantName={restaurant.name}
                    tableNumber={table.table_number}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
