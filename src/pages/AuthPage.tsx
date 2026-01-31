import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, ArrowRight, Mail, Lock, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading, rolesLoading, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    restaurantName: '',
  });

  // Redirect if already logged in and roles are loaded
  useEffect(() => {
    if (user && !authLoading && !rolesLoading) {
      // Redirect based on role
      if (hasRole('super_admin')) {
        navigate('/admin');
      } else if (hasRole('restaurant_owner')) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, authLoading, rolesLoading, hasRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Login failed',
            description: error.message,
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Redirecting to your dashboard...',
          });
          // Navigation will be handled by useEffect when roles load
        }
      } else {
        const { error } = await signUp(
          formData.email, 
          formData.password, 
          formData.name,
          formData.restaurantName || undefined
        );
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Signup failed',
            description: error.message,
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to AR Menu!',
          });
          // Navigation will be handled by useEffect when roles load
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-2xl font-semibold">
            <span className="text-gradient">AR</span>
            <span className="text-foreground">Menu</span>
          </span>
        </Link>

        <Card variant="glass" className="backdrop-blur-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Start your 14-day free trial today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        variant="premium"
                        placeholder="John Doe"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Restaurant Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        variant="premium"
                        placeholder="The Golden Fork"
                        className="pl-10"
                        value={formData.restaurantName}
                        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    variant="premium"
                    placeholder="you@restaurant.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    variant="premium"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Link 
                  to={mode === 'login' ? '/signup' : '/login'} 
                  className="text-primary hover:underline font-medium"
                >
                  {mode === 'login' ? 'Sign up free' : 'Sign in'}
                </Link>
              </p>
            </div>

            {mode === 'signup' && (
              <p className="mt-4 text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
