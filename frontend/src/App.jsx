import React, { useState, useEffect, useRef } from 'react';
import { Navbar, ResultsViewer, SafeSightIcon } from './components';
import { DashboardPage, UploadPage, HistoryPage, AboutPage, LoginPage, DocumentIntelligencePage } from './pages';
import { fetchHealth, fetchJobs, fetchJobDetail, deleteJob, logoutUser } from './services/api';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { playSound, isSoundEnabled } from './utils/soundEffects';

const getInitialTab = () => {
  try {
    const savedUser = localStorage.getItem('safesight_user');
    // If not logged in, enforce login page
    if (!savedUser) {
      return 'login';
    }
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const target = path || hash;
    if (target === 'login' || target === 'signin' || target === 'auth') return 'login';
    if (['dashboard', 'upload', 'results', 'history', 'about', 'docs', 'document-intelligence'].includes(target)) {
      return target === 'document-intelligence' ? 'docs' : target;
    }
  } catch (e) {}
  return 'dashboard';
};

export default function App() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [healthData, setHealthData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated user state (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safesight_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  // URL synchronization helper
  const navigateToTab = (tab) => {
    if (!currentUser && tab !== 'login') {
      setActiveTab('login');
      return;
    }
    setActiveTab(tab);
    if (tab !== 'results') setSelectedJob(null);
    try {
      const newPath = tab === 'dashboard' ? '/' : `/${tab}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    } catch (e) {}
  };

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

  // Handle browser back/forward and hash navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const tab = getInitialTab();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    if (type === 'error') playSound('alert');
    else playSound('success');

    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Login handler
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('safesight_user', JSON.stringify(user));
      if (token) localStorage.setItem('safesight_token', token);
    } catch (e) {}
    setActiveTab('dashboard');
    try {
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
    } catch (e) {}
    showToast(`Access granted! Welcome, ${user.name || user.email}.`, 'success');
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {}
    setCurrentUser(null);
    try {
      localStorage.removeItem('safesight_user');
      localStorage.removeItem('safesight_token');
    } catch (e) {}
    setActiveTab('login');
    try {
      if (window.location.pathname !== '/login') {
        window.history.pushState(null, '', '/login');
      }
    } catch (e) {}
    showToast('Signed out of SafeSight operations terminal.', 'success');
  };

  // Keyboard navigation shortcuts (active only when authenticated)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (!currentUser) return;

      if (e.key === '1') {
        playSound('click');
        navigateToTab('dashboard');
      } else if (e.key === '2') {
        playSound('click');
        navigateToTab('upload');
      } else if (e.key === '3') {
        playSound('click');
        navigateToTab('history');
      } else if (e.key === '4') {
        playSound('click');
        navigateToTab('about');
      } else if (e.key === '5') {
        playSound('click');
        navigateToTab('docs');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // Load backend health and jobs list on startup (when authenticated)
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
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  // When on results tab without selectedJob, auto-load the latest inspection record
  useEffect(() => {
    if (activeTab === 'results' && !selectedJob && jobs.length > 0) {
      const latest = jobs[0];
      if (latest?.id) {
        fetchJobDetail(latest.id)
          .then(detail => setSelectedJob(detail))
          .catch(() => setSelectedJob(latest));
      }
    }
  }, [activeTab, selectedJob, jobs]);

  // Poll for background video processing jobs (when authenticated)
  useEffect(() => {
    if (!currentUser) return;

    const hasProcessingJobs = jobs.some(
      j => j.processing_status === 'Processing' || j.processing_status === 'Uploaded'
    );
    const selectedIsProcessing = selectedJob && (selectedJob.processing_status === 'Processing' || selectedJob.processing_status === 'Uploaded');

    if (hasProcessingJobs || selectedIsProcessing) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const updatedJobs = await fetchJobs();
          setJobs(updatedJobs);

          if (selectedJob) {
            const currentUpdated = updatedJobs.find(j => j.id === selectedJob.id);
            if (currentUpdated) {
              // If status changed to Completed or detection_results are missing, fetch full detail
              if (currentUpdated.processing_status === 'Completed' && (selectedJob.processing_status !== 'Completed' || !selectedJob.detection_results)) {
                const fullDetail = await fetchJobDetail(currentUpdated.id);
                setSelectedJob(fullDetail);
                showToast(`Video analysis for "${fullDetail.original_filename}" completed!`, 'success');
              } else if (currentUpdated.processing_status !== selectedJob.processing_status) {
                setSelectedJob(currentUpdated);
              }
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobs, selectedJob, currentUser]);

  // Handle analysis completed
  const handleAnalysisComplete = async (newJob) => {
    if (newJob.processing_status === 'Completed') {
      setSelectedJob(newJob);
      navigateToTab('results');
      setJobs(prev => [newJob, ...prev.filter(j => j.id !== newJob.id)]);
      showToast(`Inspection completed for "${newJob.original_filename}"!`, 'success');
    } else {
      // For video still processing in background
      setSelectedJob(newJob);
      navigateToTab('results');
      setJobs(prev => [newJob, ...prev.filter(j => j.id !== newJob.id)]);
      showToast(`Video uploaded! SafeSight YOLOv8 engine is analyzing frames...`, 'success');
    }
  };

  // View job result
  const handleViewJob = async (job) => {
    try {
      const fullDetail = await fetchJobDetail(job.id);
      setSelectedJob(fullDetail);
      navigateToTab('results');
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
        navigateToTab('dashboard');
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
      {/* Top Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={navigateToTab} 
        healthData={healthData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        soundActive={soundActive}
        setSoundActive={setSoundActive}
        onLaunchDemo={() => navigateToTab('upload')}
        currentUser={currentUser}
        onLogout={handleLogout}
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
              className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(!currentUser || activeTab === 'login') ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            darkMode={darkMode}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                jobs={jobs}
                healthData={healthData}
                onStartNewAnalysis={() => navigateToTab('upload')}
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
                onBackToDashboard={() => navigateToTab('dashboard')}
                onNewAnalysis={() => {
                  setSelectedJob(null);
                  navigateToTab('upload');
                }}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'history' && (
              <HistoryPage
                jobs={jobs}
                onViewJob={handleViewJob}
                onDeleteJob={handleDeleteJob}
                onStartNewAnalysis={() => navigateToTab('upload')}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'docs' && (
              <DocumentIntelligencePage darkMode={darkMode} />
            )}

            {activeTab === 'about' && (
              <AboutPage healthData={healthData} darkMode={darkMode} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t transition-colors duration-300 bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 mt-auto py-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div className="flex items-center space-x-2.5">
            <SafeSightIcon className="w-6 h-6 shrink-0" />
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              <span className="text-orange-500 dark:text-orange-400">SafeSight</span>
              <span className="text-teal-600 dark:text-teal-400">.AI</span> Operations
            </span>
            <span>&bull;</span>
            <span>Workplace Safety & PPE Intelligence Engine</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            {currentUser ? (
              <>
                <span className="flex items-center space-x-1 text-teal-600 dark:text-teal-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>FastAPI + YOLOv8 Active</span>
                </span>
                <span>&bull;</span>
                <span className="hidden sm:inline text-slate-400">Shortcuts: [1] Hub [2] Scan [3] Log [4] Arch [5] Docs</span>
              </>
            ) : (
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Security Terminal &bull; Authentication Required</span>
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
