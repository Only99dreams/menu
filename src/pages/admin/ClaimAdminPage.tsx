import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ClaimSuperAdmin } from '@/components/admin/ClaimSuperAdmin';
import { ChefHat, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClaimAdminPage() {
  const navigate = useNavigate();
  const { user, loading, hasRole } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (hasRole('super_admin')) {
        navigate('/admin');
      }
    }
  }, [user, loading, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 space-y-8"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-2xl font-semibold">
            <span className="text-gradient">AR</span>
            <span className="text-foreground">Menu</span>
          </span>
        </Link>

        <ClaimSuperAdmin />
      </motion.div>
    </div>
  );
}
