import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ARViewer, useARSupport } from '@/components/ar/ARViewer';
import { ARLauncher } from '@/components/ar/ARLauncher';
import { OrderTracker, FullOrderTracker } from '@/components/order/OrderTracker';
import { useMenuItemsBySlug, MenuItem } from '@/hooks/useMenuItems';
import { useCategoriesBySlug } from '@/hooks/useCategories';
import { useRestaurantBySlug } from '@/hooks/useRestaurants';
import { useCreateOrder } from '@/hooks/useOrders';
import { useRecentOrders, TrackedOrder } from '@/hooks/useOrderTracking';
import { useToast } from '@/hooks/use-toast';
import { 
  ChefHat, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Move3D,
  X,
  Send,
  Loader2,
  Smartphone,
  RotateCcw,
  Maximize2,
  Package,
  Camera,
  Truck
} from 'lucide-react';

interface CartItem { 
  id: string; 
  name: string; 
  price: number; 
  quantity: number; 
}

// Demo menu items for when database is empty
const DEMO_MENU: MenuItem[] = [
  { 
    id: 'demo-1', 
    restaurant_id: 'demo',
    category_id: null,
    name: 'Wagyu Steak', 
    description: 'Premium A5 wagyu with seasonal vegetables',
    price: 89.99, 
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
    model_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    is_available: true,
    is_featured: true,
    sort_order: 0,
    created_at: '',
    updated_at: '',
  },
  { 
    id: 'demo-2', 
    restaurant_id: 'demo',
    category_id: null,
    name: 'Caesar Salad', 
    description: 'Fresh romaine with parmesan and croutons',
    price: 14.99, 
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop',
    model_url: null,
    is_available: true,
    is_featured: false,
    sort_order: 1,
    created_at: '',
    updated_at: '',
  },
  { 
    id: 'demo-3', 
    restaurant_id: 'demo',
    category_id: null,
    name: 'Tiramisu', 
    description: 'Classic Italian dessert with mascarpone',
    price: 12.99, 
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
    model_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    is_available: true,
    is_featured: false,
    sort_order: 2,
    created_at: '',
    updated_at: '',
  },
  { 
    id: 'demo-4', 
    restaurant_id: 'demo',
    category_id: null,
    name: 'Red Wine', 
    description: 'House selection Cabernet Sauvignon',
    price: 15.99, 
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
    model_url: null,
    is_available: true,
    is_featured: false,
    sort_order: 3,
    created_at: '',
    updated_at: '',
  },
];

