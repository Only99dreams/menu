import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { 
  Clock, 
  ChefHat,
  CheckCircle,
  RefreshCw,
  Bell,
  Loader2,
  BellRing
} from 'lucide-react';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    variant: 'pending' as const,
    icon: Clock,
    nextStatus: 'preparing' as const,
    nextLabel: 'Start Preparing'
  },
  preparing: { 
    label: 'Preparing', 
    variant: 'preparing' as const,
    icon: ChefHat,
    nextStatus: 'ready' as const,
    nextLabel: 'Mark Ready'
  },
  ready: { 
    label: 'Ready', 
    variant: 'delivered' as const,
    icon: CheckCircle,
    nextStatus: 'completed' as const,
    nextLabel: 'Mark Completed'
  },
  completed: { 
    label: 'Completed', 
    variant: 'delivered' as const,
    icon: CheckCircle,
    nextStatus: null,
    nextLabel: null
  }
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const { data: orders, isLoading: ordersLoading, refetch } = useOrders(restaurant?.id);
  const updateStatus = useUpdateOrderStatus();
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('all');

  // Order notifications with realtime updates
  const { requestPermission, hasPermission, isConnected } = useOrderNotifications({
    restaurantId: restaurant?.id,
    enabled: !!restaurant?.id,
    onNewOrder: () => {},
    onOrderUpdate: () => {},
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const filteredOrders = (orders || []).filter(order => 
    filter === 'all' || order.status === filter
  );

  const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;
  const preparingCount = orders?.filter(o => o.status === 'preparing').length || 0;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ id: orderId, status: newStatus });
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
      {/* Realtime connection status */}
      <div className="hidden sm:flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      
      {!hasPermission && (
        <Button variant="outline" size="sm" onClick={requestPermission} className="hidden sm:flex">
          <BellRing className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Enable Notifications</span>
        </Button>
      )}
      {pendingCount > 0 && (
        <Badge variant="pending" className="text-sm px-3 py-1.5">
          <Bell className="w-4 h-4 mr-1.5 animate-pulse" />
          <span className="hidden sm:inline">{pendingCount} New</span>
          <span className="sm:hidden">{pendingCount}</span>
        </Badge>
      )}
      <Button variant="outline" size="icon" onClick={() => refetch()}>
        <RefreshCw className="w-4 h-4" />
      </Button>
    </>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Live Orders"
      subtitle={restaurant?.name || 'Your Restaurant'}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'preparing', 'ready', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
              className="text-xs sm:text-sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-warning text-warning-foreground text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              {status === 'preparing' && preparingCount > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {preparingCount}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card 
                      variant="glass" 
                      className={order.status === 'pending' ? 'border-warning/50 animate-glow-pulse' : ''}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="table-badge flex-shrink-0">{order.table_number}</div>
                            <div className="min-w-0">
                              <CardTitle className="text-base lg:text-lg truncate">Order #{order.id.slice(0, 8)}</CardTitle>
                              <p className="text-xs lg:text-sm text-muted-foreground">
                                {formatTimeAgo(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={config.variant} className="flex-shrink-0">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">{config.label}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-serif font-bold">
                            ${Number(order.total_amount).toFixed(2)}
                          </p>
                        </div>

                        {config.nextStatus && (
                          <Button 
                            variant={order.status === 'pending' ? 'hero' : 'default'}
                            className="w-full"
                            onClick={() => handleStatusChange(order.id, config.nextStatus!)}
                            disabled={updateStatus.isPending}
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              config.nextLabel
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!ordersLoading && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-serif font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              Orders will appear here when customers place them
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
