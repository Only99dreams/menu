import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useOrders, Order } from '@/hooks/useOrders';
import { ReceiptPrinter } from '@/components/order/ReceiptPrinter';
import { 
  Loader2,
  Download,
  Search,
  Clock,
  CheckCircle,
  ChefHat,
  Filter,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, variant: 'pending' as const },
  preparing: { label: 'Preparing', icon: ChefHat, variant: 'preparing' as const },
  ready: { label: 'Ready', icon: CheckCircle, variant: 'delivered' as const },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'delivered' as const },
};

export default function RestaurantOrderHistory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const { data: orders, isLoading: ordersLoading } = useOrders(restaurant?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Filter orders
  const filteredOrders = (orders || []).filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    if (dateFrom) {
      const orderDate = new Date(order.created_at);
      const fromDate = new Date(dateFrom);
      if (orderDate < fromDate) return false;
    }
    if (dateTo) {
      const orderDate = new Date(order.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTable = order.table_number.toString().includes(query);
      const matchesId = order.id.toLowerCase().includes(query);
      if (!matchesTable && !matchesId) return false;
    }
    
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const deliveredCount = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length;

  const exportToCSV = () => {
    const headers = ['Order ID', 'Table', 'Status', 'Total', 'Date', 'Time'];
    const rows = filteredOrders.map(order => [
      order.id,
      order.table_number,
      order.status,
      `$${Number(order.total_amount).toFixed(2)}`,
      format(new Date(order.created_at), 'yyyy-MM-dd'),
      format(new Date(order.created_at), 'HH:mm'),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const headerActions = (
    <Button size="sm" onClick={exportToCSV} disabled={filteredOrders.length === 0}>
      <Download className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );

  return (
    <DashboardLayout
      role="restaurant"
      title="Order History"
      subtitle={restaurant?.name}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="glass">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl sm:text-3xl font-serif font-bold">{filteredOrders.length}</p>
                </div>
                <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl sm:text-3xl font-serif font-bold">{deliveredCount}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl sm:text-3xl font-serif font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
                <span className="text-2xl sm:text-3xl">💰</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-sm text-muted-foreground mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Table or Order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders - Mobile Cards / Desktop Table */}
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <p className="text-muted-foreground">No orders found</p>
          </Card>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-3">
              {filteredOrders.map((order, index) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card variant="glass" className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="table-badge">{order.table_number}</span>
                          <div>
                            <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={config.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">${Number(order.total_amount).toFixed(2)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setReceiptOrder(order)}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <Card variant="glass" className="hidden lg:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Table</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-b border-border/50 hover:bg-secondary/30"
                        >
                          <td className="p-4 font-mono text-sm">
                            {order.id.slice(0, 8)}...
                          </td>
                          <td className="p-4">
                            <span className="table-badge">{order.table_number}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant={config.variant}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="p-4 font-semibold">
                            ${Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {format(new Date(order.created_at), 'h:mm a')}
                          </td>
                          <td className="p-4">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setReceiptOrder(order)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Receipt Dialog */}
        {receiptOrder && (
          <ReceiptPrinter
            open={!!receiptOrder}
            onClose={() => setReceiptOrder(null)}
            order={{
              orderId: receiptOrder.id,
              tableNumber: receiptOrder.table_number,
              restaurantName: restaurant?.name || 'Restaurant',
              items: [],
              totalAmount: Number(receiptOrder.total_amount),
              createdAt: receiptOrder.created_at,
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
