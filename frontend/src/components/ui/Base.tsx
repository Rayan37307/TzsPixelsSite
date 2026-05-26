import React from 'react';
import { cn } from '../../utils/cn';

/* Hallmark · component: Card · genre: modern-minimal · theme: Brutal
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl transition-all",
        "hover:border-[var(--color-border-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn("flex flex-col space-y-2 mb-6", className)} {...props}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className, ...props }) => (
  <h3 className={cn("text-xl font-black leading-none tracking-tight text-foreground", className)} {...props}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className, ...props }) => (
  <p className={cn("font-mono text-sm text-muted-foreground", className)} {...props}>{children}</p>
);

export const CardContent: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn("pt-0", className)} {...props}>{children}</div>
);

/* Hallmark · component: Button · genre: modern-minimal · theme: Brutal
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    primary:
      'bg-primary text-primary-foreground ' +
      'hover:bg-[var(--color-accent-dim)] ' +
      'focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] ' +
      'active:translate-y-px ' +
      'disabled:opacity-30 disabled:pointer-events-none ' +
      'data-[state=loading]:bg-[var(--color-accent-dim)] data-[state=loading]:cursor-wait ' +
      'data-[state=error]:bg-[var(--color-danger)] ' +
      'data-[state=success]:bg-[var(--color-success)]',
    secondary:
      'bg-transparent border-2 border-border text-foreground ' +
      'hover:border-[var(--color-border-active)] hover:bg-[var(--color-paper-3)] ' +
      'focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] ' +
      'active:translate-y-px ' +
      'disabled:opacity-30 disabled:pointer-events-none ' +
      'data-[state=loading]:opacity-50 data-[state=loading]:cursor-wait ' +
      'data-[state=error]:border-[var(--color-danger)] data-[state=error]:text-[var(--color-danger)] ' +
      'data-[state=success]:border-[var(--color-success)] data-[state=success]:text-[var(--color-success)]',
    outline:
      'bg-transparent border border-border text-foreground ' +
      'hover:bg-[var(--color-paper-3)] hover:border-[var(--color-border-hover)] ' +
      'focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] ' +
      'active:translate-y-px ' +
      'disabled:opacity-30 disabled:pointer-events-none',
    ghost:
      'bg-transparent text-muted-foreground ' +
      'hover:bg-[var(--color-paper-3)] hover:text-foreground ' +
      'focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] ' +
      'active:translate-y-px ' +
      'disabled:opacity-30 disabled:pointer-events-none',
    danger:
      'bg-transparent border-2 border-[var(--color-danger-dim)] text-[var(--color-danger)] ' +
      'hover:bg-[var(--color-danger)] hover:text-white hover:border-[var(--color-danger)] ' +
      'focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] ' +
      'active:translate-y-px ' +
      'disabled:opacity-30 disabled:pointer-events-none',
  };

  const sizes = {
    sm: 'h-9 px-4 text-xs font-bold',
    md: 'h-12 px-6 text-sm font-bold',
    lg: 'h-14 px-8 text-base font-bold',
    icon: 'h-11 w-11 p-2.5',
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-bold transition-all",
        "focus-visible:outline-none",
        "duration-150",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-[var(--color-paper-3)] text-muted-foreground border-border',
    success: 'bg-transparent text-[var(--color-success)] border-[var(--color-success)]',
    warning: 'bg-transparent text-[var(--color-warning)] border-[var(--color-warning)]',
    danger: 'bg-transparent text-[var(--color-danger)] border-[var(--color-danger)]',
    info: 'bg-transparent text-[var(--color-focus)] border-[var(--color-focus)]',
    primary: 'bg-transparent text-[var(--color-accent)] border-[var(--color-accent)]',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-bold uppercase leading-none transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-lg border-2 border-border bg-[var(--color-paper)] px-4 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "hover:border-[var(--color-border-hover)]",
        "focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-paper)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all duration-150",
        className
      )}
      {...props}
    />
  );
};
