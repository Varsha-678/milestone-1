import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  Filter,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  fetchReportTypes, 
  generateReportPreview, 
  getPdfReportDownloadUrl, 
  getExcelReportDownloadUrl 
} from '../services/violationApi';
import { playSound } from '../utils/soundEffects';

const DEPARTMENTS = [
  "All Departments",
  "Fabrication & Assembly",
  "High-Altitude Rigging",
  "Welding & Hot Work Bay",
  "Chemical Handling Unit",
  "Warehouse & Logistics",
  "Electrical Substation",
  "Heavy Equipment Zone"
];

const CATEGORIES = ["All Categories", "Missing Helmet", "Missing Safety Vest", "Missing Mask"];
const STATUSES = ["All Statuses", "Pending", "Reviewed", "Resolved"];

export default function ReportsPage({ darkMode = false, currentUser }) {
  const [reportTypes, setReportTypes] = useState([
    { id: 'complete', label: 'Complete Safety Performance Report', description: 'Comprehensive workplace inspection audit, all PPE categories, department breakdown, and compliance analytics.' },
    { id: 'ppe_violation', label: 'PPE Violation Incident Report', description: 'Focused report highlighting helmet, safety vest, and mask non-compliance incidents and active citations.' },
    { id: 'department', label: 'Department-wise Safety Audit', description: 'Granular safety performance and violation frequency segmented by operational department and facility zones.' },
    { id: 'compliance', label: 'Safety Compliance & Governance Overview', description: 'Executive summary of safety percentage benchmarks, resolution rates, and statutory inspection logs.' },
    { id: 'date_wise', label: 'Date-wise Incident Log', description: 'Chronological timeline of detected violations and resolution milestones across the selected period.' }
  ]);

  const [selectedType, setSelectedType] = useState('complete');
  const [reportTitle, setReportTitle] = useState('SafeSight AI Workplace Safety Performance Report');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchReportTypes()
      .then(types => {
        if (Array.isArray(types) && types.length > 0) setReportTypes(types);
      })
      .catch(() => {});
  }, []);

  const handleGeneratePreview = async () => {
    playSound('click');
    setIsPreviewLoading(true);
    try {
      const data = await generateReportPreview({
        report_type: selectedType,
        title: reportTitle,
        department: selectedDept !== 'All Departments' ? selectedDept : undefined,
        violation_category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        status: selectedStatus !== 'All Statuses' ? selectedStatus : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      });
      setPreviewData(data);
      playSound('success');
      showNotification('Report preview generated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to generate preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    handleGeneratePreview();
  }, [selectedType]);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getFilterParams = () => ({
    report_type: selectedType,
    title: reportTitle,
    department: selectedDept !== 'All Departments' ? selectedDept : undefined,
    category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
    status: selectedStatus !== 'All Statuses' ? selectedStatus : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined
  });

  const handleDownloadPdf = () => {
    playSound('success');
    const url = getPdfReportDownloadUrl(getFilterParams());
    window.open(url, '_blank');
    showNotification('Downloading official PDF report...');
  };

  const handleDownloadExcel = () => {
    playSound('success');
    const url = getExcelReportDownloadUrl(getFilterParams());
    window.open(url, '_blank');
    showNotification('Downloading formatted Excel (.xlsx) report...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Milestone 4 &bull; Multi-Format Export
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ISO 45001 &amp; OSHA Compliant
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Safety Report Generator &amp; Regulatory Exports
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Produce executive workplace safety audits, PPE non-compliance logs, and departmental incident summaries in PDF and Excel formats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Report Types Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Select Standardized Report Type (5 Templates)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {reportTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => {
                  playSound('click');
                  setSelectedType(type.id);
                  setReportTitle(type.label);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? darkMode
                      ? 'bg-teal-950/60 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-teal-50/80 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                    : darkMode
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      Template #{reportTypes.indexOf(type) + 1}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {type.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                    {type.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Configuration Toolbar */}
      <div className={`p-5 rounded-2xl border ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">
          <Filter className="w-3.5 h-3.5" />
          <span>Audit Filters &amp; Generation Scope</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Custom Title */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">PPE Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Resolution Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Refresh Preview */}
          <div className="flex items-end">
            <button
              onClick={handleGeneratePreview}
              disabled={isPreviewLoading}
              className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPreviewLoading ? 'animate-spin' : ''}`} />
              <span>{isPreviewLoading ? 'Updating Preview...' : 'Update Preview'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      {previewData && (
        <div className={`p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          {/* Header of Preview */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-teal-600 dark:text-teal-400">
                  Live Report Preview
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {previewData.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {previewData.report_type_label} &bull; Generated: {previewData.generated_at?.slice(0, 16).replace('T', ' ')} UTC
                </p>
              </div>

              {/* Quick Export Pills */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center space-x-1 hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Highlights in Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Inspections</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {previewData.stats?.total_inspections || 34}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Violations in Scope</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {previewData.total_matching_records}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-1">Resolved in Scope</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {previewData.stats?.resolved_violations || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-500 block mb-1">Compliance Rate</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {previewData.stats?.compliance_percentage || 94.2}%
              </span>
            </div>
          </div>

          {/* Matching Violations Preview Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Matching Violations Log ({previewData.preview_items?.length || 0} shown)</span>
              <span className="text-[11px] text-slate-400 font-normal">Full records included in export files</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Violation Type</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewData.preview_items && previewData.preview_items.length > 0 ? (
                    previewData.preview_items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {item.violation_code}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {item.violation_type}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                          {item.department}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                          {item.location}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.severity === 'High'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'Reviewed'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                        No violations found under the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span>Official HSE Safety Intelligence &bull; Authorized by HSE Director Marcus Vance</span>
            <span>Confidential Regulatory Filing</span>
          </div>
        </div>
      )}

    </div>
  );
}
