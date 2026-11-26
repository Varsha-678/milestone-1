import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileVideo, 
  FileImage, 
  X, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Eye,
  Sparkles,
  Check
} from 'lucide-react';
import { analyzeFile } from '../services/api';
import { playSound } from '../utils/soundEffects';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'avi', 'mov'];

export default function UploadCard({ onAnalysisComplete, darkMode = false, mediaType = 'all' }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const [isDragging, setIsDragging] = useState(false);
  const [confThreshold, setConfThreshold] = useState(0.25);
  
  // PPE Policy checklist
  const [requiredItems, setRequiredItems] = useState(['helmet', 'vest']);
  const [activePreset, setActivePreset] = useState('construction'); // 'construction', 'plant', 'cleanroom', 'custom'

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  const stepsList = [
    'Verifying file signature & magic byte structure...',
    'Executing Ultralytics YOLOv8 neural object detection...',
    'Evaluating compliance against workplace safety policy...',
    'Finalizing inspection record & generating downloadable report...'
  ];

  // Quick Preset Handlers
  const handlePresetSelect = (preset) => {
    playSound('click');
    setActivePreset(preset);
    if (preset === 'construction') {
      setRequiredItems(['helmet', 'vest']);
    } else if (preset === 'plant') {
      setRequiredItems(['helmet', 'vest', 'mask']);
    } else if (preset === 'cleanroom') {
      setRequiredItems(['mask']);
    }
  };

  const toggleRequiredItem = (item) => {
    playSound('click');
    setActivePreset('custom');
    setRequiredItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleFileSelection = (files) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      setErrorMessage("Please select only one file per inspection submission.");
      return;
    }

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMessage("Unsupported file format. Please upload JPG, PNG, WEBP, MP4, AVI, or MOV.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File size exceeds the configured upload limit of 50 MB.");
      return;
    }

    playSound('click');
    setSelectedFile(file);
    const isVid = ['mp4', 'avi', 'mov'].includes(ext);
    setFileType(isVid ? 'video' : 'image');
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Quick Sample Loader from public assets
  const loadSampleMedia = async (samplePath, filename) => {
    try {
      playSound('click');
      setErrorMessage(null);
      const res = await fetch(samplePath);
      if (!res.ok) throw new Error("Could not fetch sample media.");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      handleFileSelection([file]);
    } catch (err) {
      setErrorMessage("Failed to load sample image. You can browse and upload your own file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = () => {
    playSound('click');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setCurrentStepIndex(0);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => (prev < 3 ? prev + 1 : prev));
    }, 700);

    try {
      const result = await analyzeFile(
        selectedFile,
        confThreshold,
        requiredItems
      );

      clearInterval(stepInterval);
      setCurrentStepIndex(3);

      if (result.violation_count > 0) {
        playSound('alert');
      } else {
        playSound('success');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onAnalysisComplete(result);
      }, 400);

    } catch (err) {
      clearInterval(stepInterval);
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An error occurred during safety analysis.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header with Title & Quick Sample Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              AI Inspection Submission
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit a single workplace image or video for deep YOLOv8 PPE analysis & policy auditing.
          </p>
        </div>

        {/* Quick Demo Sample Loaders */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden md:inline">Quick Demo:</span>
          <button
            type="button"
            onClick={() => loadSampleMedia('/samples/sample-workers.jpg', 'workers_site_audit.jpg')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Load sample workplace crew image"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Crew</span>
          </button>
          <button
            type="button"
            onClick={() => loadSampleMedia('/samples/sample-ppe-gear.jpg', 'safety_equipment_check.jpg')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Load sample PPE equipment image"
          >
            <span>Sample Gear</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-rose-800 dark:text-rose-200 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Notice: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Container */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            playSound('click');
            fileInputRef.current?.click();
          }}
          className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
            isDragging
              ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelection(e.target.files)}
            className="hidden"
            accept={
              mediaType === 'image' 
                ? '.jpg,.jpeg,.png,.webp' 
                : mediaType === 'video' 
                ? '.mp4,.avi,.mov' 
                : '.jpg,.jpeg,.png,.webp,.mp4,.avi,.mov'
            }
          />

          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-500/25">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
            {mediaType === 'image' 
              ? 'Choose a workplace photo or drag & drop here' 
              : mediaType === 'video' 
              ? 'Choose CCTV video footage or drag & drop here' 
              : 'Choose a media file or drag & drop here'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            {mediaType === 'image' 
              ? 'High-resolution images (JPG, PNG, WEBP) up to 25 MB' 
              : mediaType === 'video' 
              ? 'Video streams & clips (MP4, AVI, MOV) up to 50 MB with keyframe sampling' 
              : 'Single file submission: Images (JPG, PNG, WEBP) or Videos (MP4, AVI, MOV) up to 50 MB'}
          </p>

          <div className="mt-5 flex items-center justify-center space-x-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
            <span className="px-3 py-1 rounded-full bg-teal-100/60 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800">
              Automatic Video Keyframe Sampling Active
            </span>
          </div>
        </div>
      ) : (
        /* Active File Preview & Inspection Controls */
        <div className="space-y-6">
          
          {/* File Meta Header Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
                {fileType === 'video' ? <FileVideo className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {fileType.toUpperCase()} &bull; {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              onClick={handleRemoveFile}
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Change File</span>
            </button>
          </div>

          {/* Interactive Media Preview Box with Optional Scanline */}
          <div className={`relative rounded-2xl overflow-hidden flex items-center justify-center max-h-[420px] border shadow-inner group ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {fileType === 'image' ? (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="max-h-[400px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                onError={(e) => { e.target.style.opacity = '0.7'; }}
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="max-h-[400px] w-full"
              />
            )}

            {/* Futuristic Scanning animation overlay during inference */}
            {isSubmitting && (
              <div className="absolute inset-0 pointer-events-none bg-teal-500/10 flex flex-col justify-center items-center backdrop-blur-xs">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-lg shadow-teal-400 animate-scanline"></div>
              </div>
            )}
          </div>

          {/* Safety Policy & Configuration Card */}
          <div className="rounded-2xl border p-5 space-y-4 bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Workplace Policy Configuration</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Rule Engine v1.0</span>
            </div>

            {/* Quick Policy Presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                1-Click Safety Preset Profiles:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'construction', label: 'Construction Strict', desc: 'Helmet + Vest' },
                  { id: 'plant', label: 'Industrial Plant', desc: 'Helmet + Vest + Mask' },
                  { id: 'cleanroom', label: 'Cleanroom / Lab', desc: 'Face Mask' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      activePreset === p.id
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 dark:border-teal-400 ring-1 ring-teal-500'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">{p.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist Items Toggle */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Mandatory PPE Equipment for Site:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'helmet', label: 'Safety Helmet / Hardhat' },
                  { id: 'vest', label: 'High-Visibility Vest' },
                  { id: 'mask', label: 'Safety Mask' },
                ].map((item) => {
                  const isChecked = requiredItems.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleRequiredItem(item.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isChecked ? <Check className="w-3.5 h-3.5" /> : <span>+</span>}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Confidence Threshold:
                </label>
                <span className="text-xs font-extrabold font-mono px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {Math.round(confThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>10% (High Sensitivity)</span>
                <span>45% (Balanced)</span>
                <span>80% (Strict Confidence)</span>
              </div>
            </div>
          </div>

          {/* Stepper Display during submission */}
          {isSubmitting && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
                <span>Processing Inspection Pipeline:</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {stepsList.map((step, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs">
                    {idx < currentStepIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : idx === currentStepIndex ? (
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping mx-1 shrink-0"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mx-1 shrink-0"></span>
                    )}
                    <span className={idx === currentStepIndex ? 'font-bold text-teal-900 dark:text-teal-200' : 'text-slate-500 dark:text-slate-400'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm shadow-lg flex items-center justify-center space-x-2.5 transition-all duration-200 ${
                isSubmitting
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-500/25 hover:shadow-teal-500/40 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Analyze {fileType === 'video' ? 'Video Feed' : 'Workplace Image'} with YOLOv8</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
