import { cn } from '@/lib/utils';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-accent/10 text-accent',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
  info: 'bg-blue-50 text-blue-700',
};

export function Badge({ variant = 'neutral', children, className, size = 'md' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: 'FREE' | 'PRO' | 'EXPERT' }) {
  const config = {
    FREE: { variant: 'neutral' as BadgeVariant, label: 'Gratuit' },
    PRO: { variant: 'primary' as BadgeVariant, label: 'Pro' },
    EXPERT: { variant: 'success' as BadgeVariant, label: 'Expert' },
  };
  const { variant, label } = config[plan];
  return <Badge variant={variant}>{label}</Badge>;
}
