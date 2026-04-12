import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = true,
  onClick,
}) => {
  return (
    <div 
      className={`command-card relative group ${className}`}
      onClick={onClick}
    >
      {/* Decorative HUD Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/40 group-hover:border-primary transition-colors z-20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary/40 group-hover:border-primary transition-colors z-20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary/40 group-hover:border-primary transition-colors z-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/40 group-hover:border-primary transition-colors z-20" />
      
      <div className={`relative z-10 ${hoverable ? 'hover:bg-primary/5 transition-colors' : ''}`}>
        {children}
      </div>
    </div>
  );
};

