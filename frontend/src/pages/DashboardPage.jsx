import React from 'react';
import { 
  ShieldCheck, 
  HardHat, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ArrowRight, 
  Layers, 
  Clock, 
  Eye, 
  Download,
  Trash2,
  Cpu,
  Video,
  Image as ImageIcon
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
  Tooltip, 
  Legend 
} from 'recharts';
import StatCard from '../components/StatCard';
import { getReportDownloadUrl } from '../services/api';

export default function DashboardPage({ 
  jobs = [], 
  healthData, 
  onStartNewAnalysis, 
  onViewJob, 
  onDeleteJob 
}) {
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
    { name: 'Fully Compliant', value: fullyCompliantCount, color: '#16a34a' },
    { name: 'Violations Detected', value: violationCount, color: '#dc2626' },
    { name: 'Insufficient Data', value: insufficientCount, color: '#d97706' },
  ].filter(d => d.value > 0);

  // Fallback if no jobs yet
  const displayComplianceData = complianceChartData.length > 0 
    ? complianceChartData 
    : [{ name: 'No Data Yet', value: 1, color: '#cbd5e1' }];

  // Detections by PPE Category across completed inspections
  const categoryCounts = { 'Helmet': 0, 'Vest': 0, 'Mask': 0, 'Worker': 0, 'Violations': 0 };
  completedJobs.forEach(job => {
    const results = Array.isArray(job.detection_results) ? job.detection_results : [];
    results.forEach(d => {
      // In video, detections might be nested in frame_results
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

  // Recent 5 jobs
  const recentJobs = jobs.slice(0, 5);

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                SafeSight AI Workplace Safety Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Automated computer vision PPE audit & regulatory compliance monitoring
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium text-slate-600">
            <span className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1 rounded-md">
              <Cpu className="w-3.5 h-3.5 text-teal-700" />
              <span>Model: {healthData?.model_name || 'ppe_best.pt'}</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1 rounded-md">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Classes: {healthData?.supported_classes?.length || 10} categories</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>System Operational</span>
            </span>
          </div>
        </div>

        <button
          onClick={onStartNewAnalysis}
          className="self-start md:self-center shrink-0 flex items-center space-x-2 bg-teal-800 hover:bg-teal-900 text-white px-5 py-3 rounded-xl font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Start New Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Files Processed"
          value={totalJobs}
          icon={FileText}
          subtitle={`${completedJobs.length} Completed • ${failedJobs.length} Failed`}
          statusColor="teal"
        />
        <StatCard
          title="Total PPE Detections"
          value={totalDetections}
          icon={HardHat}
          subtitle="Visibly verified compliant safety items"
          statusColor="emerald"
        />
        <StatCard
          title="Possible PPE Violations"
          value={totalViolations}
          icon={AlertTriangle}
          subtitle="Missing helmets, vests, or negative classes"
          statusColor="rose"
        />
        <StatCard
          title="Pass / Compliance Rate"
          value={
            completedJobs.length > 0
              ? `${Math.round((fullyCompliantCount / completedJobs.length) * 100)}%`
              : 'N/A'
          }
          icon={CheckCircle2}
          subtitle={`${fullyCompliantCount} of ${completedJobs.length} fully compliant`}
          statusColor={fullyCompliantCount >= violationCount ? 'emerald' : 'amber'}
        />
      </div>

      {/* Visual Analytics Row (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compliance Distribution Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Compliance Audit Breakdown</h2>
              <span className="text-xs text-slate-400">All submissions</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Proportion of completed workplace submissions passing site safety requirements.
            </p>
          </div>

          <div className="h-60 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayComplianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayComplianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} Inspections`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div>
              <span className="block text-xs font-semibold text-emerald-700">Compliant</span>
              <span className="text-lg font-bold text-slate-900">{fullyCompliantCount}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-rose-700">Violations</span>
              <span className="text-lg font-bold text-slate-900">{violationCount}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-amber-700">Incomplete</span>
              <span className="text-lg font-bold text-slate-900">{insufficientCount}</span>
            </div>
          </div>
        </div>

        {/* PPE Detections Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Safety Equipment Detections by Class</h2>
              <span className="text-xs text-slate-400">YOLOv8 Real Inference</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Frequency of identified safety gear and violation labels across site inspections.
            </p>
          </div>

          <div className="h-60 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ppeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} name="Detections" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
            <span>Model weights: <strong>{healthData?.model_name || 'ppe_best.pt'}</strong></span>
            <span className="text-teal-800 font-semibold">{totalDetections} Total Objects Tracked</span>
          </div>
        </div>
      </div>

      {/* Recent Analysis History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Analysis Records</h2>
            <p className="text-xs text-slate-500 mt-0.5">Most recent workplace image and video safety audits</p>
          </div>
          <button
            onClick={() => onStartNewAnalysis()}
            className="text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline flex items-center space-x-1"
          >
            <span>Inspect Media</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No inspection history found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your first workplace image or video to run YOLOv8 PPE detection and generate compliance reports.
            </p>
            <button
              onClick={onStartNewAnalysis}
              className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Upload Inspection Media
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">File / Record</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">PPE Items</th>
                  <th className="py-2.5 px-3">Violations</th>
                  <th className="py-2.5 px-3">Compliance</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.map((job) => {
                  const isCompleted = job.processing_status === 'Completed';
                  const isFailed = job.processing_status === 'Failed';
                  const isVid = job.media_type === 'video';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {job.original_filename}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          {job.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center space-x-1 text-slate-600">
                          {isVid ? <Video className="w-3.5 h-3.5 text-indigo-600" /> : <ImageIcon className="w-3.5 h-3.5 text-teal-600" />}
                          <span className="capitalize">{job.media_type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(job.upload_timestamp)}
                      </td>
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        ) : isFailed ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                            Failed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
                            Processing
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {isCompleted ? `${job.detection_count} items` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className={`font-semibold ${job.violation_count > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {job.violation_count}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {isCompleted ? (
                          <span className="font-bold text-teal-800">
                            {job.compliance_score !== null ? `${job.compliance_score}%` : 'N/A'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isCompleted && (
                            <>
                              <button
                                onClick={() => onViewJob(job)}
                                className="p-1.5 rounded-md text-teal-700 hover:bg-teal-50 border border-teal-200"
                                title="View Result Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={getReportDownloadUrl(job.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200"
                                title="Download Report"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200"
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
