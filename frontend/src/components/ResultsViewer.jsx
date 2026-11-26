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
  Info,
  ChevronLeft,
  ChevronRight,
  Video,
  Loader2,
  Sparkles,
  Sliders,
  Eye
} from 'lucide-react';
import { getReportDownloadUrl, fetchJobDetail } from '../services/api';
import { playSound } from '../utils/soundEffects';

export default function ResultsViewer({ job, onBackToDashboard, onNewAnalysis, darkMode }) {
  const [detailedJob, setDetailedJob] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('annotated'); // 'annotated', 'original', 'split'
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [videoFrameFilter, setVideoFrameFilter] = useState('all'); // 'all', 'violations', 'compliant'
  const [hoveredDetIndex, setHoveredDetIndex] = useState(null);
  const [boxFilter, setBoxFilter] = useState('all'); // 'all', 'ppe', 'violations'
  const [detectionScope, setDetectionScope] = useState('frame'); // 'frame' (active keyframe), 'all' (entire video)
  const [complianceScope, setComplianceScope] = useState('overall'); // 'overall', 'frame'
  const [isPlayingFrames, setIsPlayingFrames] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1, 1.4, 1.8

  const autoplayTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Active job reference: either fetched full detail or passed in job prop
  const activeJob = detailedJob || job;

  // Self-healing: if activeJob is missing detection_results or is still processing, fetch details automatically
  useEffect(() => {
    let isMounted = true;
    if (activeJob?.id && (!activeJob.detection_results || activeJob.detection_results.length === 0 || activeJob.processing_status === 'Processing')) {
      setIsLoadingDetail(true);
      fetchJobDetail(activeJob.id)
        .then(fullData => {
          if (isMounted && fullData) {
            setDetailedJob(fullData);
          }
        })
        .catch(err => {
          console.warn('Could not auto-fetch job detail:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingDetail(false);
        });
    }

    // Polling if still in progress
    if (activeJob?.id && (activeJob.processing_status === 'Processing' || activeJob.processing_status === 'Uploaded')) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const polled = await fetchJobDetail(activeJob.id);
          if (isMounted && polled) {
            setDetailedJob(polled);
            if (polled.processing_status === 'Completed' || polled.processing_status === 'Failed') {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            }
          }
        } catch (e) {
          console.error('Job polling error:', e);
        }
      }, 1800);
    }

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeJob?.id, activeJob?.processing_status]);

  const isVideo = activeJob ? activeJob.media_type === 'video' : false;
  const rawResults = activeJob && Array.isArray(activeJob.detection_results) ? activeJob.detection_results : [];
  const videoFrames = isVideo ? rawResults : [];

  // Frame autoplay slideshow
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

  if (!activeJob) {
    return (
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 shadow-xl">
        <p className="text-slate-600 dark:text-slate-300 font-semibold">No inspection record selected.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Processing state display
  if (activeJob.processing_status === 'Processing' || activeJob.processing_status === 'Uploaded') {
    return (
      <div className="max-w-2xl mx-auto my-12 glass-card rounded-3xl border border-orange-200 dark:border-orange-900/60 p-8 sm:p-10 bg-white/95 dark:bg-slate-900/95 shadow-2xl text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-ping"></div>
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-md">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs font-extrabold uppercase tracking-wider">
            YOLOv8 Engine Running
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            Analyzing Video Stream...
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Extracting periodic sampled keyframes, detecting PPE compliance items, and evaluating OSHA safety requirements.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left text-xs space-y-2.5 font-mono">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Target Video:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{activeJob.original_filename}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Model:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{activeJob.model_identifier || 'ppe_best.pt'}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Status:</span>
            <span className="font-bold text-orange-600 dark:text-orange-400 animate-pulse">Processing Keyframes</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          This view will update automatically the moment frame inference completes.
        </p>
      </div>
    );
  }

  const compliance = activeJob.compliance_details || {};
  const statusLabel = compliance.status_label || (activeJob.violation_count > 0 ? 'Safety Violations Detected' : 'Fully Compliant');
  const complianceScore = activeJob.compliance_score ?? (compliance.compliance_percentage ?? 0);
  const videoMeta = activeJob.video_metadata || {};
  
  const filteredFrames = videoFrames.filter(frame => {
    if (videoFrameFilter === 'violations') return (frame.violation_count || 0) > 0;
    if (videoFrameFilter === 'compliant') return (frame.violation_count || 0) === 0;
    return true;
  });

  const activeVideoFrame = videoFrames[selectedFrameIndex] || videoFrames[0] || null;

  // Frame compliance vs Overall video compliance
  const currentFrameCompliance = isVideo
    ? (activeVideoFrame?.compliance || compliance)
    : compliance;

  const activeCompliance = (isVideo && complianceScope === 'frame')
    ? currentFrameCompliance
    : compliance;

  // Active detections for current keyframe
  const frameDetections = isVideo 
    ? (activeVideoFrame?.detections || [])
    : rawResults;

  // All video detections aggregated across all sampled frames
  const allVideoDetections = isVideo
    ? videoFrames.flatMap((f, fIdx) => (f.detections || []).map(d => ({
        ...d,
        frameIndex: fIdx,
        sample_number: f.sample_number,
        timestamp_sec: f.timestamp_sec
      })))
    : rawResults;

  const currentDetections = (isVideo && detectionScope === 'all')
    ? allVideoDetections
    : frameDetections;

  // Filter detections by box category
  const displayedDetections = currentDetections.filter(d => {
    if (boxFilter === 'ppe') return d.is_ppe;
    if (boxFilter === 'violations') return d.is_violation;
    return true;
  });

  const toggleAutoplay = () => {
    playSound('click');
    setIsPlayingFrames(!isPlayingFrames);
  };

  const handleNextFrame = () => {
    if (videoFrames.length === 0) return;
    playSound('click');
    setSelectedFrameIndex(prev => (prev + 1) % videoFrames.length);
  };

  const handlePrevFrame = () => {
    if (videoFrames.length === 0) return;
    playSound('click');
    setSelectedFrameIndex(prev => (prev - 1 + videoFrames.length) % videoFrames.length);
  };

  const originalMediaUrl = `/uploads/${activeJob.stored_filename}`;
  const resultMediaUrl = isVideo 
    ? (activeVideoFrame?.annotated_frame_url || activeJob.result_media_path || originalMediaUrl)
    : (activeJob.result_media_path || originalMediaUrl);

  const getStatusColor = (status) => {
    if (status === 'Fully Compliant') return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
    if (status === 'Safety Violations Detected') return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800';
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
  };

  // Copy quick summary to clipboard
  const copySummary = () => {
    playSound('click');
    const text = `SafeSight AI Inspection Summary
File: ${activeJob.original_filename}
Record ID: ${activeJob.id}
Type: ${activeJob.media_type.toUpperCase()}
Status: ${statusLabel}
Compliance Score: ${complianceScore}%
Total Detections: ${activeJob.detection_count}
Violations: ${activeJob.violation_count}
Model: ${activeJob.model_identifier || 'ppe_best.pt'}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Compute Evaluated and Detected count smoothly
  const evaluatedCount = activeCompliance.denominator ?? (isVideo && complianceScope === 'overall' ? (compliance.denominator || activeJob.detection_count || 0) : (currentFrameCompliance.denominator || 0));
  const detectedCount = activeCompliance.numerator ?? (isVideo && complianceScope === 'overall' ? (compliance.numerator || Math.max(0, (activeJob.detection_count || 0) - (activeJob.violation_count || 0))) : (currentFrameCompliance.numerator || 0));

  // Resolved lists of required and missing items
  const detectedRequiredPPE = activeCompliance.detected_required_items && activeCompliance.detected_required_items.length > 0
    ? activeCompliance.detected_required_items
    : (compliance.detected_required_items || currentFrameCompliance.detected_required_items || []);

  const missingViolationsPPE = activeCompliance.missing_items && activeCompliance.missing_items.length > 0
    ? activeCompliance.missing_items
    : (compliance.missing_items || currentFrameCompliance.missing_items || []);

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
              {activeJob.original_filename}
            </h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${getStatusColor(statusLabel)}`}>
              {statusLabel}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              {activeJob.media_type}
            </span>
            {isLoadingDetail && (
              <span className="flex items-center space-x-1 text-xs text-teal-600 dark:text-teal-400 font-semibold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing details...</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-11">
            <span>ID: <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{activeJob.id.slice(0, 8)}...</code></span>
            <span>&bull;</span>
            <span>Model: <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{activeJob.model_identifier || 'ppe_best.pt'}</span></span>
            <span>&bull;</span>
            <span>Detections: <span className="font-bold text-slate-800 dark:text-slate-200">{activeJob.detection_count}</span></span>
            <span>&bull;</span>
            <span>Violations: <span className="font-bold text-rose-600 dark:text-rose-400">{activeJob.violation_count}</span></span>
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
            href={getReportDownloadUrl(activeJob.id)}
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

      {/* Video Interactive Control Banner (Scrubber & Player Quick Bar) */}
      {isVideo && (
        <div className="glass-card rounded-2xl border p-4 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Video Keyframe Stream
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  {videoFrames.length} Keyframes Sampled
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                  {activeJob.detection_count} Total Detections
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                Duration: {videoMeta.duration_seconds || 0}s &bull; Res: {videoMeta.width || 0}x{videoMeta.height || 0} &bull; FPS: {videoMeta.fps || 24}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Frame step backward */}
            <button
              onClick={handlePrevFrame}
              disabled={videoFrames.length <= 1}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Previous Keyframe"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Frame Slideshow Autoplay */}
            <button
              onClick={toggleAutoplay}
              disabled={videoFrames.length <= 1}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isPlayingFrames
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
              }`}
            >
              {isPlayingFrames ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingFrames ? 'Pause Slideshow' : 'Play Slideshow'}</span>
            </button>

            {/* Frame step forward */}
            <button
              onClick={handleNextFrame}
              disabled={videoFrames.length <= 1}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Next Keyframe"
            >
              <ChevronRight className="w-4 h-4" />
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
                <Layers className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <span>
                  {isVideo 
                    ? `Keyframe #${activeVideoFrame?.sample_number || selectedFrameIndex + 1} (${activeVideoFrame?.timestamp_sec || 0}s) — ${activeVideoFrame?.detections?.length || 0} Detections`
                    : 'YOLOv8 Detection Visualizer'}
                </span>
              </span>

              {/* View Switchers: Available for BOTH Images and Videos */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => { playSound('click'); setActiveMediaTab('annotated'); }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                      activeMediaTab === 'annotated' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isVideo ? 'Keyframe' : 'Annotated'}</span>
                  </button>
                  <button
                    onClick={() => { playSound('click'); setActiveMediaTab('original'); }}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                      activeMediaTab === 'original' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isVideo ? <Video className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isVideo ? 'Video Player' : 'Original'}</span>
                  </button>
                  <button
                    onClick={() => { playSound('click'); setActiveMediaTab('split'); }}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center space-x-1 ${
                      activeMediaTab === 'split' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                    title="Side-by-side comparison"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>
                </div>

                {/* Zoom Controls (for image and keyframe views) */}
                {activeMediaTab !== 'original' && (
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
                )}
              </div>
            </div>

            {/* Media Canvas Box */}
            <div className={`relative rounded-2xl overflow-hidden min-h-[380px] max-h-[540px] flex items-center justify-center border shadow-inner ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              
              {activeMediaTab === 'original' && isVideo ? (
                /* Native HTML5 Video Player for Video Mode */
                <div className="w-full h-full flex flex-col items-center justify-center p-3">
                  <video
                    ref={videoPlayerRef}
                    src={originalMediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-[500px] w-full object-contain rounded-xl bg-black"
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3">
                    <span>Smooth native video playback</span>
                    <span>&bull;</span>
                    <button
                      onClick={() => {
                        if (videoPlayerRef.current && activeVideoFrame) {
                          videoPlayerRef.current.currentTime = activeVideoFrame.timestamp_sec;
                          videoPlayerRef.current.play().catch(() => {});
                        }
                      }}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-500 font-bold underline cursor-pointer"
                    >
                      Seek to active keyframe ({activeVideoFrame?.timestamp_sec || 0}s)
                    </button>
                  </div>
                </div>
              ) : activeMediaTab === 'split' ? (
                /* Side-by-side comparison view */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full p-2 h-full">
                  <div className={`flex flex-col items-center justify-center relative rounded-xl overflow-hidden p-1 border ${
                    darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                      {isVideo ? 'Original Video Stream' : 'Original Upload'}
                    </span>
                    {isVideo ? (
                      <video
                        src={originalMediaUrl}
                        controls
                        playsInline
                        className="max-h-[460px] w-full object-contain"
                      />
                    ) : (
                      <img
                        src={originalMediaUrl}
                        alt="Original media"
                        className="max-h-[460px] w-auto object-contain"
                        onError={(e) => { e.target.style.opacity = '0.7'; }}
                      />
                    )}
                  </div>
                  <div className={`flex flex-col items-center justify-center relative rounded-xl overflow-hidden p-1 border ${
                    darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-orange-600 text-white text-[10px] font-bold">
                      {isVideo ? `Annotated Keyframe (${activeVideoFrame?.timestamp_sec || 0}s)` : 'YOLOv8 Annotated'}
                    </span>
                    <img
                      src={resultMediaUrl}
                      alt="Annotated media"
                      className="max-h-[460px] w-auto object-contain"
                      onError={(e) => { e.target.style.opacity = '0.7'; }}
                    />
                  </div>
                </div>
              ) : (
                /* Standard Zoomable View (Annotated Keyframe or Image) */
                <div className="overflow-auto max-h-[520px] w-full flex items-center justify-center p-2">
                  <img
                    src={activeMediaTab === 'original' ? originalMediaUrl : resultMediaUrl}
                    alt="Analyzed media frame"
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                    className="max-h-[480px] w-auto object-contain origin-center"
                    onError={(e) => { e.target.style.opacity = '0.7'; }}
                  />
                </div>
              )}
            </div>

            {/* Video Interactive Timeline Scrubber Range Slider (under visualizer) */}
            {isVideo && videoFrames.length > 0 && activeMediaTab !== 'original' && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-500" />
                    <span>Timeline Scrubber</span>
                  </span>
                  <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-orange-600 dark:text-orange-400">{activeVideoFrame?.timestamp_sec || 0}s</span>
                    <span>/</span>
                    <span>{videoMeta.duration_seconds || 0}s</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      Frame {selectedFrameIndex + 1}/{videoFrames.length}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={Math.max(0, videoFrames.length - 1)}
                  value={selectedFrameIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setSelectedFrameIndex(idx);
                  }}
                  className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>
            )}

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
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Direct Violation (NO-Mask, NO-Vest)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Worker Context</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Keyframe Gallery (Interactive Scrubber Strip) */}
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
                        if (activeMediaTab === 'original') setActiveMediaTab('annotated');
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-orange-500 ring-4 ring-orange-500/25 shadow-md scale-[1.03]' 
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Detected Equipment & Entities ({displayedDetections.length})</span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Scope Switcher for Video: Current Keyframe vs All Video Frames */}
                {isVideo && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setDetectionScope('frame')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        detectionScope === 'frame'
                          ? 'bg-orange-500 text-white font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Keyframe #{activeVideoFrame?.sample_number || 1} ({frameDetections.length})
                    </button>
                    <button
                      onClick={() => setDetectionScope('all')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        detectionScope === 'all'
                          ? 'bg-orange-500 text-white font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All Video ({allVideoDetections.length})
                    </button>
                  </div>
                )}

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
            </div>

            {displayedDetections.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
                No objects matched the active category filter.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Class Label</th>
                      {detectionScope === 'all' && <th className="py-2.5 px-3">Time</th>}
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
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${det.is_violation ? 'bg-rose-500' : det.is_ppe ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
                          <span>{det.class_name}</span>
                        </td>
                        {detectionScope === 'all' && (
                          <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {det.timestamp_sec}s
                          </td>
                        )}
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
                                  : 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
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
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Site Safety Compliance Score
              </h2>

              {/* Video Scope Toggle (Overall vs Current Frame) */}
              {isVideo && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setComplianceScope('overall')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      complianceScope === 'overall'
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Overall Video
                  </button>
                  <button
                    onClick={() => setComplianceScope('frame')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      complianceScope === 'frame'
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Keyframe #{activeVideoFrame?.sample_number || 1}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {complianceScope === 'frame' && activeVideoFrame?.compliance?.compliance_percentage !== undefined
                    ? `${activeVideoFrame.compliance.compliance_percentage}%`
                    : complianceScore !== null ? `${complianceScore}%` : 'N/A'}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {complianceScope === 'frame' ? (activeVideoFrame?.compliance?.status_label || statusLabel) : statusLabel}
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
                {complianceScope === 'frame' 
                  ? (activeVideoFrame?.compliance?.formula || 'Compliance = (Detected Required / Policy Required) * 100')
                  : (compliance.formula || 'Compliance = (Detected Required / Policy Required) * 100')}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono">
                <span>Evaluated Items: <strong className="text-slate-800 dark:text-slate-200">{evaluatedCount}</strong></span>
                <span>Detected: <strong className="text-teal-600 dark:text-teal-400">{detectedCount}</strong></span>
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
              {detectedRequiredPPE.length > 0 ? (
                <div className="space-y-1.5">
                  {detectedRequiredPPE.map((item, i) => (
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
              {missingViolationsPPE.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {missingViolationsPPE.map((item, i) => (
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
          <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 text-xs text-orange-900 dark:text-orange-200 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-orange-800 dark:text-orange-300">
              <Info className="w-4 h-4" />
              <span>Inspection Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-orange-900/90 dark:text-orange-300/80">
              SafeSight AI inferences assist safety officers. Computer vision detections are probabilistic and do not substitute statutory OSHA audits.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
