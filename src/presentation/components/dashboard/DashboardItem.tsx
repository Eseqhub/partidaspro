import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { LucideIcon } from 'lucide-react';

interface DashboardItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'accent' | 'warning' | 'info';
  onClick?: () => void;
}

const colorMap = {
  primary: 'bg-primary/20 text-primary border-primary/30',
  secondary: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  accent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export const DashboardItem: React.FC<DashboardItemProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  color,
  onClick 
}) => {
  return (
    <GlassCard 
      className="p-6 cursor-pointer hover:scale-[1.02] transition-all group border-b-4 border-b-transparent hover:border-b-white/20" 
      onClick={onClick}
    >
      <div className="flex items-start gap-6">
        <div className={`p-4 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${colorMap[color]}`}>
          <Icon size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-white/50 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="self-center">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon size={16} className="text-white/40" />
            </div>
        </div>
      </div>
    </GlassCard>
  );
};
