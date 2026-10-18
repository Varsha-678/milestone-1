import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Code, 
  Workflow
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export default function AboutPage({ healthData, darkMode = false }) {
  const supportedClasses = healthData?.supported_classes || [];
  const [selectedClass, setSelectedClass] = useState(null);

  const classDescriptions = {
    'Hardhat': 'Compliant safety helmet protecting personnel from falling objects and head trauma.',
    'Mask': 'Protective face covering or respiratory safety mask safeguarding against particulates.',
    'Safety Vest': 'High-visibility fluorescent vest with reflective bands for personnel visibility.',
    'NO-Hardhat': 'Direct OSHA violation: Site worker without mandatory protective headgear.',
    'NO-Mask': 'Direct OSHA violation: Site worker without required respiratory protective gear.',
    'NO-Safety Vest': 'Direct OSHA violation: Site worker without high-visibility protective vest.',
    'Person': 'Human worker or pedestrian context tracked by YOLOv8 neural network.',
    'Safety Cone': 'Hazard demarcation cone designating safe perimeter or hazardous work zone.',
    'machinery': 'Industrial manufacturing equipment or plant mechanical infrastructure.',
    'vehicle': 'Material handling vehicles, forklifts, excavators, or transport trucks.'
  };

  const handleClassClick = (cls) => {
    playSound('click');
    setSelectedClass(cls === selectedClass ? null : cls);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/25">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              SafeSight AI Architecture & Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Workplace Safety & PPE Intelligence Platform &bull; Milestone 1
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mt-2">
          SafeSight AI is an automated industrial safety audit web application engineered to verify Personal Protective Equipment (PPE) compliance across worksites, construction facilities, and manufacturing plants. Utilizing Ultralytics YOLOv8 object detection, the system analyzes workplace imagery and keyframe video feeds to detect safety equipment, identify missing gear, and generate downloadable inspection reports.
        </p>
      </div>

      {/* Interactive Model Class Explorer */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-base font-bold text-slate-900 dark:text-white">
            <Cpu className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Interactive Model Class Explorer ({supportedClasses.length} Active Categories)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Click a class to inspect</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          The system dynamically loads weights from <code className="font-mono text-teal-600 dark:text-teal-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">models/ppe_best.pt</code> and extracts class mappings directly from <code className="font-mono text-teal-600 dark:text-teal-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">model.names</code>. SafeSight AI never fabricates or hallucinates unsupported classes.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {supportedClasses.map((c, i) => {
            const isSelected = selectedClass === c;
            const isViolation = c.toLowerCase().includes('no-');
            return (
              <button
                key={i}
                onClick={() => handleClassClick(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-700 shadow-md scale-105'
                    : isViolation
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {selectedClass && (
          <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 animate-in fade-in duration-200">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">
              Class Definition: {selectedClass}
            </span>
            <p className="text-slate-700 dark:text-slate-300">
              {classDescriptions[selectedClass] || 'Recognized computer vision class for workplace monitoring.'}
            </p>
          </div>
        )}
      </div>

      {/* Technology Stack Grid */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-6 space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          <Code className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Full-Stack Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frontend Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Frontend Stack</span>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                React 19 & Tailwind
              </span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong>React 19 + Vite 8:</strong> Sub-second HMR and reactive component pipeline.</li>
              <li><strong>Tailwind CSS 4:</strong> Industrial design tokens with dark & light theme modes.</li>
              <li><strong>Recharts:</strong> Interactive SVG compliance distribution & PPE frequency charts.</li>
              <li><strong>Web Audio API:</strong> Tactile sound synthesizers for alerts and confirmations.</li>
            </ul>
          </div>

          {/* Backend Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Backend & Vision Stack</span>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                FastAPI & YOLOv8
              </span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong>FastAPI (Python 3.12+):</strong> Asynchronous REST endpoints with auto documentation.</li>
              <li><strong>Ultralytics YOLOv8:</strong> Single-instance real-time neural network detection.</li>
              <li><strong>OpenCV:</strong> Multi-frame video keyframe sampling at configurable intervals.</li>
              <li><strong>SQLite + SQLAlchemy:</strong> ACID-compliant persistent inspection records database.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* End-to-End Processing Workflow */}
      <div className="glass-card rounded-3xl border transition-all duration-300 bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-md p-6 space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          <Workflow className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>System Workflow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              1
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Validation & Header Verification</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Verifies magic bytes, container decodability, size ceilings (&lt;50MB), and sanitizes safe filenames.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              2
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">YOLOv8 Neural Detection</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Predicts bounding coordinates, class taxonomies, and confidence scores across media frames.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              3
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Safety Policy Auditing</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Compares visibly verified equipment against site safety policies, flagging missing items.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              4
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Reporting & DB Persistence</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Persists records into SQLite and generates self-contained downloadable HTML inspection reports.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
