import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SidebarNav } from './Navbar';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'superadmin' | 'restaurant';
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  role,
  title,
  subtitle,
  headerActions,
  className,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarNav role={role} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <MobileNav role={role} />
              <div className="min-w-0">
                <h1 className="text-lg font-serif font-bold truncate">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex-1 p-4 lg:p-8", className)}
        >
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-4">
                {headerActions}
              </div>
            )}
          </div>

          {children}
        </motion.div>
      </main>
    </div>
  );
}
