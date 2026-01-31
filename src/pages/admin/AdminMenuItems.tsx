import { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarNav } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  UtensilsCrossed, 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Move3D,
  DollarSign,
  Image
} from 'lucide-react';

const mockMenuItems = [
  { 
    id: 1,
    name: 'Wagyu Steak', 
    category: 'Main Course',
    price: 89.99,
    restaurant: 'The Golden Fork',
    hasModel: true,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop'
  },
  { 
    id: 2,
    name: 'Dragon Roll', 
    category: 'Sushi',
    price: 24.99,
    restaurant: 'Sakura Sushi',
    hasModel: true,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop'
  },
  { 
    id: 3,
    name: 'Margherita Pizza', 
    category: 'Pizza',
    price: 18.99,
    restaurant: 'Bella Italia',
    hasModel: false,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop'
  },
  { 
    id: 4,
    name: 'Butter Chicken', 
    category: 'Curry',
    price: 22.99,
    restaurant: 'The Spice Route',
    hasModel: true,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop'
  },
  { 
    id: 5,
    name: 'Tiramisu', 
    category: 'Dessert',
    price: 12.99,
    restaurant: 'Bella Italia',
    hasModel: true,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop'
  },
  { 
    id: 6,
    name: 'Caesar Salad', 
    category: 'Salad',
    price: 14.99,
    restaurant: 'The Golden Fork',
    hasModel: false,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop'
  },
];

export default function AdminMenuItems() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = mockMenuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
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
              <h1 className="text-3xl font-serif font-bold">Menu Items</h1>
              <p className="text-muted-foreground">Manage food items and 3D models</p>
            </div>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                variant="premium"
                placeholder="Search menu items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">All Categories</Button>
            <Button variant="outline">All Restaurants</Button>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="interactive" className="overflow-hidden">
                  <div className="relative aspect-video">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {item.hasModel && (
                        <Badge variant="ar">
                          <Move3D className="w-3 h-3 mr-1" />
                          3D
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="glass">{item.category}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.restaurant}</p>
                      </div>
                      <p className="text-xl font-serif font-bold text-primary">
                        ${item.price}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
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
