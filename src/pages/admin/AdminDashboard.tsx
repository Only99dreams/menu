import { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarNav } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const stats = [
  { 
    title: 'Total Restaurants', 
    value: '47', 
    change: '+12%', 
    trend: 'up',
    icon: Building2 
  },
  { 
    title: 'Monthly Revenue', 
    value: '$12,450', 
    change: '+23%', 
    trend: 'up',
    icon: DollarSign 
  },
  { 
    title: 'Active Users', 
    value: '2,847', 
    change: '+18%', 
    trend: 'up',
    icon: Users 
  },
  { 
    title: 'Total Orders', 
    value: '15,283', 
    change: '+31%', 
    trend: 'up',
    icon: ShoppingCart 
  },
];

const recentRestaurants = [
  { name: 'The Golden Fork', plan: 'Professional', status: 'active', orders: 234 },
  { name: 'Sakura Sushi', plan: 'Starter', status: 'active', orders: 156 },
  { name: 'Bella Italia', plan: 'Professional', status: 'trial', orders: 89 },
  { name: 'The Spice Route', plan: 'Enterprise', status: 'active', orders: 412 },
  { name: 'Green Garden', plan: 'Starter', status: 'expired', orders: 23 },
];

export default function AdminDashboard() {
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
          <div>
            <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Super Admin</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <Badge 
                        variant={stat.trend === 'up' ? 'delivered' : 'cancelled'}
                        className="gap-1"
                      >
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {stat.change}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-3xl font-serif font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent Restaurants */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Restaurants</CardTitle>
                <CardDescription>Latest restaurant signups and activity</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRestaurants.map((restaurant, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.plan} Plan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{restaurant.orders}</p>
                        <p className="text-sm text-muted-foreground">orders</p>
                      </div>
                      <Badge 
                        variant={
                          restaurant.status === 'active' ? 'delivered' : 
                          restaurant.status === 'trial' ? 'preparing' : 'cancelled'
                        }
                      >
                        {restaurant.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
