import React from 'react';
import { UploadCard } from '../components';
import { ShieldCheck, Info, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPage({ healthData, onAnalysisComplete }) {
  const supportedClasses = healthData?.supported_classes || [];
  const modelName = healthData?.model_name || 'ppe_best.pt';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Workplace Media Inspection
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Submit a single workplace image or video for automated YOLOv8 PPE detection and regulatory safety policy compliance evaluation.
        </p>
      </div>

      {/* Model Capabilities Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-teal-700" />
            <span>Active Inference Model: {modelName}</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Ultralytics YOLOv8 Active
          </span>
        </div>

        <div className="text-xs text-slate-600 mb-2">
          <strong>Supported Detection Classes ({supportedClasses.length}):</strong>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {supportedClasses.map((clsName, idx) => {
            const isNegative = clsName.toLowerCase().includes('no-');
            const isPPE = ['hardhat', 'helmet', 'vest', 'mask'].some(k => clsName.toLowerCase().includes(k)) && !isNegative;

            return (
              <span
                key={idx}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                  isNegative
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : isPPE
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {clsName}
              </span>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 mt-3">
          Note: Detections are bounded by the model's actual trained weights. Safety footwear and gloves require custom-trained weights.
        </p>
      </div>

      {/* Upload & Form Card */}
      <UploadCard onAnalysisComplete={onAnalysisComplete} />
    </div>
  );
}
