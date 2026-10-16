import React, { useState, useEffect, useRef } from 'react';
import { Navbar, ResultsViewer } from './components';
import { DashboardPage, UploadPage, HistoryPage, AboutPage } from './pages';
import { fetchHealth, fetchJobs, fetchJobDetail, deleteJob } from './services/api';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'upload', 'results', 'history', 'about'
  const [healthData, setHealthData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const pollIntervalRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

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

          // If currently selected job was processing, update its detail
          if (selectedJob && (selectedJob.processing_status === 'Processing' || selectedJob.processing_status === 'Uploaded')) {
            const currentUpdated = updatedJobs.find(j => j.id === selectedJob.id);
            if (currentUpdated && currentUpdated.processing_status !== selectedJob.processing_status) {
              setSelectedJob(currentUpdated);
              showToast(`Analysis for "${currentUpdated.original_filename}" completed!`, 'success');
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'results') setSelectedJob(null);
        }} 
        healthData={healthData} 
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 transition-all transform animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 ml-2"
            >
              <X className="w-3.5 h-3.5" />
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
          />
        )}

        {activeTab === 'upload' && (
          <UploadPage
            healthData={healthData}
            onAnalysisComplete={handleAnalysisComplete}
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
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            jobs={jobs}
            onViewJob={handleViewJob}
            onDeleteJob={handleDeleteJob}
            onStartNewAnalysis={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage healthData={healthData} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-teal-800 text-white flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700">SafeSight AI</span>
            <span>&bull; Workplace Safety & PPE Compliance Analyzer</span>
          </div>
          <div>
            <span>Milestone 1 Project &bull; Built with FastAPI & YOLOv8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
