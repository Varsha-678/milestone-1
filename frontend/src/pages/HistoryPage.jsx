import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Eye, 
  Download, 
  Trash2, 
  Video, 
  Image as ImageIcon, 
  AlertCircle, 
  X,
  RotateCcw
} from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';
import { playSound } from '../utils/soundEffects';

export default function HistoryPage({ jobs = [], onViewJob, onDeleteJob, onStartNewAnalysis, darkMode = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all', 'image', 'video'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Completed', 'Failed', 'Processing'
  const [selectedErrorJob, setSelectedErrorJob] = useState(null);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMedia = mediaFilter === 'all' || job.media_type === mediaFilter;
    const matchesStatus = statusFilter === 'all' || job.processing_status === statusFilter;

    return matchesSearch && matchesMedia && matchesStatus;
  });

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Completed</span>;
      case 'Failed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Failed</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">Processing</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Uploaded</span>;
    }
  };

  const resetFilters = () => {
    playSound('click');
    setSearchTerm('');
    setMediaFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Title & Filter Control Bar */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Inspection History & Database Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review persistent media audits, inspect detections, and download compliance reports.
            </p>
          </div>
          
          <button
            onClick={() => {
              playSound('click');
              onStartNewAnalysis();
            }}
            className="self-start sm:self-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            + New Inspection
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* Search bar (6 cols) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by filename or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Media Type Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={mediaFilter}
              onChange={(e) => {
                playSound('click');
                setMediaFilter(e.target.value);
              }}
              className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
            >
              <option value="all">All Media Types</option>
              <option value="image">Images Only</option>
              <option value="video">Videos Only</option>
            </select>
          </div>

          {/* Status Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                playSound('click');
                setStatusFilter(e.target.value);
              }}
              className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
            >
              <option value="all">All Processing Statuses</option>
              <option value="Completed">Completed Only</option>
              <option value="Failed">Failed Only</option>
              <option value="Processing">Processing Only</option>
            </select>
          </div>
        </div>

        {(searchTerm || mediaFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
            <span>Showing {filteredJobs.length} of {jobs.length} total records</span>
            <button
              onClick={resetFilters}
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      {selectedErrorJob && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-base">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Job Processing Failure</span>
              </div>
              <button 
                onClick={() => setSelectedErrorJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong>File:</strong> {selectedErrorJob.original_filename}</p>
              <p><strong>Record ID:</strong> <span className="font-mono">{selectedErrorJob.id}</span></p>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 font-mono text-[11px] break-all">
                {selectedErrorJob.error_message || 'Unknown processing error.'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedErrorJob(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Table Container */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3 border border-teal-200 dark:border-teal-800">
              <History className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-white">No matching records found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {jobs.length === 0
                ? "No media files have been submitted yet. Upload a workplace file to start."
                : "No records found matching your active search or filter criteria."}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => {
                  playSound('click');
                  onStartNewAnalysis();
                }}
                className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Analyze Media
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">File Name / Record ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">PPE Items</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Compliance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredJobs.map((job) => {
                  const isCompleted = job.processing_status === 'Completed';
                  const isFailed = job.processing_status === 'Failed';
                  const isVid = job.media_type === 'video';

                  return (
                    <tr 
                      key={job.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {job.original_filename}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          {job.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-medium">
                          {isVid ? <Video className="w-3.5 h-3.5 text-indigo-500" /> : <ImageIcon className="w-3.5 h-3.5 text-teal-500" />}
                          <span className="capitalize">{job.media_type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                        {formatDate(job.upload_timestamp)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(job.processing_status)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {isCompleted ? `${job.detection_count} items` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className={`font-bold font-mono ${job.violation_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                            {job.violation_count} {job.violation_count > 0 ? '⚠' : ''}
                          </span>
                        ) : isFailed ? (
                          <button
                            onClick={() => {
                              playSound('click');
                              setSelectedErrorJob(job);
                            }}
                            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>View Error</span>
                          </button>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="font-extrabold font-mono text-teal-600 dark:text-teal-400 text-xs">
                            {job.compliance_score !== null ? `${job.compliance_score}%` : 'N/A'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isCompleted && (
                            <>
                              <button
                                onClick={() => {
                                  playSound('click');
                                  onViewJob(job);
                                }}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-bold transition-all cursor-pointer"
                                title="Open Inspection Results"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                              <a
                                href={getReportDownloadUrl(job.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => playSound('click')}
                                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                                title="Download Report"
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
                            className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
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
