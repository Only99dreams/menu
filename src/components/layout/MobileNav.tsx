import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { 
  Menu, 
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
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MobileNavProps {
  role: 'superadmin' | 'restaurant';
}

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setOpen(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle asChild>
              <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-serif text-xl font-semibold">
                  <span className="text-primary">AR</span>Menu
                </span>
              </Link>
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Close menu</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
