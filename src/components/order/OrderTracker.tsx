import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrackedOrder, ORDER_STATUSES, OrderStatus } from '@/hooks/useOrderTracking';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  XCircle,
  Package,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderTrackerProps {
  orders: TrackedOrder[];
  onClose?: () => void;
}

export function OrderTracker({ orders, onClose }: OrderTrackerProps) {
  const activeOrders = orders.filter(o => 
    o.status !== 'completed' && o.status !== 'cancelled'
  );

  if (activeOrders.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-4 right-4 z-40"
    >
      <Card className="p-4 bg-card/95 backdrop-blur-xl border-border shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Active Orders ({activeOrders.length})
          </h3>
          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {activeOrders.map(order => (
            <OrderStatusCard key={order.id} order={order} />
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

interface OrderStatusCardProps {
  order: TrackedOrder;
}

export function OrderStatusCard({ order }: OrderStatusCardProps) {
  const status = order.status as OrderStatus;
  const statusInfo = ORDER_STATUSES[status] || ORDER_STATUSES.pending;
  const steps = ['pending', 'preparing', 'ready'] as const;

  return (
    <div className="bg-background rounded-xl p-3 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <div>
            <p className="font-medium text-sm">{statusInfo.label}</p>
            <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm">${Number(order.total_amount).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const stepInfo = ORDER_STATUSES[step];
          const isActive = statusInfo.step >= stepInfo.step;
          const isCurrent = status === step;

          return (
            <div key={step} className="flex-1 flex items-center">
              <motion.div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isActive ? stepInfo.color : 'bg-muted'
                }`}
                initial={false}
                animate={isCurrent ? { opacity: [0.5, 1] } : { opacity: 1 }}
                transition={isCurrent ? { duration: 1, repeat: Infinity, repeatType: 'reverse' } : {}}
              />
              {index < steps.length - 1 && <div className="w-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'pending':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center"
        >
          <Clock className="w-4 h-4 text-yellow-500" />
        </motion.div>
      );
    case 'preparing':
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"
        >
          <ChefHat className="w-4 h-4 text-blue-500" />
        </motion.div>
      );
    case 'ready':
      return (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </motion.div>
      );
    case 'cancelled':
      return (
        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
          <XCircle className="w-4 h-4 text-destructive" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
      );
  }
}

interface FullOrderTrackerProps {
  order: TrackedOrder;
  onClose: () => void;
}

export function FullOrderTracker({ order, onClose }: FullOrderTrackerProps) {
  const status = order.status as OrderStatus;
  const statusInfo = ORDER_STATUSES[status] || ORDER_STATUSES.pending;
  const steps = [
    { key: 'pending', icon: Clock, label: 'Received' },
    { key: 'preparing', icon: ChefHat, label: 'Preparing' },
    { key: 'ready', icon: CheckCircle2, label: 'Ready' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-serif font-bold">Order Status</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Main Status Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="mb-6"
        >
          <StatusIcon status={status} />
        </motion.div>

        <h3 className="text-2xl font-bold mb-2">{statusInfo.label}</h3>
        <p className="text-muted-foreground mb-8">{statusInfo.description}</p>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 w-full max-w-xs">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = statusInfo.step >= ORDER_STATUSES[step.key].step;
            const isCurrent = status === step.key;

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? ORDER_STATUSES[step.key].color : 'bg-muted'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={isCurrent ? { duration: 1, repeat: Infinity } : {}}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <p className={`text-xs mt-2 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-2 rounded ${isActive ? ORDER_STATUSES[step.key].color : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Order Details */}
        <div className="mt-12 text-center">
          <p className="text-3xl font-bold text-primary mb-2">
            ${Number(order.total_amount).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            Ordered {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full" onClick={onClose}>
          Back to Menu
        </Button>
      </div>
    </motion.div>
  );
}
