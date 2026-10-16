import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  Video, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X,
  FileText
} from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';

export default function HistoryPage({ jobs = [], onViewJob, onDeleteJob, onStartNewAnalysis }) {
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
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'Failed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Failed</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Processing</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Uploaded</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Inspection History & Database Records
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review previously processed media, reopen full safety analyses, and download inspection reports.
            </p>
          </div>
          <button
            onClick={onStartNewAnalysis}
            className="self-start sm:self-auto px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-semibold hover:bg-teal-900 transition-colors shadow-xs"
          >
            + New Inspection
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          {/* Search bar (6 cols) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by filename or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-700 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Media Type Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-700 transition-colors"
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-700 transition-colors"
            >
              <option value="all">All Processing Statuses</option>
              <option value="Completed">Completed Only</option>
              <option value="Failed">Failed Only</option>
              <option value="Processing">Processing Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Details Modal */}
      {selectedErrorJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-base">
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

            <div className="text-xs space-y-2">
              <p><strong>File:</strong> {selectedErrorJob.original_filename}</p>
              <p><strong>Record ID:</strong> <span className="font-mono">{selectedErrorJob.id}</span></p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 font-mono text-[11px] break-all">
                {selectedErrorJob.error_message || 'Unknown processing error.'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedErrorJob(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No matching inspection records</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {jobs.length === 0
                ? "No media files have been submitted yet. Upload a workplace file to start."
                : "No records found matching your active search or filter criteria."}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={onStartNewAnalysis}
                className="mt-4 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Analyze Media
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const isCompleted = job.processing_status === 'Completed';
                  const isFailed = job.processing_status === 'Failed';
                  const isVid = job.media_type === 'video';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {job.original_filename}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          {job.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center space-x-1.5 text-slate-600">
                          {isVid ? <Video className="w-3.5 h-3.5 text-indigo-600" /> : <ImageIcon className="w-3.5 h-3.5 text-teal-600" />}
                          <span className="capitalize">{job.media_type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(job.upload_timestamp)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(job.processing_status)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {isCompleted ? `${job.detection_count} items` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className={`font-semibold ${job.violation_count > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {job.violation_count}
                          </span>
                        ) : isFailed ? (
                          <button
                            onClick={() => setSelectedErrorJob(job)}
                            className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>View Error</span>
                          </button>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="font-bold text-teal-800">
                            {job.compliance_score !== null ? `${job.compliance_score}%` : 'N/A'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isCompleted && (
                            <>
                              <button
                                onClick={() => onViewJob(job)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-teal-700 hover:bg-teal-50 border border-teal-200 font-semibold cursor-pointer"
                                title="Open Inspection Results"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <a
                                href={getReportDownloadUrl(job.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                                title="Download Report"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                            title="Delete Record & Associated Files"
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
