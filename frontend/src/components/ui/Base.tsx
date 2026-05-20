import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-[#0d0d0d] border border-white/[0.05] rounded-[2.5rem] p-8 transition-all duration-300 hover:border-white/10 shadow-2xl shadow-black",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn("flex flex-col space-y-2 mb-8", className)} {...props}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className, ...props }) => (
  <h3 className={cn("text-xl font-black leading-none tracking-tight text-white italic uppercase", className)} {...props}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className, ...props }) => (
  <p className={cn("text-[11px] text-muted-foreground font-bold uppercase tracking-widest", className)} {...props}>{children}</p>
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
    primary: 'bg-[#10b981] text-white hover:bg-[#059669] shadow-lg shadow-[#10b981]/20 transition-all active:scale-95',
    secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all active:scale-95',
    outline: 'border border-white/10 bg-transparent hover:bg-white/5 text-white transition-all active:scale-95',
    ghost: 'bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white transition-all',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95',
    premium: 'bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white hover:opacity-90 shadow-xl shadow-[#10b981]/20 transition-all active:scale-95',
  };

  const sizes = {
    sm: 'h-9 px-4 text-[10px] uppercase tracking-widest',
    md: 'h-12 px-8 text-sm',
    lg: 'h-14 px-10 text-base',
    icon: 'h-11 w-11 p-2.5',
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-[1.25rem] font-black transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
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
    default: 'bg-white/5 text-white border-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    primary: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
    ghost: 'bg-transparent text-muted-foreground border-transparent hover:text-white',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-colors focus:outline-none",
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
        "flex h-12 w-full rounded-2xl border border-white/[0.05] bg-[#0d0d0d] px-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      {...props}
    />
  );
};
