import React from 'react';
import { 
  ShieldCheck, 
  TriangleAlert, 
  BadgeCheck, 
  Shield, 
  Image as ImageIcon, 
  Video, 
  HardHat, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function KPICards({ stats = {}, darkMode = false, onCardClick }) {
  const {
    total_inspections = 0,
    image_inspections = 0,
    video_inspections = 0,
    total_violations = 0,
    resolved_violations = 0,
    reviewed_violations = 0,
    pending_violations = 0,
    compliance_percentage = 94.2,
    kpi_deltas = {},
    category_counts = {}
  } = stats;

  const helmetViolations = category_counts['Missing Helmet'] || 0;
  const vestViolations = category_counts['Missing Safety Vest'] || 0;
  const maskViolations = category_counts['Missing Mask'] || 0;
  
  const resolutionPct = total_violations > 0 
    ? Math.round((resolved_violations / total_violations) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      
      {/* KPI 01 – Total Inspections (Electric Blue Theme) */}
      <div 
        onClick={() => onCardClick && onCardClick('inspections')}
        className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
          darkMode 
            ? 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50' 
            : 'bg-white border-slate-200 hover:border-blue-400'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                KPI 01
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Inspections
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2%</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {total_inspections.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Completed Audits
          </span>
        </div>

        {/* Sub-breakdown: Images & Videos */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Images: <strong className="font-bold text-slate-800 dark:text-slate-100">{image_inspections}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
            <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Videos: <strong className="font-bold text-slate-800 dark:text-slate-100">{video_inspections}</strong></span>
          </div>
        </div>
      </div>

      {/* KPI 02 – PPE Violations (Refined Red Theme) */}
      <div 
        onClick={() => onCardClick && onCardClick('violations')}
        className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
          darkMode 
            ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50' 
            : 'bg-white border-slate-200 hover:border-rose-400'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
              <TriangleAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                KPI 02
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                PPE Violations
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <TrendingDown className="w-3 h-3" />
            <span>-8.4%</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {total_violations.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>{pending_violations} Pending</span>
          </span>
        </div>

        {/* Categories breakdown */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Helmet: <strong className="font-bold text-slate-800 dark:text-slate-200">{helmetViolations}</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Vest: <strong className="font-bold text-slate-800 dark:text-slate-200">{vestViolations}</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Mask: <strong className="font-bold text-slate-800 dark:text-slate-200">{maskViolations}</strong></span>
          </span>
        </div>
      </div>

      {/* KPI 03 – Resolved Violations (Emerald Green Theme) */}
      <div 
        onClick={() => onCardClick && onCardClick('resolved')}
        className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
          darkMode 
            ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50' 
            : 'bg-white border-slate-200 hover:border-emerald-400'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                KPI 03
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Resolved Violations
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <TrendingUp className="w-3 h-3" />
            <span>+18.0%</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {resolved_violations.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {reviewed_violations} In Review
          </span>
        </div>

        {/* Progress bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-[11px] mb-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <span>Resolution Rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{resolutionPct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, resolutionPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI 04 – Compliance Rate (Violet / Indigo Theme) */}
      <div 
        onClick={() => onCardClick && onCardClick('compliance')}
        className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
          darkMode 
            ? 'bg-slate-900/90 border-slate-800 hover:border-violet-500/50' 
            : 'bg-white border-slate-200 hover:border-violet-400'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/80 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-2xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                KPI 04
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Compliance Rate
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <TrendingUp className="w-3 h-3" />
            <span>+3.6%</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {compliance_percentage}%
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            compliance_percentage >= 90
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : compliance_percentage >= 75
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}>
            {compliance_percentage >= 90 ? 'Grade A High' : 'Moderate'}
          </span>
        </div>

        {/* Benchmark standards */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>Standard: ISO 45001</span>
          <span className="text-violet-600 dark:text-violet-400 font-bold">
            Target 95%
          </span>
        </div>
      </div>

    </div>
  );
}
