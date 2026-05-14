import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-[#0f1117] border border-white/[0.05] rounded-3xl p-6 transition-all duration-300 hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
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
  <h3 className={cn("text-xl font-bold leading-none tracking-tight text-white", className)} {...props}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className, ...props }) => (
  <p className={cn("text-sm text-muted-foreground font-medium", className)} {...props}>{children}</p>
);

export const CardContent: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn("pt-0", className)} {...props}>{children}</div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'premium';
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
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95',
    secondary: 'bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95',
    outline: 'border border-white/10 bg-transparent hover:bg-white/5 text-white transition-all active:scale-95',
    ghost: 'bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white transition-all',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95',
    premium: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 transition-all active:scale-95',
  };

  const sizes = {
    sm: 'h-8 px-4 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-13 px-10 text-base',
    icon: 'h-11 w-11 p-2.5',
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
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
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'ghost';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-white/10 text-white',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    ghost: 'bg-transparent text-muted-foreground border-transparent hover:text-white',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
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
        "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
};
