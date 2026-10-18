import React from 'react';
import { playSound } from '../utils/soundEffects';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  statusColor = 'teal',
  onClick,
  active = false,
  badgeText
}) {
  const colorThemes = {
    teal: {
      border: 'hover:border-teal-500/50 dark:hover:border-teal-400/50',
      iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      activeRing: 'ring-2 ring-teal-500/60 bg-teal-50/40 dark:bg-teal-950/30',
      glow: 'shadow-teal-500/10'
    },
    emerald: {
      border: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      activeRing: 'ring-2 ring-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/30',
      glow: 'shadow-emerald-500/10'
    },
    rose: {
      border: 'hover:border-rose-500/50 dark:hover:border-rose-400/50',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      activeRing: 'ring-2 ring-rose-500/60 bg-rose-50/40 dark:bg-rose-950/30',
      glow: 'shadow-rose-500/10'
    },
    amber: {
      border: 'hover:border-amber-500/50 dark:hover:border-amber-400/50',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      activeRing: 'ring-2 ring-amber-500/60 bg-amber-50/40 dark:bg-amber-950/30',
      glow: 'shadow-amber-500/10'
    },
    indigo: {
      border: 'hover:border-indigo-500/50 dark:hover:border-indigo-400/50',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      activeRing: 'ring-2 ring-indigo-500/60 bg-indigo-50/40 dark:bg-indigo-950/30',
      glow: 'shadow-indigo-500/10'
    }
  };

  const theme = colorThemes[statusColor] || colorThemes.teal;

  const handleClick = () => {
    if (onClick) {
      playSound('click');
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`glass-card relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 select-none ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${active ? theme.activeRing : ''} ${theme.border} bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md ${theme.glow}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border transition-transform duration-200 group-hover:scale-110 ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </span>
        {badgeText && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
          {subtitle}
        </p>
      )}

      {onClick && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
          <span>Filter Records</span>
          <span>&rarr;</span>
        </div>
      )}
    </div>
  );
}
