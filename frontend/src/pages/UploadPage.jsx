import React from 'react';
import { UploadCard } from '../components';
import { ShieldCheck, Info, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPage({ healthData, onAnalysisComplete, darkMode = false, mediaType = 'all' }) {
  const supportedClasses = healthData?.supported_classes || [];
  const modelName = healthData?.model_name || 'ppe_best.pt';

  const isImageMode = mediaType === 'image';
  const isVideoMode = mediaType === 'video';

  const pageTitle = isImageMode 
    ? 'SafeSight AI • Image Detection Studio' 
    : isVideoMode 
    ? 'SafeSight AI • Video & CCTV Detection Studio' 
    : 'SafeSight AI • Media Detection Studio';

  const pageSubtitle = isImageMode
    ? 'Submit a high-resolution workplace photograph or CCTV frame to perform neural PPE detection and policy compliance checking.'
    : isVideoMode
    ? 'Submit recorded workplace video or CCTV footage for automated keyframe sampling, timeline tracking, and violation auditing.'
    : 'Submit a workplace image or recorded video for automated YOLOv8 PPE detection and regulatory safety policy compliance evaluation.';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>{isImageMode ? 'Image PPE Inspection' : isVideoMode ? 'Video Stream Inspection' : 'Workplace Media Scanner'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {pageTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {pageSubtitle}
        </p>
      </div>

      {/* Model Capabilities Info Card */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Active Inference Weights: <code className="font-mono text-teal-600 dark:text-teal-400">{modelName}</code></span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            YOLOv8 Dynamic Engine
          </span>
        </div>

        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
          Loaded Model Classes ({supportedClasses.length}):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {supportedClasses.map((clsName, idx) => {
            const isNegative = clsName.toLowerCase().includes('no-');
            const isPPE = ['hardhat', 'helmet', 'vest', 'mask'].some(k => clsName.toLowerCase().includes(k)) && !isNegative;

            return (
              <span
                key={idx}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition-colors ${
                  isNegative
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    : isPPE
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {clsName}
              </span>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          Detections are dynamically governed by model weights. Non-supported items (e.g., boots/gloves) require custom weights.
        </p>
      </div>

      {/* Upload Card */}
      <UploadCard onAnalysisComplete={onAnalysisComplete} darkMode={darkMode} mediaType={mediaType} />
    </div>
  );
}
