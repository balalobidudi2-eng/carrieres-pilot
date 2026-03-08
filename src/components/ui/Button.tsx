import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-brand text-white shadow-sm hover:opacity-90 hover:-translate-y-px focus-visible:ring-accent',
  secondary:
    'bg-accent/10 text-accent hover:bg-accent/20 focus-visible:ring-accent',
  outline:
    'border border-[#E2E8F0] bg-white text-[#1E293B] hover:border-accent hover:text-accent focus-visible:ring-accent',
  ghost:
    'bg-transparent text-[#64748B] hover:bg-gray-100 hover:text-[#1E293B] focus-visible:ring-gray-300',
  danger:
    'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus-visible:ring-red-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-btn',
          'transition-all duration-250 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 16} />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
