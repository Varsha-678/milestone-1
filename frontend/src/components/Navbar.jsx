import React from 'react';
import { ShieldCheck, HardHat, AlertTriangle, LayoutDashboard, UploadCloud, History, Info } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthData }) {
  const isHealthy = healthData && healthData.status === 'healthy';
  const isModelReady = healthData && healthData.model_loaded;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">SafeSight</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                  AI PPE
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent Workplace Safety Analyzer</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Analyze</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'about'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">About</span>
            </button>
          </nav>

          {/* Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2">
            {isHealthy && isModelReady ? (
              <div className="flex items-center space-x-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>YOLOv8 Active ({healthData.supported_classes?.length || 0} classes)</span>
              </div>
            ) : isHealthy && !isModelReady ? (
              <div className="flex items-center space-x-2 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Model Offline</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-medium text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
