import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#1E293B] mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full border rounded-btn px-4 py-3 text-sm text-[#1E293B]',
              'bg-white placeholder:text-[#94A3B8]',
              'transition-all duration-250 ease-smooth',
              'focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15',
              error
                ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-[#64748B]">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#1E293B] mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border rounded-btn px-4 py-3 text-sm text-[#1E293B] resize-none',
            'bg-white placeholder:text-[#94A3B8]',
            'transition-all duration-250 ease-smooth',
            'focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
