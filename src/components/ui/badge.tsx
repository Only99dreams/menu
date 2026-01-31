import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Status variants
        pending: "bg-warning/20 text-warning border-warning/30",
        preparing: "bg-primary/20 text-primary border-primary/30",
        delivered: "bg-success/20 text-success border-success/30",
        cancelled: "bg-destructive/20 text-destructive border-destructive/30",
        // Premium variants
        ar: "bg-primary/20 text-primary border-primary/30",
        premium: "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30",
        glass: "bg-card/60 backdrop-blur-xl border-foreground/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
