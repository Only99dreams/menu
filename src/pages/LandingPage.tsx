import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { 
  ChefHat, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  Globe, 
  Zap, 
  Shield, 
  TrendingUp,
  Check,
  ArrowRight,
  Play,
  Move3D,
  Wifi,
  CreditCard
} from 'lucide-react';
import heroImage from '@/assets/hero-restaurant.jpg';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const features = [
  {
    icon: Move3D,
    title: "True AR Experience",
    description: "Customers see dishes in real 3D on their table. Rotate, scale, and walk around food before ordering."
  },
  {
    icon: QrCode,
    title: "Smart QR Codes",
    description: "Restaurant & table-specific codes. Auto-detect table numbers. No app download required."
  },
  {
    icon: Wifi,
    title: "Offline-First PWA",
    description: "Works without internet after first load. Menu, 3D models, and cart cached locally."
  },
  {
    icon: Zap,
    title: "Real-Time Orders",
    description: "Kitchen sees orders instantly. Live status updates. No missed orders, no delays."
  },
  {
    icon: Shield,
    title: "Multi-Tenant Security",
    description: "Complete data isolation. Each restaurant has its own secure space. Enterprise-grade protection."
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "iOS & Android browsers. No app stores. No downloads. Just scan and experience."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small restaurants",
    features: [
      "Up to 50 menu items",
      "5 tables with QR codes",
      "Basic AR previews",
      "Email support",
      "Basic analytics"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing restaurants",
    features: [
      "Unlimited menu items",
      "Unlimited tables",
      "Premium AR with shadows",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "Offline mode"
    ],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For restaurant chains",
    features: [
      "Everything in Professional",
      "Multiple locations",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-label option"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar variant="landing" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Fine dining" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="premium" className="mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                Introducing WebAR for Restaurants
              </Badge>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 leading-tight"
            >
              <span className="text-foreground">See Food in </span>
              <span className="text-gradient">Augmented Reality</span>
              <span className="text-foreground"> Before Ordering</span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Transform your restaurant menu with stunning 3D AR previews. 
              Customers scan, explore dishes in AR, and order — all from their browser.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <a href="#demo">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </a>
              </Button>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                No app download
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Works offline
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                14-day free trial
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div 
          className="absolute bottom-20 left-10 w-20 h-20 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30 hidden lg:flex items-center justify-center"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Move3D className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.div 
          className="absolute top-40 right-20 w-16 h-16 rounded-xl bg-accent/20 backdrop-blur-sm border border-accent/30 hidden lg:flex items-center justify-center"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <QrCode className="w-8 h-8 text-accent" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="ar" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Everything You Need to <span className="text-gradient">Modernize</span> Your Menu
            </h2>
            <p className="text-xl text-muted-foreground">
              From stunning AR previews to real-time order management, 
              we've built everything a modern restaurant needs.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card variant="interactive" className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="ar" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Three Steps to <span className="text-gradient">AR Magic</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Scan QR Code", desc: "Customers scan the table QR code with any smartphone camera" },
              { step: "02", title: "Explore in AR", desc: "Browse menu items and preview dishes in stunning 3D AR" },
              { step: "03", title: "Order & Enjoy", desc: "Add to cart, place order, and your kitchen gets it instantly" }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="text-7xl font-serif font-bold text-gradient mb-4">{item.step}</div>
                <h3 className="text-2xl font-serif font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="ar" className="mb-4">
              <CreditCard className="w-3 h-3 mr-1" />
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Simple, <span className="text-gradient">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, scale as you grow. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  variant={plan.popular ? "premium" : "glass"} 
                  className={`h-full relative ${plan.popular ? 'scale-105 z-10' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="shadow-glow">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-5xl font-serif font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant={plan.popular ? "hero" : "outline"} 
                      className="w-full"
                      asChild
                    >
                      <Link to="/signup">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Ready to Transform Your <span className="text-gradient">Restaurant?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of restaurants already using AR Menu. 
              Start your 14-day free trial today.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif font-semibold">ARMenu</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ARMenu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