export default function CustomerMenu() {
  const { restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get('t') || '1';
  const isExternalOrder = !searchParams.has('t'); // No table number means external order
  const { toast } = useToast();
  
  const { data: restaurant } = useRestaurantBySlug(restaurantSlug || '');
  const { data: menuItems, isLoading } = useMenuItemsBySlug(restaurantSlug || '');
  const { data: categories } = useCategoriesBySlug(restaurantSlug || '');
  const createOrder = useCreateOrder();
  const { orders: recentOrders } = useRecentOrders(restaurant?.id, parseInt(tableNumber) || 1);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [arPreviewItem, setArPreviewItem] = useState<MenuItem | null>(null);
  const [arLaunchItem, setArLaunchItem] = useState<MenuItem | null>(null); // Direct AR camera launch
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<TrackedOrder | null>(null);
  const [showOrderTracker, setShowOrderTracker] = useState(true);
  
  // Check if device supports AR
  const arSupported = useARSupport();

  // Use demo menu if no items in database
  const displayItems = menuItems && menuItems.length > 0 ? menuItems : DEMO_MENU;
  
  // Filter items by category
  const filteredItems = selectedCategory 
    ? displayItems.filter(item => item.category_id === selectedCategory)
    : displayItems;

  // Group items by category for display
  const itemsByCategory = categories?.reduce((acc, cat) => {
    acc[cat.id] = displayItems.filter(item => item.category_id === cat.id);
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

  const uncategorizedItems = displayItems.filter(item => !item.category_id);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
    toast({
      title: 'Added to cart',
      description: `${item.name} added`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!restaurant) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Restaurant not found',
      });
      return;
    }

    try {
      await createOrder.mutateAsync({
        order: {
          restaurant_id: restaurant.id,
          table_number: parseInt(tableNumber) || 1,
          status: 'pending',
          total_amount: cartTotal,
          customer_notes: null,
        },
        items: cart.map(item => ({
          menu_item_id: item.id.startsWith('demo-') ? null as any : item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      });

      toast({
        title: 'Order placed!',
        description: 'Your order has been sent to the kitchen.',
      });

      setCart([]);
      setShowCart(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Order failed',
        description: 'Please try again',
      });
    }
  };

  // Direct AR launch - opens camera immediately on supported devices
  const launchAR = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (arSupported) {
      // Device supports AR - launch camera directly
      setArLaunchItem(item);
    } else {
      // Fallback to 3D preview modal
      setArPreviewItem(item);
    }
  };

  // Fallback when AR fails or isn't supported
  const handleARNotSupported = () => {
    if (arLaunchItem) {
      setArPreviewItem(arLaunchItem);
      setArLaunchItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-serif font-semibold capitalize">
                {restaurant?.name || restaurantSlug?.replace('-', ' ')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isExternalOrder ? 'Delivery Order' : `Table ${tableNumber}`}
              </p>
            </div>
          </div>
          
          {/* Order Status Button */}
          {recentOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTrackingOrder(recentOrders.find(o => o.status !== 'completed' && o.status !== 'cancelled') || null)}
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              Track Order
            </Button>
          )}
        </div>

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="flex-shrink-0"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex-shrink-0"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}
      </header>

      {/* Cover Image */}
      {restaurant?.cover_image_url && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={restaurant.cover_image_url} 
            alt={restaurant.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      {/* Menu Grid */}
      <main className="p-4 space-y-6">
        {selectedCategory === null ? (
          // Show all items grouped by category
          <>
            {categories?.map(cat => {
              const catItems = itemsByCategory[cat.id];
              if (!catItems || catItems.length === 0) return null;
              return (
                <section key={cat.id}>
                  <h2 className="text-xl font-serif font-bold mb-3">{cat.name}</h2>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {catItems.map((item) => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        onSelect={setSelectedItem}
                        onAddToCart={addToCart}
                        onOpenAR={launchAR}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            
            {uncategorizedItems.length > 0 && (
              <section>
                {categories && categories.length > 0 && (
                  <h2 className="text-xl font-serif font-bold mb-3">Other Items</h2>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {uncategorizedItems.map((item) => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      onSelect={setSelectedItem}
                      onAddToCart={addToCart}
                      onOpenAR={launchAR}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          // Show filtered items
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuItemCard 
                key={item.id} 
                item={item} 
                onSelect={setSelectedItem}
                onAddToCart={addToCart}
                onOpenAR={launchAR}
              />
            ))}
          </div>
        )}
      </main>

      {/* Order Tracker */}
      {showOrderTracker && recentOrders.length > 0 && cartCount === 0 && (
        <OrderTracker 
          orders={recentOrders} 
          onClose={() => setShowOrderTracker(false)} 
        />
      )}

      {/* Cart Button */}
      {cartCount > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-4 left-4 right-4 z-50">
          <Button variant="hero" className="w-full h-14 text-lg" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({cartCount}) · ${cartTotal.toFixed(2)}
          </Button>
        </motion.div>
      )}

      {/* Full Order Tracker Modal */}
      <AnimatePresence>
        {trackingOrder && (
          <FullOrderTracker 
            order={trackingOrder} 
            onClose={() => setTrackingOrder(null)} 
          />
        )}
      </AnimatePresence>

      {/* Direct AR Launch Modal */}
      <AnimatePresence>
        {arLaunchItem && arLaunchItem.model_url && (
          <ARLauncher
            modelSrc={arLaunchItem.model_url}
            itemName={arLaunchItem.name}
            onClose={() => setArLaunchItem(null)}
            onARNotSupported={handleARNotSupported}
          />
        )}
      </AnimatePresence>

      {/* AR Quick Preview Modal - Now with AR Launch Button */}
      <AnimatePresence>
        {arPreviewItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-background z-50 flex flex-col"
          >
            {/* AR Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-serif font-bold">{arPreviewItem.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {arSupported ? '3D Preview • AR Ready' : '3D Preview'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setArPreviewItem(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* AR Viewer */}
            <div className="flex-1 relative">
              <ARViewer 
                modelSrc={arPreviewItem.model_url!} 
                alt={arPreviewItem.name}
                className="w-full h-full"
                showControls={false}
                showARBadge={false}
                autoLaunchAR={false}
                onARStart={() => {
                  // AR session started successfully
                }}
              />
              
              {/* AR Instructions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
                <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 border border-border">
                  {/* AR Supported - Show Launch Button */}
                  {arSupported === true && (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">View in Your Space</p>
                          <p className="text-sm text-muted-foreground">Place this dish on your table</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground mb-4">
                        <div className="flex flex-col items-center gap-1">
                          <RotateCcw className="w-4 h-4" />
                          <span>Drag to rotate</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Pinch to zoom</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Move3D className="w-4 h-4" />
                          <span>Place on table</span>
                        </div>
                      </div>

                      <Button 
                        variant="hero" 
                        className="w-full mb-2"
                        onClick={() => {
                          setArLaunchItem(arPreviewItem);
                          setArPreviewItem(null);
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Launch AR Camera
                      </Button>
                    </>
                  )}

                  {/* AR Not Supported - Show Helpful Message */}
                  {arSupported === false && (
                    <>
                      <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-muted/50 border border-border">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Smartphone className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">AR Not Available</p>
                          <p className="text-xs text-muted-foreground">
                            To view in AR, open this page on a mobile device with ARCore (Android) or ARKit (iOS)
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground mb-4">
                        <div className="flex flex-col items-center gap-1">
                          <RotateCcw className="w-4 h-4" />
                          <span>Drag to rotate</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Pinch to zoom</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Still Checking AR Support */}
                  {arSupported === null && (
                    <div className="flex items-center justify-center gap-2 py-2 mb-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Checking AR support...</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setArPreviewItem(null);
                        setSelectedItem(arPreviewItem);
                      }}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => {
                        addToCart(arPreviewItem);
                        setArPreviewItem(null);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add ${Number(arPreviewItem.price).toFixed(2)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-background/95 z-50 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold">{selectedItem.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(null); setShowAR(false); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* AR Viewer or Image */}
              {selectedItem.model_url ? (
                <div className="mb-4">
                  {showAR ? (
                    <ARViewer 
                      modelSrc={selectedItem.model_url} 
                      alt={selectedItem.name}
                      className="h-80 rounded-2xl bg-card"
                    />
                  ) : (
                    <div className="relative">
                      <img 
                        src={selectedItem.image_url || ''} 
                        alt={selectedItem.name}
                        className="w-full h-64 object-cover rounded-2xl"
                      />
                      <Button 
                        variant="hero" 
                        className="absolute bottom-4 left-1/2 -translate-x-1/2"
                        onClick={() => setShowAR(true)}
                      >
                        <Move3D className="w-4 h-4 mr-2" />
                        View in 3D / AR
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <img 
                  src={selectedItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'} 
                  alt={selectedItem.name}
                  className="w-full h-64 object-cover rounded-2xl mb-4"
                />
              )}

              <p className="text-muted-foreground mb-4">{selectedItem.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">${Number(selectedItem.price).toFixed(2)}</span>
                <Button variant="hero" onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-background/95 z-50 p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold">Your Order</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-card rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button size="icon-sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button size="icon-sm" variant="outline" onClick={() => addToCart({ ...item, id: item.id } as any)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-bold ml-4 w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                {isExternalOrder ? (
                  <Button 
                    variant="hero" 
                    className="w-full h-14 text-lg"
                    onClick={() => {
                      const cartData = encodeURIComponent(JSON.stringify(cart));
                      navigate(`/r/${restaurantSlug}/checkout?cart=${cartData}`);
                    }}
                  >
                    <Truck className="w-5 h-5 mr-2" />
                    Checkout for Delivery
                  </Button>
                ) : (
                  <Button 
                    variant="hero" 
                    className="w-full h-14 text-lg"
                    onClick={handlePlaceOrder}
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Menu Item Card Component
function MenuItemCard({ 
  item, 
  onSelect, 
  onAddToCart,
  onOpenAR 
}: { 
  item: MenuItem; 
  onSelect: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  onOpenAR: (item: MenuItem, e: React.MouseEvent) => void;
}) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card variant="interactive" onClick={() => onSelect(item)}>
        <div className="relative aspect-square">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'} 
            alt={item.name} 
            className="w-full h-full object-cover rounded-t-2xl" 
          />
          {item.model_url && (
            <Button
              variant="hero"
              size="sm"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 gap-1.5 shadow-lg"
              onClick={(e) => onOpenAR(item, e)}
            >
              <Camera className="w-3.5 h-3.5" />
              View in 3D / AR
            </Button>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground truncate mb-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-primary font-bold">${Number(item.price).toFixed(2)}</span>
            <Button 
              size="icon-sm" 
              variant="default" 
              onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
