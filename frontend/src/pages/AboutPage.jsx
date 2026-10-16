import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  FileCheck, 
  Database, 
  AlertTriangle, 
  Code, 
  CheckCircle2, 
  Server,
  Workflow,
  BookOpen
} from 'lucide-react';

export default function AboutPage({ healthData }) {
  const supportedClasses = healthData?.supported_classes || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              About SafeSight AI
            </h1>
            <p className="text-sm text-slate-500">
              Intelligent PPE Detection and Workplace Safety Analyzer &bull; Milestone 1
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mt-2">
          SafeSight AI is an automated industrial safety audit web application engineered to verify Personal Protective Equipment (PPE) compliance across worksites, construction facilities, and manufacturing plants. Utilizing Ultralytics YOLOv8 object detection, the system analyzes workplace imagery and keyframe video feeds to detect safety equipment, identify missing gear, and generate downloadable inspection reports.
        </p>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          <Code className="w-5 h-5 text-teal-700" />
          <span>Full-Stack Architecture & Technology Stack</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frontend Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Frontend Stack</span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">React & Tailwind</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              <li><strong>React 19 + Vite:</strong> Ultra-fast component rendering and HMR.</li>
              <li><strong>Tailwind CSS:</strong> Curated industrial-safety design tokens, responsive layouts.</li>
              <li><strong>Recharts:</strong> Interactive compliance distribution & detection frequency charts.</li>
              <li><strong>Lucide React:</strong> Clean iconography for safety categories & statuses.</li>
            </ul>
          </div>

          {/* Backend Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Backend & Vision Stack</span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">FastAPI & YOLOv8</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              <li><strong>FastAPI (Python):</strong> High-performance async REST API with auto documentation.</li>
              <li><strong>Ultralytics YOLOv8:</strong> Real-time neural network for PPE object detection.</li>
              <li><strong>OpenCV:</strong> Image matrix manipulation and video frame sampling pipeline.</li>
              <li><strong>SQLite + SQLAlchemy:</strong> ACID-compliant persistent inspection record database.</li>
              <li><strong>Pillow:</strong> Image file header verification and decompression validation.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Inference Pipeline & Model Capabilities */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          <Cpu className="w-5 h-5 text-teal-700" />
          <span>Computer Vision Pipeline & Loaded Weights</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The system dynamically loads weights from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-teal-800">models/ppe_best.pt</code> at server startup and inspects <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-teal-800">model.names</code> to determine the exact set of recognized classes. SafeSight AI never fabricates or pretends to detect classes that are not genuinely supported by the model weights.
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700 block mb-2">
            Currently Loaded Classes in SafeSight AI ({supportedClasses.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {supportedClasses.map((c, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <h3 className="font-semibold text-slate-800">Configuring Custom or Expanded Weights:</h3>
          <p>
            To deploy custom model weights trained on additional equipment (e.g. safety boots, protective gloves, safety goggles):
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Place your PyTorch weights file (e.g., <code className="font-mono text-teal-800">my_model.pt</code>) into the <code className="font-mono">models/</code> directory.</li>
            <li>Update <code className="font-mono text-teal-800">PPE_MODEL_PATH=models/my_model.pt</code> in your <code className="font-mono">.env</code> file.</li>
            <li>Restart the backend service. The application dynamically adapts its policy evaluation to the new class taxonomy.</li>
          </ol>
        </div>
      </div>

      {/* Compliance Policy & Evaluation Formula */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-teal-700" />
          <span>Compliance Policy & Calculation Formula</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Rather than imposing rigid, one-size-fits-all assumptions, SafeSight AI provides a configurable safety policy where site safety managers select required gear (e.g., Safety Helmet, High-Visibility Vest, Safety Mask).
        </p>

        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2 text-xs">
          <span className="font-bold text-teal-900 block">Standard Compliance Formula:</span>
          <div className="font-mono bg-white p-3 rounded-lg border border-teal-200 text-teal-950 font-bold">
            Compliance Score (%) = (Visibly Detected Required Categories / Total Policy Categories Evaluated) × 100
          </div>
          <p className="text-[11px] text-teal-800 mt-2">
            If no workers or equipment are detected in the frame, the application explicitly outputs <strong>"Insufficient Data"</strong> rather than inventing an arbitrary compliance score.
          </p>
        </div>
      </div>

      {/* End-to-End Processing Workflow */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          <Workflow className="w-5 h-5 text-teal-700" />
          <span>System Workflow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-slate-800">Upload & Validation</h4>
            <p className="text-slate-500 text-[11px]">
              Verifies magic bytes, size limits (&lt;50MB), single-file enforcement, and cleans file path.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="font-bold text-slate-800">YOLOv8 Inference</h4>
            <p className="text-slate-500 text-[11px]">
              Single model instance predicts bounding boxes, confidence ratings, and class labels.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="font-bold text-slate-800">Policy Evaluation</h4>
            <p className="text-slate-500 text-[11px]">
              Compares visibly detected equipment against required gear, flagging missing items or violations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="font-bold text-slate-800">Reporting & History</h4>
            <p className="text-slate-500 text-[11px]">
              Stores metadata in SQLite and generates self-contained downloadable HTML inspection reports.
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Regulatory Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
        <div className="flex items-center space-x-2 font-bold text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Statutory Safety Disclaimer & Human-in-the-Loop Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-900/90">
          SafeSight AI is designed to support and augment safety auditing protocols. Automated computer vision inferences are probabilistic and subject to camera perspective, field-of-view occlusions, and ambient lighting variations. SafeSight AI does NOT replace designated safety officers or statutory workplace safety inspections mandated by regulatory authorities (such as OSHA).
        </p>
      </div>
    </div>
  );
}
