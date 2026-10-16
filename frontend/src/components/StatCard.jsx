import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, statusColor = 'teal' }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    slate: 'bg-slate-50 text-slate-800 border-slate-200',
  };

  const badgeClass = colorMap[statusColor] || colorMap.teal;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${badgeClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}
