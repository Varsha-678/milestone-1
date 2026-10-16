import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ArrowLeft, 
  RotateCcw, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Film,
  Clock,
  Video,
  Info,
  ChevronRight,
  Filter
} from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';

export default function ResultsViewer({ job, onBackToDashboard, onNewAnalysis }) {
  const [activeMediaTab, setActiveMediaTab] = useState('annotated'); // 'annotated' or 'original'
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [videoFrameFilter, setVideoFrameFilter] = useState('all'); // 'all', 'violations', 'compliant'

  if (!job) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12">
        <p className="text-slate-600 font-medium">No inspection job data available.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-4 px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isVideo = job.media_type === 'video';
  const compliance = job.compliance_details || {};
  const statusLabel = compliance.status_label || 'Evaluated';
  const complianceScore = job.compliance_score;
  const videoMeta = job.video_metadata || {};

  // For image jobs: detection_results is List[Detection]
  // For video jobs: detection_results is List[FrameResult]
  const rawResults = Array.isArray(job.detection_results) ? job.detection_results : [];
  
  // Video specific frames
  const videoFrames = isVideo ? rawResults : [];
  const filteredFrames = videoFrames.filter(frame => {
    if (videoFrameFilter === 'violations') return (frame.violation_count || 0) > 0;
    if (videoFrameFilter === 'compliant') return (frame.violation_count || 0) === 0;
    return true;
  });

  const activeVideoFrame = videoFrames[selectedFrameIndex] || videoFrames[0] || null;

  // Active detections to display in the table
  const currentDetections = isVideo 
    ? (activeVideoFrame?.detections || [])
    : rawResults;

  const currentFrameCompliance = isVideo
    ? (activeVideoFrame?.compliance || compliance)
    : compliance;

  const getStatusColor = (status) => {
    if (status === 'Fully Compliant') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'Safety Violations Detected') return 'text-rose-700 bg-rose-50 border-rose-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const originalMediaUrl = `/uploads/${job.stored_filename}`;
  const resultMediaUrl = isVideo 
    ? (activeVideoFrame?.annotated_frame_url || job.result_media_path || originalMediaUrl)
    : (job.result_media_path || originalMediaUrl);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 truncate max-w-md">
              Analysis Results: {job.original_filename}
            </h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(statusLabel)}`}>
              {statusLabel}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {job.media_type?.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">
            Record ID: <span className="font-mono text-slate-600">{job.id}</span> &bull; Model: {job.model_identifier || 'ppe_best.pt'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={getReportDownloadUrl(job.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </a>

          <button
            onClick={onNewAnalysis}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Video Metadata Banner if video */}
      {isVideo && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Video Analysis Profile</h2>
              <div className="text-sm font-semibold text-slate-800 flex items-center space-x-3 mt-0.5">
                <span>Duration: {videoMeta.duration_seconds || 0}s</span>
                <span>&bull;</span>
                <span>Resolution: {videoMeta.width || 0}x{videoMeta.height || 0}</span>
                <span>&bull;</span>
                <span>FPS: {videoMeta.fps || 24}</span>
                <span>&bull;</span>
                <span className="text-teal-800 font-bold">{videoFrames.length} Analyzed Keyframes</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter Frames:</span>
            {['all', 'violations', 'compliant'].map((f) => (
              <button
                key={f}
                onClick={() => setVideoFrameFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  videoFrameFilter === f
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Visual Media on Left, Compliance Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Media Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <span className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>
                  {isVideo 
                    ? `Keyframe Visualizer — Sample #${(activeVideoFrame?.sample_number || selectedFrameIndex + 1)} (${activeVideoFrame?.timestamp_sec || 0}s)`
                    : 'Detection Visualizer'}
                </span>
              </span>

              {!isVideo ? (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActiveMediaTab('annotated')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      activeMediaTab === 'annotated' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Annotated (YOLOv8)
                  </button>
                  <button
                    onClick={() => setActiveMediaTab('original')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      activeMediaTab === 'original' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Original Image
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono">
                  Timestamp: {activeVideoFrame?.timestamp_sec || 0}s
                </div>
              )}
            </div>

            {/* Main Visual Display */}
            <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[380px] max-h-[520px]">
              <img
                src={!isVideo && activeMediaTab === 'original' ? originalMediaUrl : resultMediaUrl}
                alt="Analyzed media frame"
                className="max-h-[500px] w-auto object-contain"
              />
            </div>

            {/* Bounding Box Color Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-slate-500">Legend:</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                <span className="text-slate-700 font-medium">Compliant PPE (Helmet, Vest, Mask)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                <span className="text-slate-700 font-medium">Violations (NO-Hardhat, NO-Vest)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-600"></span>
                <span className="text-slate-700 font-medium">Worker / Person</span>
              </div>
            </div>
          </div>

          {/* Interactive Frame Gallery for Video */}
          {isVideo && videoFrames.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sampled Video Frames Gallery ({filteredFrames.length} Frames)
                </h3>
                <span className="text-xs text-slate-400">Click a keyframe to inspect</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
                {filteredFrames.map((frame, idx) => {
                  const frameIndex = videoFrames.indexOf(frame);
                  const isSelected = frameIndex === selectedFrameIndex;
                  const hasViolations = (frame.violation_count || 0) > 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedFrameIndex(frameIndex)}
                      className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-teal-700 ring-2 ring-teal-600/30 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={frame.annotated_frame_url}
                        alt={`Sample ${frame.sample_number}`}
                        className="w-full h-16 object-cover bg-slate-900"
                      />
                      <div className="p-1.5 bg-white text-[10px] flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {frame.timestamp_sec}s
                        </span>
                        {hasViolations ? (
                          <span className="px-1 rounded bg-rose-100 text-rose-800 font-bold">
                            {frame.violation_count} ⚠
                          </span>
                        ) : (
                          <span className="px-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detected Objects Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {isVideo 
                  ? `Detections in Keyframe #${(activeVideoFrame?.sample_number || selectedFrameIndex + 1)} (${currentDetections.length})`
                  : `Detected Objects (${currentDetections.length})`}
              </h3>
            </div>

            {currentDetections.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No objects detected above the confidence threshold.</p>
            ) : (
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Confidence</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Bounding Box [x1, y1, x2, y2]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentDetections.map((det, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {det.class_name}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-teal-800">
                          {Math.round(det.confidence * 100)}%
                        </td>
                        <td className="py-2 px-3">
                          <span 
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              det.is_ppe 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : det.is_violation 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {det.is_ppe ? 'Compliant PPE' : det.is_violation ? 'Direct Violation' : 'Context'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                          [{det.box?.join(', ')}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Safety Compliance Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Compliance Score Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Site Safety Compliance Score
            </h2>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {complianceScore !== null ? `${complianceScore}%` : 'N/A'}
                </span>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {statusLabel}
                </p>
              </div>

              <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                {statusLabel === 'Fully Compliant' ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-rose-600" />
                )}
              </div>
            </div>

            {/* Documented Formula Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                Audit Calculation Rule:
              </span>
              <p className="font-mono text-teal-900 bg-white p-2 rounded-md border border-slate-200">
                {compliance.formula || 'Compliance = (Detected Required / Policy Required) * 100'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Evaluated Items: {compliance.denominator || 0}</span>
                <span>Detected: {compliance.numerator || 0}</span>
              </div>
            </div>
          </div>

          {/* Compliant vs Violations Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            
            {/* Detected Required Items (Green) */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Detected Required PPE</span>
              </div>
              {currentFrameCompliance.detected_required_items && currentFrameCompliance.detected_required_items.length > 0 ? (
                <div className="space-y-1.5">
                  {currentFrameCompliance.detected_required_items.map((item, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-medium"
                    >
                      <span>✓ {item}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700">Present</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No required PPE items visibly detected.</p>
              )}
            </div>

            {/* Missing or Violated Items (Red) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Possible Missing PPE / Violations</span>
              </div>
              {currentFrameCompliance.missing_items && currentFrameCompliance.missing_items.length > 0 ? (
                <div className="space-y-1.5">
                  {currentFrameCompliance.missing_items.map((item, i) => (
                    <div 
                      key={i} 
                      className="p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900 font-medium"
                    >
                      <span className="font-semibold text-rose-700">⚠ </span>
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-medium">No missing safety items flagged.</p>
              )}
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-amber-800">
              <Info className="w-4 h-4" />
              <span>Safety & Inspection Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800/90">
              SafeSight AI detections support but do not replace certified safety inspectors. Absence of detection may occur due to occlusions or camera angles.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
