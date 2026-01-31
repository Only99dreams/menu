import { useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRestaurantBySlug } from '@/hooks/useRestaurants';
import { useCreateOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChefHat, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CreditCard,
  Upload,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Copy,
  Image as ImageIcon
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ExternalCheckout() {
  const { restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(restaurantSlug || '');
  const createOrder = useCreateOrder();
  
  // Get cart from URL params
  const cartParam = searchParams.get('cart');
  const cart: CartItem[] = cartParam ? JSON.parse(decodeURIComponent(cartParam)) : [];
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    notes: '',
    paymentProofUrl: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${restaurant?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, paymentProofUrl: urlData.publicUrl }));
      toast({ title: 'Payment proof uploaded successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again' });
    } finally {
      setUploading(false);
    }
  };

  const validateDetails = () => {
    if (!formData.customerName.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return false;
    }
    if (!formData.customerPhone.trim()) {
      toast({ variant: 'destructive', title: 'Phone number is required' });
      return false;
    }
    if (!formData.deliveryAddress.trim()) {
      toast({ variant: 'destructive', title: 'Delivery address is required' });
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateDetails()) {
      setStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    if (!formData.paymentProofUrl) {
      toast({ variant: 'destructive', title: 'Please upload payment proof' });
      return;
    }
    
    if (!restaurant) return;
    
    try {
      await createOrder.mutateAsync({
        order: {
          restaurant_id: restaurant.id,
          table_number: 0, // External order
          status: 'pending',
          total_amount: cartTotal,
          customer_notes: formData.notes || null,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail || null,
          delivery_address: formData.deliveryAddress,
          payment_proof_url: formData.paymentProofUrl,
          order_type: 'delivery',
        } as any,
        items: cart.map(item => ({
          menu_item_id: item.id.startsWith('demo-') ? null as any : item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      });
      
      setStep('success');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Order failed', description: 'Please try again' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={() => navigate(`/r/${restaurantSlug}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-serif font-semibold">{restaurant?.name}</h1>
            <p className="text-sm text-muted-foreground">Delivery Checkout</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
          }`}>1</div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'payment' ? 'bg-primary text-primary-foreground' : 
            step === 'success' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          }`}>2</div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'success' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        {step === 'details' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Order Summary */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">${cartTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+234 xxx xxx xxxx"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email (Optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address *
                  </label>
                  <Textarea
                    placeholder="Enter your full delivery address..."
                    value={formData.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Instructions (Optional)</label>
                  <Textarea
                    placeholder="Any special requests or instructions..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Button variant="hero" className="w-full h-14 text-lg" onClick={handleContinueToPayment}>
              Continue to Payment
            </Button>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Bank Details */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  Bank Transfer Details
                </CardTitle>
                <CardDescription>
                  Transfer ${cartTotal.toFixed(2)} to the account below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(restaurant as any)?.bank_name ? (
                  <>
                    <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Bank Name</span>
                        <span className="font-medium">{(restaurant as any).bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Name</span>
                        <span className="font-medium">{(restaurant as any).bank_account_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">{(restaurant as any).bank_account_number}</span>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => copyToClipboard((restaurant as any).bank_account_number || '')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-4 text-center">
                      <p className="font-bold text-xl text-primary">${cartTotal.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Amount to transfer</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Bank details not configured</p>
                    <p className="text-sm">Please contact the restaurant</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Payment Proof */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5" />
                  Upload Payment Proof
                </CardTitle>
                <CardDescription>
                  Upload a screenshot or photo of your transfer confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProofUpload}
                  className="hidden"
                />
                
                {formData.paymentProofUrl ? (
                  <div className="relative">
                    <img 
                      src={formData.paymentProofUrl} 
                      alt="Payment proof" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <Button 
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Tap to upload payment proof</p>
                        <p className="text-sm text-muted-foreground">JPG, PNG or screenshot</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button 
                variant="hero" 
                className="flex-1 h-14"
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending || !formData.paymentProofUrl}
              >
                {createOrder.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Complete Order'
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-6">
              Your order has been received. We'll contact you at {formData.customerPhone} to confirm delivery.
            </p>
            <Button onClick={() => navigate(`/r/${restaurantSlug}`)}>
              Return to Menu
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
