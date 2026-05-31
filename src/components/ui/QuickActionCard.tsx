import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, icon: Icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={cn(
      'relative group overflow-hidden p-6 rounded-lg border transition-all duration-300 hover:shadow-sm text-left',
      color === 'bg-slate-900'
        ? 'bg-white border-slate-900 hover:shadow-slate-900/5'
        : color === 'bg-emerald-600'
          ? 'bg-white border-emerald-500 hover:shadow-emerald-500/30'
          : 'bg-white border-slate-700 hover:shadow-slate-900/30'
    )}
  >
    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
    <div className="relative z-10 flex flex-col h-full">
      <div className="p-3 bg-white/20 rounded-xl w-fit mb-4 backdrop-blur-md  group-hover:-rotate-3 transition-transform shadow-sm border border-white/10">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="mt-auto relative z-10">
        <h3 className="text-white font-bold tracking-tight text-lg mb-1 group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-white/70 text-xs font-medium leading-relaxed group-hover:translate-x-1 transition-transform delay-75">{description}</p>
      </div>
    </div>
    <div className="absolute -top-8 -right-8 p-4 opacity-[0.08] group-hover:opacity-[0.15] group-hover:rotate-12 transition-all transform scale-150 duration-500 pointer-events-none">
      <Icon className="w-32 h-32 text-white" />
    </div>
  </button>
);
