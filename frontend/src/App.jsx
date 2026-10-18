import React, { useState, useEffect, useRef } from 'react';
import { Navbar, ResultsViewer } from './components';
import { DashboardPage, UploadPage, HistoryPage, AboutPage } from './pages';
import { fetchHealth, fetchJobs, fetchJobDetail, deleteJob } from './services/api';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { playSound, isSoundEnabled } from './utils/soundEffects';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'upload', 'results', 'history', 'about'
  const [healthData, setHealthData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  
  // Theme state (Dark Mode by default for a stunning modern look, persisted in localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('safesight_dark_mode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());

  const pollIntervalRef = useRef(null);

  // Sync dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('safesight_dark_mode', JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    if (type === 'error') playSound('alert');
    else playSound('success');

    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.key === '1') {
        playSound('click');
        setActiveTab('dashboard');
      } else if (e.key === '2') {
        playSound('click');
        setActiveTab('upload');
      } else if (e.key === '3') {
        playSound('click');
        setActiveTab('history');
      } else if (e.key === '4') {
        playSound('click');
        setActiveTab('about');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load backend health and jobs list on startup
  const refreshData = async () => {
    try {
      const [health, jobsList] = await Promise.all([
        fetchHealth().catch(err => {
          console.warn("Backend health check warning:", err);
          return { status: 'offline', model_loaded: false, supported_classes: [] };
        }),
        fetchJobs().catch(err => {
          console.warn("Fetch jobs warning:", err);
          return [];
        })
      ]);
      setHealthData(health);
      setJobs(jobsList);
    } catch (err) {
      console.error("Data refresh failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Poll for background video processing jobs
  useEffect(() => {
    const hasProcessingJobs = jobs.some(
      j => j.processing_status === 'Processing' || j.processing_status === 'Uploaded'
    );

    if (hasProcessingJobs) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const updatedJobs = await fetchJobs();
          setJobs(updatedJobs);

          if (selectedJob && (selectedJob.processing_status === 'Processing' || selectedJob.processing_status === 'Uploaded')) {
            const currentUpdated = updatedJobs.find(j => j.id === selectedJob.id);
            if (currentUpdated && currentUpdated.processing_status !== selectedJob.processing_status) {
              setSelectedJob(currentUpdated);
              showToast(`Video analysis for "${currentUpdated.original_filename}" completed!`, 'success');
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2500);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobs, selectedJob]);

  // Handle analysis completed
  const handleAnalysisComplete = (newJob) => {
    setSelectedJob(newJob);
    setActiveTab('results');
    setJobs(prev => [newJob, ...prev.filter(j => j.id !== newJob.id)]);
    showToast(`Inspection completed for "${newJob.original_filename}"!`, 'success');
  };

  // View job result
  const handleViewJob = async (job) => {
    try {
      const fullDetail = await fetchJobDetail(job.id);
      setSelectedJob(fullDetail);
      setActiveTab('results');
    } catch (err) {
      showToast(err.message || 'Could not load job details.', 'error');
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    const confirmed = window.confirm("Are you sure you want to delete this inspection record and its files?");
    if (!confirmed) return;

    try {
      await deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(null);
        setActiveTab('dashboard');
      }
      showToast("Record and associated files deleted safely.", 'success');
    } catch (err) {
      showToast(err.message || "Failed to delete record.", 'error');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'results') setSelectedJob(null);
        }} 
        healthData={healthData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        soundActive={soundActive}
        setSoundActive={setSoundActive}
        onLaunchDemo={() => setActiveTab('upload')}
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 transition-all transform animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            jobs={jobs}
            healthData={healthData}
            onStartNewAnalysis={() => setActiveTab('upload')}
            onViewJob={handleViewJob}
            onDeleteJob={handleDeleteJob}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'upload' && (
          <UploadPage
            healthData={healthData}
            onAnalysisComplete={handleAnalysisComplete}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'results' && (
          <ResultsViewer
            job={selectedJob}
            onBackToDashboard={() => setActiveTab('dashboard')}
            onNewAnalysis={() => {
              setSelectedJob(null);
              setActiveTab('upload');
            }}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            jobs={jobs}
            onViewJob={handleViewJob}
            onDeleteJob={handleDeleteJob}
            onStartNewAnalysis={() => setActiveTab('upload')}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage healthData={healthData} darkMode={darkMode} />
        )}
      </main>

      {/* High-Tech Footer with Telemetry */}
      <footer className="border-t transition-colors duration-300 bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 mt-auto py-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">SafeSight AI Operations</span>
            <span>&bull;</span>
            <span>Workplace Safety & PPE Intelligence Engine</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="flex items-center space-x-1 text-teal-600 dark:text-teal-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>FastAPI + YOLOv8 Active</span>
            </span>
            <span>&bull;</span>
            <span className="hidden sm:inline text-slate-400">Shortcuts: [1] Hub [2] Scan [3] Log</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
