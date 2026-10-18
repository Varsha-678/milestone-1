import React, { useState, useEffect, useRef } from 'react';
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
  Play, 
  Pause, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Columns,
  Info
} from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';
import { playSound } from '../utils/soundEffects';

export default function ResultsViewer({ job, onBackToDashboard, onNewAnalysis }) {
  const [activeMediaTab, setActiveMediaTab] = useState('annotated'); // 'annotated', 'original', 'split'
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [videoFrameFilter, setVideoFrameFilter] = useState('all'); // 'all', 'violations', 'compliant'
  const [hoveredDetIndex, setHoveredDetIndex] = useState(null);
  const [boxFilter, setBoxFilter] = useState('all'); // 'all', 'ppe', 'violations'
  const [isPlayingFrames, setIsPlayingFrames] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1, 1.4, 1.8

  const autoplayTimerRef = useRef(null);

  const isVideo = job ? job.media_type === 'video' : false;
  const rawResults = job && Array.isArray(job.detection_results) ? job.detection_results : [];
  const videoFrames = isVideo ? rawResults : [];

  // Frame autoplay slideshow (called unconditionally before any return!)
  useEffect(() => {
    if (isPlayingFrames && isVideo && videoFrames.length > 1) {
      autoplayTimerRef.current = setInterval(() => {
        setSelectedFrameIndex(prev => (prev + 1) % videoFrames.length);
      }, 1200);
    } else {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    }
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPlayingFrames, isVideo, videoFrames.length]);

  if (!job) {
    return (
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-lg mx-auto my-12 bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-300 font-semibold">No inspection record selected.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const compliance = job.compliance_details || {};
  const statusLabel = compliance.status_label || 'Evaluated';
  const complianceScore = job.compliance_score ?? 0;
  const videoMeta = job.video_metadata || {};
  
  const filteredFrames = videoFrames.filter(frame => {
    if (videoFrameFilter === 'violations') return (frame.violation_count || 0) > 0;
    if (videoFrameFilter === 'compliant') return (frame.violation_count || 0) === 0;
    return true;
  });

  const activeVideoFrame = videoFrames[selectedFrameIndex] || videoFrames[0] || null;

  // Active detections
  const currentDetections = isVideo 
    ? (activeVideoFrame?.detections || [])
    : rawResults;

  const currentFrameCompliance = isVideo
    ? (activeVideoFrame?.compliance || compliance)
    : compliance;

  const toggleAutoplay = () => {
    playSound('click');
    setIsPlayingFrames(!isPlayingFrames);
  };

  const originalMediaUrl = `/uploads/${job.stored_filename}`;
  const resultMediaUrl = isVideo 
    ? (activeVideoFrame?.annotated_frame_url || job.result_media_path || originalMediaUrl)
    : (job.result_media_path || originalMediaUrl);

  const getStatusColor = (status) => {
    if (status === 'Fully Compliant') return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
    if (status === 'Safety Violations Detected') return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800';
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
  };

  // Copy quick summary to clipboard
  const copySummary = () => {
    playSound('click');
    const text = `SafeSight AI Inspection Summary
File: ${job.original_filename}
Record ID: ${job.id}
Status: ${statusLabel}
Compliance Score: ${complianceScore}%
Total Detections: ${job.detection_count}
Violations: ${job.violation_count}
Model: ${job.model_identifier || 'ppe_best.pt'}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Filter detections to display
  const displayedDetections = currentDetections.filter(d => {
    if (boxFilter === 'ppe') return d.is_ppe;
    if (boxFilter === 'violations') return d.is_violation;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Quick Action Bar */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                playSound('click');
                onBackToDashboard();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate max-w-md">
              {job.original_filename}
            </h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${getStatusColor(statusLabel)}`}>
              {statusLabel}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {job.media_type}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-11">
            <span>ID: <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{job.id.slice(0, 8)}...</code></span>
            <span>&bull;</span>
            <span>Model: <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{job.model_identifier || 'ppe_best.pt'}</span></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={copySummary}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            title="Copy audit summary text to clipboard"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSummary ? 'Copied' : 'Share'}</span>
          </button>

          <a
            href={getReportDownloadUrl(job.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound('click')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </a>

          <button
            onClick={() => {
              playSound('click');
              onNewAnalysis();
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Video Stream Profile & Playback Bar */}
      {isVideo && (
        <div className="glass-card rounded-2xl border p-4 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Video Keyframe Stream
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {videoFrames.length} Sampled Frames
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                Duration: {videoMeta.duration_seconds || 0}s &bull; Res: {videoMeta.width || 0}x{videoMeta.height || 0} &bull; FPS: {videoMeta.fps || 24}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Frame Slideshow Autoplay */}
            <button
              onClick={toggleAutoplay}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isPlayingFrames
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
              }`}
            >
              {isPlayingFrames ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingFrames ? 'Pause Slideshow' : 'Auto Playback'}</span>
            </button>

            {/* Filter Frames */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {['all', 'violations', 'compliant'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    playSound('click');
                    setVideoFrameFilter(f);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                    videoFrameFilter === f
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Media (Left 7 cols) & Safety Audit Summary (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Media Display */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="glass-card rounded-3xl border p-4 sm:p-5 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md">
            
            {/* Visualizer Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 gap-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>
                  {isVideo 
                    ? `Keyframe #${activeVideoFrame?.sample_number || selectedFrameIndex + 1} (${activeVideoFrame?.timestamp_sec || 0}s)`
                    : 'YOLOv8 Detection Visualizer'}
                </span>
              </span>

              {/* View Switchers */}
              <div className="flex items-center space-x-2">
                {!isVideo && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => { playSound('click'); setActiveMediaTab('annotated'); }}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeMediaTab === 'annotated' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Annotated
                    </button>
                    <button
                      onClick={() => { playSound('click'); setActiveMediaTab('original'); }}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeMediaTab === 'original' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => { playSound('click'); setActiveMediaTab('split'); }}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center space-x-1 ${
                        activeMediaTab === 'split' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                      }`}
                      title="Side-by-side comparison"
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Compare</span>
                    </button>
                  </div>
                )}

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setZoomLevel(prev => (prev > 1 ? prev - 0.3 : 1))}
                    disabled={zoomLevel <= 1}
                    className="p-1 rounded-lg text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:text-slate-900 dark:hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 px-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => (prev < 2 ? prev + 0.3 : 2))}
                    disabled={zoomLevel >= 2}
                    className="p-1 rounded-lg text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:text-slate-900 dark:hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Media Canvas Box */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[380px] max-h-[540px] flex items-center justify-center border border-slate-800 shadow-inner">
              
              {activeMediaTab === 'split' ? (
                /* Side-by-side comparison view */
                <div className="grid grid-cols-2 gap-2 w-full p-2 h-full">
                  <div className="flex flex-col items-center justify-center relative bg-slate-900/60 rounded-xl overflow-hidden p-1">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      Original
                    </span>
                    <img
                      src={originalMediaUrl}
                      alt="Original media"
                      className="max-h-[460px] w-auto object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center relative bg-slate-900/60 rounded-xl overflow-hidden p-1">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-teal-600 text-white text-[10px] font-bold">
                      YOLOv8 Annotated
                    </span>
                    <img
                      src={resultMediaUrl}
                      alt="Annotated media"
                      className="max-h-[460px] w-auto object-contain"
                    />
                  </div>
                </div>
              ) : (
                /* Standard Zoomable View */
                <div className="overflow-auto max-h-[520px] w-full flex items-center justify-center p-2">
                  <img
                    src={activeMediaTab === 'original' ? originalMediaUrl : resultMediaUrl}
                    alt="Analyzed media frame"
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                    className="max-h-[480px] w-auto object-contain origin-center"
                  />
                </div>
              )}
            </div>

            {/* Color Legend & Interactive Box Filter */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-500 dark:text-slate-400">Legend:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Compliant PPE (Helmet, Vest)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Direct Violation (Missing PPE)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Worker Context</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Keyframe Gallery (Interactive Scrubber) */}
          {isVideo && videoFrames.length > 0 && (
            <div className="glass-card rounded-3xl border p-5 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                  <span>Interactive Frame Scrubber ({filteredFrames.length} Frames)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Click thumbnail to inspect</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
                {filteredFrames.map((frame, idx) => {
                  const frameIndex = videoFrames.indexOf(frame);
                  const isSelected = frameIndex === selectedFrameIndex;
                  const hasViolations = (frame.violation_count || 0) > 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        playSound('click');
                        setSelectedFrameIndex(frameIndex);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-teal-500 ring-4 ring-teal-500/20 shadow-md scale-[1.03]' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={frame.annotated_frame_url}
                        alt={`Sample ${frame.sample_number}`}
                        className="w-full h-16 object-cover bg-slate-900"
                      />
                      <div className="p-1.5 bg-white dark:bg-slate-800 text-[10px] flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {frame.timestamp_sec}s
                        </span>
                        {hasViolations ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                            {frame.violation_count} ⚠
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
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

          {/* Interactive Detected Objects Table with Box Hover Highlighting */}
          <div className="glass-card rounded-3xl border p-5 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Detected Equipment & Entities ({displayedDetections.length})</span>
              </h3>

              {/* Box Category Filter */}
              <div className="flex items-center space-x-1 text-xs">
                {['all', 'ppe', 'violations'].map(f => (
                  <button
                    key={f}
                    onClick={() => { playSound('click'); setBoxFilter(f); }}
                    className={`px-2 py-0.5 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                      boxFilter === f
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {displayedDetections.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-3 text-center">
                No objects matched the active category filter.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Class Label</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Status Category</th>
                      <th className="py-2.5 px-3">Bounding Box</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {displayedDetections.map((det, idx) => (
                      <tr 
                        key={idx} 
                        onMouseEnter={() => setHoveredDetIndex(idx)}
                        onMouseLeave={() => setHoveredDetIndex(null)}
                        className={`transition-colors cursor-pointer ${
                          hoveredDetIndex === idx 
                            ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {det.class_name}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {Math.round(det.confidence * 100)}%
                        </td>
                        <td className="py-2 px-3">
                          <span 
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              det.is_ppe 
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                : det.is_violation 
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {det.is_ppe ? 'Compliant PPE' : det.is_violation ? 'Direct Violation' : 'Context'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
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
          
          {/* Main Compliance Score Card with Animated Ring */}
          <div className="glass-card rounded-3xl border p-6 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Site Safety Compliance Score
            </h2>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {complianceScore !== null ? `${complianceScore}%` : 'N/A'}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {statusLabel}
                </p>
              </div>

              {/* Glowing Indicator Badge */}
              <div className={`w-18 h-18 rounded-2xl flex items-center justify-center border shadow-lg ${
                statusLabel === 'Fully Compliant'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-emerald-500/20'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 shadow-rose-500/20'
              }`}>
                {statusLabel === 'Fully Compliant' ? (
                  <ShieldCheck className="w-10 h-10" />
                ) : (
                  <ShieldAlert className="w-10 h-10" />
                )}
              </div>
            </div>

            {/* Documented Audit Calculation Formula */}
            <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Audit Calculation Rule:
              </span>
              <p className="font-mono text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                {compliance.formula || 'Compliance = (Detected Required / Policy Required) * 100'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono">
                <span>Evaluated Items: {compliance.denominator || 0}</span>
                <span>Detected: {compliance.numerator || 0}</span>
              </div>
            </div>
          </div>

          {/* Compliant vs Violations Breakdown */}
          <div className="glass-card rounded-3xl border p-6 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            
            {/* Detected Required Items (Green) */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Detected Required PPE</span>
              </div>
              {currentFrameCompliance.detected_required_items && currentFrameCompliance.detected_required_items.length > 0 ? (
                <div className="space-y-1.5">
                  {currentFrameCompliance.detected_required_items.map((item, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 font-semibold"
                    >
                      <span>✓ {item}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Present</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No required PPE items visibly detected.</p>
              )}
            </div>

            {/* Missing or Violated Items (Red) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Missing PPE / Potential Violations</span>
              </div>
              {currentFrameCompliance.missing_items && currentFrameCompliance.missing_items.length > 0 ? (
                <div className="space-y-1.5">
                  {currentFrameCompliance.missing_items.map((item, i) => (
                    <div 
                      key={i} 
                      className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 font-semibold"
                    >
                      <span className="font-bold text-rose-600 dark:text-rose-400">⚠ </span>
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">No safety violations flagged.</p>
              )}
            </div>
          </div>

          {/* Safety & Compliance Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4" />
              <span>Inspection Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/80">
              SafeSight AI inferences assist safety officers. Computer vision detections are probabilistic and do not substitute statutory OSHA audits.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
