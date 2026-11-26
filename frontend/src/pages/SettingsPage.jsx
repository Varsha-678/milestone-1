import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Bell, 
  Camera, 
  Building2, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Cpu, 
  Volume2, 
  Save 
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export default function SettingsPage({ darkMode = false, healthData }) {
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('rtsp://cctv.local:8554/live/zone_a');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    playSound('success');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const supportedClasses = healthData?.supported_classes || [
    'Hardhat', 'Mask', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest',
    'Person', 'Safety Cone', 'Safety Vest', 'machinery', 'vehicle'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            System Configuration
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            SafeSight AI Safety Intelligence Engine
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Workplace Safety System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure detection sensitivity thresholds, camera feed connections, alert behaviors, and operational parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Detection Sensitivity & Thresholds */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white mb-4">
            <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>YOLOv8 Optical Detection Thresholds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Confidence Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <label className="text-slate-700 dark:text-slate-300">Confidence Threshold</label>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{Math.round(confThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Minimum probability required to flag PPE compliance or violation. Recommended default: 25%.
              </p>
            </div>

            {/* IoU Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <label className="text-slate-700 dark:text-slate-300">IoU / NMS Deduplication Threshold</label>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{Math.round(iouThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={iouThreshold}
                onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Suppresses duplicate overlapping bounding boxes on single workers. Recommended default: 45%.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications & Sound Alerts */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white mb-4">
            <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Alerts &amp; Audio Broadcast</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Critical Violation Audio Chimes</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Play acoustic alerts whenever missing helmets or high-severity violations are detected.
                </span>
              </div>
              <input
                type="checkbox"
                checked={audioAlerts}
                onChange={(e) => setAudioAlerts(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">HSE Supervisor Dispatch Email</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Transmit automated incident notifications to on-duty safety foremen.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Camera Feeds */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white mb-4">
            <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>CCTV &amp; Surveillance Feed Stream</span>
          </div>

          <div className="text-xs space-y-2">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold">
              Default Camera Stream Endpoint (RTSP / HLS)
            </label>
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-hidden ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <p className="text-[11px] text-slate-400">
              Compatible with ONVIF, Hikvision, Dahua, Axis and generic RTSP industrial cameras.
            </p>
          </div>
        </div>

        {/* Model Architecture & Classes Preview */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white mb-3">
            <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Active YOLOv8 Detection Classes ({supportedClasses.length} Classes)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {supportedClasses.map((cls) => {
              const isViol = cls.toLowerCase().startsWith('no-');
              return (
                <span
                  key={cls}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    isViol
                      ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {cls}
                </span>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Settings applied successfully!</span>
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
}
