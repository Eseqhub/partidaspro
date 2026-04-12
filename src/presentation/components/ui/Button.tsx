import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary';
  
  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };
  
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:brightness-110 shadow-lg shadow-secondary/20',
    glass: 'glass hover:bg-white/10 text-white backdrop-blur-md',
    outline: 'border-2 border-primary/50 text-primary hover:bg-primary/5 hover:border-primary',
  };
  
  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
