import React, { useState } from 'react';
import { 
  HardHat, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Layers, 
  Eye, 
  Download,
  Trash2,
  Cpu,
  Video,
  Image as ImageIcon,
  Sparkles,
  Search,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import StatCard from '../components/StatCard';
import { getReportDownloadUrl } from '../services/api';
import { playSound } from '../utils/soundEffects';

export default function DashboardPage({ 
  jobs = [], 
  healthData, 
  onStartNewAnalysis, 
  onViewJob, 
  onDeleteJob,
  darkMode = false
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'violations', 'compliant', 'video'
  const [tableSearch, setTableSearch] = useState('');

  // Aggregate statistics
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.processing_status === 'Completed');
  const failedJobs = jobs.filter(j => j.processing_status === 'Failed');
  const processingJobs = jobs.filter(j => j.processing_status === 'Processing' || j.processing_status === 'Uploaded');

  const totalDetections = completedJobs.reduce((acc, j) => acc + (j.detection_count || 0), 0);
  const totalViolations = completedJobs.reduce((acc, j) => acc + (j.violation_count || 0), 0);

  // Compliance Breakdown data for Pie Chart
  const fullyCompliantCount = completedJobs.filter(j => 
    j.compliance_details?.status_label === 'Fully Compliant'
  ).length;
  const violationCount = completedJobs.filter(j => 
    j.compliance_details?.status_label === 'Safety Violations Detected'
  ).length;
  const insufficientCount = completedJobs.filter(j => 
    j.compliance_details?.status_label === 'Insufficient Data'
  ).length;

  const complianceChartData = [
    { name: 'Fully Compliant', value: fullyCompliantCount, color: '#10b981' },
    { name: 'Violations Detected', value: violationCount, color: '#f43f5e' },
    { name: 'Insufficient Data', value: insufficientCount, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const displayComplianceData = complianceChartData.length > 0 
    ? complianceChartData 
    : [{ name: 'Awaiting Media', value: 1, color: darkMode ? '#334155' : '#e2e8f0' }];

  // Detections by PPE Category across completed inspections
  const categoryCounts = { 'Helmet': 0, 'Vest': 0, 'Mask': 0, 'Worker': 0, 'Violations': 0 };
  completedJobs.forEach(job => {
    const results = Array.isArray(job.detection_results) ? job.detection_results : [];
    results.forEach(d => {
      const items = d.detections ? d.detections : [d];
      items.forEach(item => {
        const name = (item.class_name || '').toLowerCase();
        if (item.is_violation || name.includes('no-')) categoryCounts['Violations'] += 1;
        else if (name.includes('hardhat') || name.includes('helmet')) categoryCounts['Helmet'] += 1;
        else if (name.includes('vest')) categoryCounts['Vest'] += 1;
        else if (name.includes('mask')) categoryCounts['Mask'] += 1;
        else if (name.includes('person') || name.includes('worker')) categoryCounts['Worker'] += 1;
      });
    });
  });

  const ppeDistributionData = [
    { name: 'Helmet', count: categoryCounts['Helmet'] },
    { name: 'Vest', count: categoryCounts['Vest'] },
    { name: 'Mask', count: categoryCounts['Mask'] },
    { name: 'Worker', count: categoryCounts['Worker'] },
    { name: 'Violations', count: categoryCounts['Violations'] },
  ];

  // Filter recent records
  const filteredRecords = jobs.filter(job => {
    const matchesSearch = 
      job.original_filename?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.id?.toLowerCase().includes(tableSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterMode === 'violations') return (job.violation_count || 0) > 0;
    if (filterMode === 'compliant') return job.compliance_details?.status_label === 'Fully Compliant';
    if (filterMode === 'video') return job.media_type === 'video';
    return true;
  });

  const recentJobs = filteredRecords.slice(0, 6);

  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  const complianceRate = completedJobs.length > 0
    ? Math.round((fullyCompliantCount / completedJobs.length) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* High-Tech Hero Operations Banner */}
      <div className="relative overflow-hidden rounded-3xl border transition-all duration-300 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white border-slate-800 shadow-xl p-6 sm:p-8">
        
        {/* Futuristic glowing backdrop graphics */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                <span>SYSTEM ONLINE</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                MODEL: {healthData?.model_name || 'ppe_best.pt'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
              Workplace Safety & PPE Intelligence Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
              Real-time computer vision inference engine monitoring site protective gear compliance, detecting absent helmets, vests, and generating regulatory audit reports.
            </p>

            {/* Quick Telemetry Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-slate-300 font-medium">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span>YOLOv8 Dynamic Weights</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-slate-300 font-medium">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{healthData?.supported_classes?.length || 10} PPE Classes Active</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-emerald-950/60 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-800/50 font-medium">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sub-50ms Frame Inference</span>
              </span>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => {
                playSound('click');
                onStartNewAnalysis();
              }}
              className="flex items-center justify-center space-x-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Launch AI Inspection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Inspections"
          value={totalJobs}
          icon={FileText}
          subtitle={`${completedJobs.length} Completed • ${failedJobs.length} Failed • ${processingJobs.length} Active`}
          statusColor="teal"
          active={filterMode === 'all'}
          onClick={() => setFilterMode('all')}
        />
        <StatCard
          title="PPE Items Verified"
          value={totalDetections}
          icon={HardHat}
          subtitle="Visibly verified compliant protective items"
          statusColor="emerald"
        />
        <StatCard
          title="Flagged Violations"
          value={totalViolations}
          icon={AlertTriangle}
          subtitle="Missing helmets, vests, or direct negative flags"
          statusColor="rose"
          active={filterMode === 'violations'}
          onClick={() => setFilterMode('violations')}
        />
        <StatCard
          title="Overall Compliance"
          value={completedJobs.length > 0 ? `${complianceRate}%` : 'N/A'}
          icon={CheckCircle2}
          subtitle={`${fullyCompliantCount} of ${completedJobs.length} submissions passed`}
          statusColor={complianceRate >= 70 ? 'emerald' : 'amber'}
          active={filterMode === 'compliant'}
          onClick={() => setFilterMode('compliant')}
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Compliance Distribution Pie Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border p-6 transition-all duration-300 bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Compliance Audit Ratio</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {completedJobs.length} Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Proportion of workplace submissions passing site safety requirements.
            </p>
          </div>

          <div className="h-60 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayComplianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={800}
                >
                  {displayComplianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} Records`, name]}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderRadius: '12px', 
                    border: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                    fontSize: '12px',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Metric Pills */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div 
              onClick={() => { playSound('click'); setFilterMode('compliant'); }}
              className="p-2 rounded-xl hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors"
            >
              <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Compliant</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{fullyCompliantCount}</span>
            </div>
            <div 
              onClick={() => { playSound('click'); setFilterMode('violations'); }}
              className="p-2 rounded-xl hover:bg-rose-50/60 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
            >
              <span className="block text-[11px] font-bold text-rose-600 dark:text-rose-400">Violations</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{violationCount}</span>
            </div>
            <div className="p-2 rounded-xl">
              <span className="block text-[11px] font-bold text-amber-600 dark:text-amber-400">Insufficient</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{insufficientCount}</span>
            </div>
          </div>
        </div>

        {/* PPE Detections Bar Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border p-6 transition-all duration-300 bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Safety Equipment Detections by Class</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Ultralytics YOLOv8</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Frequency of identified safety gear and violation labels across site inspections.
            </p>
          </div>

          <div className="h-60 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ppeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }} 
                  axisLine={{ stroke: darkMode ? '#334155' : '#cbd5e1' }}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                  axisLine={{ stroke: darkMode ? '#334155' : '#cbd5e1' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderRadius: '12px', 
                    border: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                    fontSize: '12px',
                    color: darkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill={darkMode ? '#14b8a6' : '#0f766e'} 
                  radius={[6, 6, 0, 0]} 
                  name="Detections" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60">
            <span>Model weights: <strong className="font-mono text-teal-600 dark:text-teal-400">{healthData?.model_name || 'ppe_best.pt'}</strong></span>
            <span className="text-teal-700 dark:text-teal-400 font-bold">{totalDetections} Total Objects Tracked</span>
          </div>
        </div>
      </div>

      {/* Interactive Recent Analysis Records Table */}
      <div className="rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
        
        {/* Table Header & Interactive Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Recent Safety Audits</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {filteredRecords.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Workplace safety verification records & downloadable reports
            </p>
          </div>

          {/* Interactive Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audits..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors w-40 sm:w-48"
              />
            </div>

            {/* Filter Chips */}
            {[
              { id: 'all', label: 'All' },
              { id: 'violations', label: 'Violations Only' },
              { id: 'compliant', label: '100% Compliant' },
              { id: 'video', label: 'Videos' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => {
                  playSound('click');
                  setFilterMode(chip.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === chip.id
                    ? 'bg-teal-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching inspection records</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Upload workplace images or videos to run automated YOLOv8 PPE compliance inspection.
            </p>
            <button
              onClick={() => {
                playSound('click');
                onStartNewAnalysis();
              }}
              className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
            >
              Start New Analysis
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">File / Record</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">PPE Items</th>
                  <th className="py-3 px-3">Violations</th>
                  <th className="py-3 px-3">Compliance</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentJobs.map((job) => {
                  const isCompleted = job.processing_status === 'Completed';
                  const isFailed = job.processing_status === 'Failed';
                  const isVid = job.media_type === 'video';
                  const hasViolations = (job.violation_count || 0) > 0;

                  return (
                    <tr 
                      key={job.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-xs group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {job.original_filename}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          {job.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-medium">
                          {isVid ? <Video className="w-3.5 h-3.5 text-indigo-500" /> : <ImageIcon className="w-3.5 h-3.5 text-teal-500" />}
                          <span className="capitalize">{job.media_type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(job.upload_timestamp)}
                      </td>
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            Completed
                          </span>
                        ) : isFailed ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            Failed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse">
                            Processing
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {isCompleted ? `${job.detection_count} items` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className={`font-bold font-mono ${hasViolations ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                            {job.violation_count} {hasViolations ? '⚠' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className={`font-extrabold font-mono text-xs ${
                            job.compliance_score >= 100 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : job.compliance_score > 0 
                                ? 'text-teal-600 dark:text-teal-400' 
                                : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {job.compliance_score !== null ? `${job.compliance_score}%` : 'N/A'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isCompleted && (
                            <>
                              <button
                                onClick={() => {
                                  playSound('click');
                                  onViewJob(job);
                                }}
                                className="p-1.5 rounded-lg text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 transition-colors cursor-pointer"
                                title="Inspect Results"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={getReportDownloadUrl(job.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                                title="Download Full Report"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => {
                              playSound('click');
                              onDeleteJob(job.id);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
