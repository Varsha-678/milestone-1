import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  RefreshCw, 
  Download, 
  ShieldAlert, 
  MapPin, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  HardHat, 
  Shirt, 
  Image as ImageIcon, 
  Video, 
  ArrowUpDown,
  History,
  Check,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  fetchViolations, 
  fetchViolationDetail, 
  updateViolationStatus, 
  syncViolations,
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

const SEVERITIES = ["All Severities", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All Statuses", "Pending", "Reviewed", "Resolved"];
const SOURCES = ["All Sources", "Image", "Video"];
const CATEGORIES = ["All Categories", "Missing Helmet", "Missing Safety Vest", "Missing Mask"];

export default function ViolationMonitoringPage({ 
  darkMode = false, 
  currentUser,
  onNavigateTab
}) {
  const [violations, setViolations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('detected_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('Resolved');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchViolations({
        search: search || undefined,
        department: selectedDept !== 'All Departments' ? selectedDept : undefined,
        severity: selectedSeverity !== 'All Severities' ? selectedSeverity : undefined,
        status: selectedStatus !== 'All Statuses' ? selectedStatus : undefined,
        source_type: selectedSource !== 'All Sources' ? selectedSource.toLowerCase() : undefined,
        violation_type: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize
      });
      setViolations(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load violations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    page, 
    pageSize, 
    selectedDept, 
    selectedSeverity, 
    selectedStatus, 
    selectedSource, 
    selectedCategory, 
    sortBy, 
    sortOrder
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    playSound('click');
    setSearch('');
    setSelectedDept('All Departments');
    setSelectedSeverity('All Severities');
    setSelectedStatus('All Statuses');
    setSelectedSource('All Sources');
    setSelectedCategory('All Categories');
    setSortBy('detected_at');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSync = async () => {
    playSound('click');
    setIsSyncing(true);
    try {
      const res = await syncViolations();
      showNotification(`Synchronized ${res.synced_violations_count} new violations from inspections.`);
      loadData();
    } catch (err) {
      showNotification('Sync complete. All inspection records are up to date.');
    } finally {
      setIsSyncing(false);
    }
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openEvidenceModal = async (violation) => {
    playSound('click');
    try {
      const full = await fetchViolationDetail(violation.id);
      setSelectedViolation(full);
    } catch {
      setSelectedViolation(violation);
    }
    setIsEvidenceModalOpen(true);
  };

  const openStatusModal = async (violation) => {
    playSound('click');
    try {
      const full = await fetchViolationDetail(violation.id);
      setSelectedViolation(full);
      setTargetStatus(full.status === 'Pending' ? 'Reviewed' : (full.status === 'Reviewed' ? 'Resolved' : 'Pending'));
    } catch {
      setSelectedViolation(violation);
      setTargetStatus('Reviewed');
    }
    setStatusNotes('');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedViolation) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateViolationStatus(
        selectedViolation.id,
        targetStatus,
        currentUser?.name || 'HSE Admin',
        statusNotes
      );
      playSound('success');
      showNotification(`Violation ${updated.violation_code} updated to ${targetStatus}!`);
      setIsStatusModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
      case 'Reviewed':
        return 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800';
      case 'Pending':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
    }
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
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Milestone 4 &bull; Violation Governance
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {total} Registered Workplace Incidents
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Violation Monitoring &amp; Compliance Register
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Active tracking of AI-detected PPE infractions, review states, severity categorization, and auditable resolution workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Inspections'}</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reports')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Safety Reports</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID (VIO-...), type, department, location, supervisor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-20 py-2 rounded-xl border text-xs focus:outline-hidden transition-all ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
              }`}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold px-2 py-1 self-end lg:self-auto cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">PPE Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Source Media</label>
            <select
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setPage(1); }}
              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Violations Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="py-3.5 px-4">Violation ID</th>
                <th className="py-3.5 px-4">Type &amp; Category</th>
                <th className="py-3.5 px-4">Department &amp; Location</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Detected At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-500" />
                    <span>Loading violation monitoring records...</span>
                  </td>
                </tr>
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No violations match the filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the filter options or sync new inspections.</p>
                  </td>
                </tr>
              ) : (
                violations.map((v) => (
                  <tr 
                    key={v.id} 
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Violation ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 text-[11px]">
                        {v.violation_code}
                      </span>
                    </td>

                    {/* Violation Type */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {v.violation_type.toLowerCase().includes('helmet') ? (
                          <HardHat className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : v.violation_type.toLowerCase().includes('vest') ? (
                          <Shirt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span>{v.violation_type}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Class: {v.raw_class || 'Protocol'} &bull; Conf: {Math.round(v.confidence * 100)}%
                      </div>
                    </td>

                    {/* Department & Location */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                        <span>{v.department}</span>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
                        <span>{v.location}</span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        v.source_type === 'video'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                          : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                      }`}>
                        {v.source_type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        <span className="capitalize">{v.source_type}</span>
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getSeverityBadge(v.severity)}`}>
                        {v.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusPill(v.status)}`}>
                        {v.status}
                      </span>
                    </td>

                    {/* Detected At */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      {v.detected_at ? v.detected_at.slice(0, 10) : 'Recent'}
                      <div className="text-[10px] text-slate-400">
                        {v.detected_at ? v.detected_at.slice(11, 16) : ''}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEvidenceModal(v)}
                          title="View Optical Evidence"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openStatusModal(v)}
                          title="Update Status & Audit Trail"
                          className="px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Status</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{violations.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{total}</strong> incidents &bull; Page{' '}
            <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`p-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 cursor-pointer ${
                darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`p-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 cursor-pointer ${
                darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Evidence Preview Modal */}
      {isEvidenceModalOpen && selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  {selectedViolation.violation_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedViolation.violation_type}
                </h3>
              </div>
              <button 
                onClick={() => setIsEvidenceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Evidence Media Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center min-h-[220px]">
                {selectedViolation.evidence_media_path ? (
                  <img 
                    src={selectedViolation.evidence_media_path} 
                    alt="Optical Inspection Evidence"
                    className="max-h-[340px] w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/dist/samples/sample-workers.jpg';
                    }}
                  />
                ) : (
                  <div className="text-center p-8 text-slate-500">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <span>No visual evidence image attached.</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 text-[10px] text-white font-mono">
                  Confidence: {Math.round(selectedViolation.confidence * 100)}% &bull; Source: {selectedViolation.source_type}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-semibold">{selectedViolation.department}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                  <span className="font-semibold">{selectedViolation.location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Severity &amp; Status</span>
                  <span className="font-semibold">{selectedViolation.severity} &bull; {selectedViolation.status}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Supervisor</span>
                  <span className="font-semibold">{selectedViolation.supervisor || 'HSE Lead M. Vance'}</span>
                </div>
              </div>

              {/* Assessment & Action */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Risk Assessment:</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedViolation.risk_assessment || 'Infraction under Section 4.2 PPE policy.'}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">Corrective Action:</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedViolation.corrective_action || 'Provide worker with approved safety equipment.'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update & Audit Trail Modal */}
      {isStatusModalOpen && selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  {selectedViolation.violation_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update Violation Status &amp; Audit Trail
                </h3>
              </div>
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateStatus} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Target Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Pending', 'Reviewed', 'Resolved'].map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setTargetStatus(stat)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        targetStatus === stat
                          ? stat === 'Resolved'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : stat === 'Reviewed'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Audit Notes / Resolution Details
                </label>
                <textarea
                  rows="3"
                  placeholder="Enter reason for status transition, on-site actions taken, or supervisor sign-off..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-hidden ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500'
                  }`}
                />
              </div>

              {/* Historical Audit Trail */}
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase text-slate-400 mb-2">
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Trail History ({selectedViolation.audit_trail?.length || 0} Events)</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedViolation.audit_trail && selectedViolation.audit_trail.length > 0 ? (
                    selectedViolation.audit_trail.map((log) => (
                      <div 
                        key={log.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px]"
                      >
                        <div className="flex items-center justify-between mb-1 font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">
                            {log.previous_status} &rarr; <span className="text-teal-600 dark:text-teal-400">{log.new_status}</span>
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {log.created_at ? log.created_at.slice(0, 19).replace('T', ' ') : 'Logged'}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          By: <strong className="text-slate-700 dark:text-slate-300">{log.updated_by}</strong>
                          {log.notes && ` — ${log.notes}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">No previous audit logs found.</div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isUpdatingStatus ? 'Saving...' : 'Confirm Status Change'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
