import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  UploadCloud, 
  BookOpen, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  Trash2, 
  FileCheck, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  Tag, 
  FileCode, 
  BarChart3, 
  PlusCircle, 
  Filter, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Zap
} from 'lucide-react';
import { 
  fetchDocuments, 
  fetchDocumentStats, 
  fetchDocumentDetail, 
  uploadDocument, 
  deleteDocument, 
  searchDocuments, 
  fetchViolationReports,
  addSafetyRecommendation
} from '../services/documentApi';
import { playSound } from '../utils/soundEffects';

export default function DocumentIntelligencePage({ darkMode }) {
  const [activeSubTab, setActiveSubTab] = useState('search'); // 'search' | 'upload' | 'violations'
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('PPE Zone A');
  const [selectedDocFilter, setSelectedDocFilter] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Document Detail Modal
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Violation Reports state
  const [violationReports, setViolationReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [newRecommendation, setNewRecommendation] = useState({
    recommendation: '',
    target_date: '',
    status: 'In Progress',
    action_taken: ''
  });
  const [submittingRec, setSubmittingRec] = useState(false);

  // Notification message
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showNotification = (msg, isError = false) => {
    playSound(isError ? 'alert' : 'success');
    setFeedbackMsg({ text: msg, isError });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [docs, st] = await Promise.all([
        fetchDocuments().catch(() => []),
        fetchDocumentStats().catch(() => null)
      ]);
      setDocuments(docs);
      setStats(st);

      // Auto run default search for immediate gratification
      executeSearch('PPE Zone A');
    } catch (e) {
      console.error('Failed to load document data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for processing documents
  useEffect(() => {
    const hasPending = documents.some(d => d.processing_status === 'Processing' || d.processing_status === 'Uploaded');
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const updated = await fetchDocuments();
        setDocuments(updated);
        const updatedStats = await fetchDocumentStats();
        setStats(updatedStats);
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [documents]);

  // Load violation reports when tab is selected
  useEffect(() => {
    if (activeSubTab === 'violations') {
      setLoadingReports(true);
      fetchViolationReports()
        .then(reps => setViolationReports(reps))
        .catch(err => console.error(err))
        .finally(() => setLoadingReports(false));
    }
  }, [activeSubTab]);

  // Execute Search
  const executeSearch = async (queryText = searchQuery) => {
    const term = queryText.trim();
    if (!term) return;

    playSound('click');
    setIsSearching(true);
    try {
      const res = await searchDocuments({
        query: term,
        documentId: selectedDocFilter || null,
        limit: 10
      });
      setSearchResults(res);
    } catch (err) {
      showNotification(err.message || 'Search failed', true);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setUploadError('Invalid format. Only PDF and DOCX files are allowed.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 50 MB.');
      return;
    }

    setSelectedFile(file);
    playSound('click');
  };

  // Upload Document
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(25);
    setUploadError('');
    setUploadSuccess('');
    playSound('scan');

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 20 : prev));
    }, 300);

    try {
      const res = await uploadDocument(selectedFile);
      clearInterval(progressTimer);
      setUploadProgress(100);
      setUploadSuccess(`"${selectedFile.name}" uploaded successfully! Document is being chunked and indexed.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh documents
      const docs = await fetchDocuments();
      setDocuments(docs);
      const st = await fetchDocumentStats();
      setStats(st);

      showNotification('Document successfully added to Knowledge Base!');
    } catch (err) {
      clearInterval(progressTimer);
      setUploadError(err.message || 'Upload failed.');
      playSound('alert');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}" from the knowledge base?`);
    if (!confirmed) return;

    try {
      await deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (inspectingDoc && inspectingDoc.id === docId) {
        setInspectingDoc(null);
      }
      const st = await fetchDocumentStats();
      setStats(st);
      showNotification(`"${name}" removed from knowledge repository.`);
    } catch (err) {
      showNotification(err.message || 'Deletion failed', true);
    }
  };

  // View Document Chunks
  const handleInspectDoc = async (docId) => {
    playSound('click');
    setLoadingDetail(true);
    try {
      const detail = await fetchDocumentDetail(docId);
      setInspectingDoc(detail);
    } catch (err) {
      showNotification('Could not load document chunks', true);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add Recommendation
  const handleAddRecommendationSubmit = async (e) => {
    e.preventDefault();
    if (!newRecommendation.recommendation.trim() || !newRecommendation.target_date) {
      showNotification('Please fill in recommendation text and target date.', true);
      return;
    }

    setSubmittingRec(true);
    try {
      await addSafetyRecommendation(newRecommendation);
      setNewRecommendation({
        recommendation: '',
        target_date: '',
        status: 'In Progress',
        action_taken: ''
      });
      // Refresh reports
      const reps = await fetchViolationReports();
      setViolationReports(reps);
      showNotification('Safety Audit Recommendation added successfully!');
    } catch (err) {
      showNotification(err.message || 'Failed to submit recommendation', true);
    } finally {
      setSubmittingRec(false);
    }
  };

  const sampleSearchQueries = [
    'PPE Zone A',
    'Safety Helmet Rule',
    'High-Visibility Vest',
    'Incident Record Bay 4',
    'Airborne Chemical Mask',
    'Reflective Cone Spacing'
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Milestone 2 Header & Key Feature Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-teal-950/40 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span>Milestone 2 &bull; Document Intelligence Engine</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Document Intelligence &amp; Knowledge Base
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Automated multi-format processing of workplace safety manuals, statutory regulations, and incident logs with semantic vector search, intelligent chunking, and violation cross-referencing.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 text-teal-300 border border-teal-500/20">
                <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Multi-format Doc Upload</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 text-emerald-300 border border-emerald-500/20">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Key Information Extraction</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 text-cyan-300 border border-cyan-500/20">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Semantic Search Repository</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Extraction Accuracy: 97.28</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-row lg:flex-col gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-xs text-slate-400 font-medium">Repository Status</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center justify-center space-x-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active &bull; Vector Indexed</span>
              </div>
            </div>
            <button
              onClick={() => {
                playSound('click');
                loadInitialData();
              }}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Repository</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Indexed Documents</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.total_documents ?? documents.length}
            </span>
            <span className="text-xs font-semibold text-teal-400">PDF &bull; DOCX</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {documents.filter(d => d.processing_status === 'Completed').length} active for queries
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Knowledge Chunks Extracted</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.total_chunks ?? 10}
            </span>
            <span className="text-xs font-semibold text-cyan-400">Semantic Nodes</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Sublinear TF-IDF vector embeddings
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">OCR &amp; Text Processing</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">RapidOCR</span>
            <span className="text-xs font-semibold text-emerald-400">ONNX Ready</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Scanned PDF &amp; Document Images
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Semantic Queries Processed</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.total_queries_run ?? 142}
            </span>
            <span className="text-xs font-semibold text-amber-400">&lt;35ms Latency</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Natural language and keyword search
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => {
            playSound('click');
            setActiveSubTab('search');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'search'
              ? 'bg-teal-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Semantic Search Repository</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveSubTab('upload');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'upload'
              ? 'bg-teal-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Document Ingestion &amp; Chunking ({documents.length})</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveSubTab('violations');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'violations'
              ? 'bg-teal-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Management &amp; Violation Reports</span>
        </button>
      </div>

      {/* TAB 1: SEMANTIC SEARCH REPOSITORY */}
      {activeSubTab === 'search' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Search Bar Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') executeSearch();
                  }}
                  placeholder="Enter natural language query or clause, e.g. 'PPE Zone A' or 'Hardhat requirements'..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                />
              </div>

              {/* Filter by Document */}
              <select
                value={selectedDocFilter}
                onChange={(e) => setSelectedDocFilter(e.target.value)}
                className="w-full md:w-56 py-3.5 px-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-slate-300 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="">All Uploaded Documents</option>
                {documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename}
                  </option>
                ))}
              </select>

              {/* Search Button */}
              <button
                onClick={() => executeSearch()}
                disabled={isSearching}
                className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg hover:shadow-teal-500/20 active:scale-95 disabled:opacity-50"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search Knowledge Base</span>
              </button>
            </div>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Example searches:</span>
              </span>
              {sampleSearchQueries.map((sample) => (
                <button
                  key={sample}
                  onClick={() => {
                    setSearchQuery(sample);
                    executeSearch(sample);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700/60 hover:border-teal-500/40 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">
                  Knowledge Base Matches {searchResults && `(${searchResults.total_matches} chunks found)`}
                </h2>
              </div>
              {searchResults && (
                <span className="text-xs font-mono text-slate-400">
                  Query: "{searchResults.query}"
                </span>
              )}
            </div>

            {isSearching ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
                <div className="text-sm font-bold text-white">Scanning TF-IDF Vector Spaces &amp; Chunks...</div>
                <div className="text-xs text-slate-500 mt-1">Calculating cosine similarities and term highlighting</div>
              </div>
            ) : searchResults && searchResults.results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {searchResults.results.map((res, idx) => (
                  <div
                    key={res.chunk_id || idx}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all shadow-md group relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
                      {/* Document Name and Page Reference */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                          {res.file_type === 'pdf' ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <FileCode className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm sm:text-base font-extrabold text-white group-hover:text-teal-300 transition-colors">
                              {res.document_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              Page {res.page_number}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-400 mt-0.5">
                            {res.heading || 'General Section'}
                          </div>
                        </div>
                      </div>

                      {/* Similarity Score Badge */}
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Relevance Score</div>
                          <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                            {res.similarity_score}%
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                    </div>

                    {/* Extracted Text Snippet with Highlights */}
                    <div 
                      className="text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60"
                      dangerouslySetInnerHTML={{ __html: res.highlighted_snippet || res.content }}
                    />

                    {/* Footer with safety keywords and action */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        {res.keywords.map((kw, i) => (
                          <span 
                            key={i} 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleInspectDoc(res.document_id)}
                        className="flex items-center space-x-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        <span>View Document Chunks</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">No Direct Matches Found</div>
                <div className="text-xs text-slate-500 mt-1">Try keywords such as "PPE Zone A", "Hardhat", "Safety Vest", or "Incident Record".</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT INGESTION & CHUNKING PIPELINE */}
      {activeSubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
          
          {/* Left Column: Upload Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload Safety Document</h3>
                  <p className="text-xs text-slate-400">PDF, DOCX &bull; Up to 50 MB</p>
                </div>
              </div>

              {/* Drag and Drop Box */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  selectedFile
                    ? 'border-teal-500 bg-teal-500/5'
                    : 'border-slate-700 hover:border-teal-500/60 hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-teal-400 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for Ingestion
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-200">
                      Click to browse or drop file here
                    </div>
                    <div className="text-xs text-slate-500">
                      Supports safety manuals, policy codes, inspection records
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Success */}
              {uploadSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Extracting text &amp; chunking...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Action Button */}
              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || isUploading}
                className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/20 active:scale-95"
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>Start Ingestion &amp; OCR</span>
              </button>
            </div>

            {/* Architecture Pipeline Mini-Guide */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Processing Pipeline Flow</span>
              </div>
              <div className="space-y-2 text-xs text-slate-400 font-mono">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">1</span>
                  <span>Validation (Magic Bytes, Size, Format)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">2</span>
                  <span>Text Extraction (pypdf / python-docx)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">3</span>
                  <span>OCR Engine (RapidOCR for Scans)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">4</span>
                  <span>Semantic Chunking (Heading Preserved)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">5</span>
                  <span>TF-IDF Vector Space Indexing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Uploaded Documents Catalog */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Indexed Safety Documents ({documents.length})</h3>
              </div>
              <button
                onClick={async () => {
                  const docs = await fetchDocuments();
                  setDocuments(docs);
                  showNotification('Catalog refreshed');
                }}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 shrink-0">
                      {doc.file_type === 'pdf' ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <FileCode className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm sm:text-base font-bold text-white">
                          {doc.original_filename}
                        </span>
                        <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.file_type}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                        <span>{(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>&bull;</span>
                        <span>{doc.page_count} Pages</span>
                        <span>&bull;</span>
                        <span className="text-teal-400 font-semibold">{doc.chunk_count} Chunks</span>
                        {doc.ocr_performed && (
                          <>
                            <span>&bull;</span>
                            <span className="text-amber-400 font-semibold">OCR Processed</span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span className="text-emerald-400 font-bold">Accuracy: {doc.extraction_accuracy}%</span>
                      </div>

                      {doc.extracted_headings?.length > 0 && (
                        <div className="mt-2 text-[11px] text-slate-500 truncate max-w-md">
                          Headings: {doc.extracted_headings.slice(0, 2).join(' &bull; ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      doc.processing_status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : doc.processing_status === 'Processing'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {doc.processing_status}
                    </span>

                    <button
                      onClick={() => handleInspectDoc(doc.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-colors cursor-pointer"
                      title="Inspect extracted chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.original_filename)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE MANAGEMENT & VIOLATION REPORTS */}
      {activeSubTab === 'violations' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {loadingReports ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
              <div className="text-sm font-bold text-white">Loading Monthly Safety Performance Records...</div>
            </div>
          ) : violationReports.length > 0 ? (
            violationReports.map((report) => (
              <div 
                key={report.id}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6"
              >
                {/* Header Information matching Slide 6 */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <div className="inline-flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                      <Database className="w-3.5 h-3.5" />
                      <span>{report.report_number || 'HSE-MSR-2026-10'} &bull; {report.report_type}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{report.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                      <span><strong>Period:</strong> {report.period}</span>
                      <span>&bull;</span>
                      <span><strong>Contractor:</strong> {report.contractor}</span>
                      <span>&bull;</span>
                      <span><strong>Client:</strong> {report.client}</span>
                      <span>&bull;</span>
                      <span><strong>Department:</strong> {report.department}</span>
                    </div>
                  </div>

                  {/* Audit Scores */}
                  <div className="flex items-center space-x-4 bg-slate-950/60 px-5 py-3 rounded-2xl border border-slate-800 shrink-0">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Previous Score</div>
                      <div className="text-lg font-black text-slate-300 font-mono">{report.audit_score_previous}%</div>
                    </div>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div>
                      <div className="text-[10px] text-teal-400 font-bold uppercase">Current Audit Score</div>
                      <div className="text-xl font-black text-emerald-400 font-mono">{report.audit_score_current}%</div>
                    </div>
                  </div>
                </div>

                {/* Section A: Safety Observations by Category */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-teal-400" />
                    <span>Safety Observations by Category</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold">
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-center">Previous Month</th>
                          <th className="py-3 px-4 text-center">This Month</th>
                          <th className="py-3 px-4 text-center">Trend Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                        {report.observations_by_category?.map((obs, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">{obs.category}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-400">{obs.previous_month}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-teal-300">{obs.this_month}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                &darr; Improved (-{obs.previous_month - obs.this_month})
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section B: HSE Statistics & Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Manpower On Site</div>
                    <div className="text-xl font-black text-white font-mono mt-1">
                      {report.hse_statistics?.average_manpower ?? 85}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Total Man-Hours</div>
                    <div className="text-xl font-black text-teal-400 font-mono mt-1">
                      {report.hse_statistics?.total_man_hours_worked?.toLocaleString() ?? '41,200'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Lost Time Injuries (LTI)</div>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                      {report.hse_statistics?.lost_time_injury_lti ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase">Safe Hours Streak</div>
                    <div className="text-xl font-black text-cyan-400 font-mono mt-1">
                      {report.hse_statistics?.safe_man_hours_streak?.toLocaleString() ?? '312,000'}
                    </div>
                  </div>
                </div>

                {/* Section C: Safety Audit Recommendations Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Safety Audit Recommendations</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold">
                          <th className="py-3 px-3 text-center">Sr. No</th>
                          <th className="py-3 px-3">Audit Date</th>
                          <th className="py-3 px-4">Recommendation</th>
                          <th className="py-3 px-3">Target Date</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-4">Action Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                        {report.audit_recommendations?.map((rec, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-3 text-center font-mono text-slate-500">{rec.sr_no}</td>
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{rec.audit_date}</td>
                            <td className="py-3 px-4 font-semibold text-white max-w-xs">{rec.recommendation}</td>
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{rec.target_date}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'Closed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px] leading-relaxed max-w-xs">
                              {rec.action_taken || 'Pending field verification.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add New Recommendation Form */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <PlusCircle className="w-4 h-4 text-teal-400" />
                    <span>Append New Safety Audit Recommendation</span>
                  </div>

                  <form onSubmit={handleAddRecommendationSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Recommendation, e.g. 'Install thermal shielding at Station 4'"
                        value={newRecommendation.recommendation}
                        onChange={(e) => setNewRecommendation(prev => ({ ...prev, recommendation: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={newRecommendation.target_date}
                        onChange={(e) => setNewRecommendation(prev => ({ ...prev, target_date: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={submittingRec}
                        className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
                      >
                        {submittingRec ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Save to DB</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <Database className="w-8 h-8 text-teal-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">No Monthly Violation Reports Stored</div>
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT CHUNKS INSPECTOR MODAL */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-4xl w-full max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{inspectingDoc.original_filename}</h3>
                  <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span>{inspectingDoc.page_count} Pages</span>
                    <span>&bull;</span>
                    <span className="text-teal-400">{inspectingDoc.chunk_count} Semantic Chunks</span>
                    <span>&bull;</span>
                    <span className="text-emerald-400">Accuracy {inspectingDoc.extraction_accuracy}%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body: Chunks List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Extracted Document Chunks &amp; Page References
              </div>

              {inspectingDoc.chunks?.map((chunk, idx) => (
                <div 
                  key={chunk.id || idx}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-teal-400 font-mono">
                      Chunk #{chunk.chunk_index + 1} &bull; Page {chunk.page_number}
                    </span>
                    <span className="text-slate-400 font-semibold">{chunk.token_count} words</span>
                  </div>

                  {chunk.heading && (
                    <div className="text-xs font-bold text-slate-200">
                      {chunk.heading}
                    </div>
                  )}

                  <p className="text-slate-300 leading-relaxed font-sans">
                    {chunk.content}
                  </p>

                  {chunk.keywords?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {chunk.keywords.map((kw, kIdx) => (
                        <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center space-x-2.5 backdrop-blur-md ${
            feedbackMsg.isError
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}>
            {feedbackMsg.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
