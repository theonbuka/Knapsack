import React, { useId } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  colorBg?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isDark = true,
  colorBg = 'bg-indigo-600',
  className,
  ariaLabel,
  ...props
}) => {
  const baseStyles = 'font-black uppercase tracking-widest transition-all rounded-xl border outline-none';

  const variants = {
    primary: `${colorBg} text-white border-transparent hover:opacity-90`,
    secondary: `${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} hover:opacity-80`,
    ghost: `border-transparent ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`,
    danger: `border-rose-500/20 text-rose-400 hover:text-rose-500`,
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      aria-label={ariaLabel}
      {...props}
    />
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDark?: boolean;
  children: React.ReactNode;
  role?: string;
}

export const Card: React.FC<CardProps> = ({ isDark = true, className, children, role, ...props }) => {
  const baseStyles = isDark
    ? 'bg-white/[0.035] border-white/[0.08] backdrop-blur-xl border rounded-[2.5rem]'
    : 'bg-white border-slate-200 shadow-lg border rounded-[2.5rem]';

  return (
    <div 
      className={`${baseStyles} ${className || ''}`} 
      role={role}
      {...props}
    >
      {children}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isDark?: boolean;
  label?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const Input: React.FC<InputProps> = ({ 
  isDark = true, 
  label, 
  className, 
  id,
  ariaLabel,
  ariaDescribedBy,
  ...props 
}) => {
  const baseStyles = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/40'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400';
  
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div>
      {label && <label htmlFor={inputId} className="text-sm font-semibold mb-2 block">{label}</label>}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${baseStyles} ${className || ''}`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      />
    </div>
  );
};

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  isDark?: boolean;
  ariaLabel?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  isDark = true, 
  children,
  ariaLabel 
}) => {
  const variants = {
    default: isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700',
    success: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    warning: isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700',
    danger: isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-50 text-rose-700',
  };

  return (
    <span 
      className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black ${variants[variant]}`}
      role="status"
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  isDark?: boolean;
  ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  isDark = true,
  ariaLabel 
}) => {
  const baseId = useId();
  const titleId = title ? `${baseId}-title` : undefined;
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <Card 
        isDark={isDark} 
        className="max-w-md w-full max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel || title}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 id={titleId} className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>}
        {children}
      </Card>
    </div>
  );
};
