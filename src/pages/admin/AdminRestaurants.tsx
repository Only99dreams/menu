import { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarNav } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone
} from 'lucide-react';

const mockRestaurants = [
  { 
    id: 1,
    name: 'The Golden Fork', 
    slug: 'golden-fork',
    email: 'contact@goldenfork.com',
    phone: '+1 234 567 890',
    plan: 'Professional', 
    status: 'active', 
    orders: 234,
    tables: 12,
    menuItems: 45
  },
  { 
    id: 2,
    name: 'Sakura Sushi', 
    slug: 'sakura-sushi',
    email: 'hello@sakurasushi.com',
    phone: '+1 234 567 891',
    plan: 'Starter', 
    status: 'active', 
    orders: 156,
    tables: 8,
    menuItems: 32
  },
  { 
    id: 3,
    name: 'Bella Italia', 
    slug: 'bella-italia',
    email: 'info@bellaitalia.com',
    phone: '+1 234 567 892',
    plan: 'Professional', 
    status: 'trial', 
    orders: 89,
    tables: 15,
    menuItems: 56
  },
  { 
    id: 4,
    name: 'The Spice Route', 
    slug: 'spice-route',
    email: 'contact@spiceroute.com',
    phone: '+1 234 567 893',
    plan: 'Enterprise', 
    status: 'active', 
    orders: 412,
    tables: 25,
    menuItems: 78
  },
];

export default function AdminRestaurants() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRestaurants = mockRestaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="superadmin" />
      
      <main className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold">Restaurants</h1>
              <p className="text-muted-foreground">Manage all registered restaurants</p>
            </div>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              variant="premium"
              placeholder="Search restaurants..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Restaurants Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="interactive">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>/{restaurant.slug}</span>
                          <Badge 
                            variant={
                              restaurant.status === 'active' ? 'delivered' : 
                              restaurant.status === 'trial' ? 'preparing' : 'cancelled'
                            }
                          >
                            {restaurant.status}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="glass">{restaurant.plan}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                      <div className="text-center">
                        <p className="text-2xl font-serif font-bold">{restaurant.tables}</p>
                        <p className="text-xs text-muted-foreground">Tables</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-serif font-bold">{restaurant.menuItems}</p>
                        <p className="text-xs text-muted-foreground">Menu Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-serif font-bold">{restaurant.orders}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {restaurant.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {restaurant.phone}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
