import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, 
  X, 
  ChefHat, 
  LayoutDashboard,
  Building2,
  UtensilsCrossed,
  Settings,
  LogOut,
  FolderOpen,
  History,
  QrCode,
  Package,
  Users,
  Truck,
  ShoppingCart,
  User
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  variant?: 'landing' | 'dashboard';
  userRole?: 'superadmin' | 'restaurant' | 'customer';
}

export function Navbar({ variant = 'landing', userRole }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const getDashboardLink = () => {
    if (hasRole('super_admin')) return '/admin';
    if (hasRole('restaurant_owner')) return '/dashboard';
    return null;
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const landingLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#demo', label: 'Demo' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
      
      <nav className="relative container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
            <ChefHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold">
            <span className="text-gradient">AR</span>
            <span className="text-foreground">Menu</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        {variant === 'landing' && (
          <div className="hidden md:flex items-center gap-1">
            {landingLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link",
                  location.pathname + location.hash === link.href && "nav-link-active"
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {variant === 'landing' ? (
            !loading && user ? (
              // User is logged in
              <>
                {getDashboardLink() && (
                  <Button variant="outline" asChild>
                    <Link to={getDashboardLink()!}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              // User is not logged in
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="ghost" size="icon-sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-16 inset-x-0 bg-card/95 backdrop-blur-xl border-b border-border"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {variant === 'landing' &&
              landingLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              {!loading && user ? (
                <>
                  {getDashboardLink() && (
                    <Button variant="outline" className="justify-start" asChild onClick={() => setIsOpen(false)}>
                      <Link to={getDashboardLink()!}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="justify-start text-destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" asChild onClick={() => setIsOpen(false)}>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button variant="hero" asChild onClick={() => setIsOpen(false)}>
                    <Link to="/signup">Get Started Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}

interface SidebarNavProps {
  role: 'superadmin' | 'restaurant';
}

export function SidebarNav({ role }: SidebarNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const superAdminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/restaurants', label: 'Restaurants', icon: Building2 },
    { href: '/admin/menu-items', label: 'Menu Items', icon: UtensilsCrossed },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const restaurantLinks = [
    { href: '/dashboard', label: 'Live Orders', icon: LayoutDashboard },
    { href: '/dashboard/menu', label: 'Menu Items', icon: UtensilsCrossed },
    { href: '/dashboard/categories', label: 'Categories', icon: FolderOpen },
    { href: '/dashboard/history', label: 'Order History', icon: History },
    { href: '/dashboard/qr-codes', label: 'QR Codes', icon: QrCode },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { href: '/dashboard/suppliers', label: 'Suppliers', icon: Truck },
    { href: '/dashboard/staff', label: 'Staff', icon: Users },
    { href: '/dashboard/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const links = role === 'superadmin' ? superAdminLinks : restaurantLinks;

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-serif text-xl font-semibold text-sidebar-foreground">
          <span className="text-primary">AR</span>Menu
        </span>
      </Link>

      <nav className="space-y-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
