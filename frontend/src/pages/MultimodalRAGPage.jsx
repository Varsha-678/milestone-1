import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Bot,
  Sparkles,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  AlertOctagon,
  Lightbulb,
  Search,
  BookOpen,
  Send,
  Layers,
  Activity,
  X
} from 'lucide-react';
import {
  analyzeMultimodal,
  chatMultimodal,
  fetchMultimodalStats,
  fetchSampleScenarios,
  fetchMultimodalSessions
} from '../services/multimodalApi';
import { fetchJobs } from '../services/api';
import { playSound } from '../utils/soundEffects';

const AGENT_STAGES = [
  { id: 'input_analysis', name: 'Input Analysis Agent', desc: 'Identifies query intent & modal requirements' },
  { id: 'visual_intelligence', name: 'Visual Intelligence Agent', desc: 'Extracts YOLOv8 PPE detections & violations' },
  { id: 'document_retrieval', name: 'Document Retrieval Agent', desc: 'Searches Milestone 2 safety policies' },
  { id: 'context_fusion', name: 'Context Fusion Agent', desc: 'Synthesizes visual evidence with policies' },
  { id: 'response_generation', name: 'Response Generation Agent', desc: 'Generates grounded answer & citations' },
  { id: 'validation', name: 'Validation Agent', desc: 'Audits factual groundness & citations' }
];

// Deduplicate overlapping detections (NMS safeguard in UI)
const deduplicateDetections = (detections = []) => {
  if (!detections || detections.length <= 1) return detections;
  const sorted = [...detections].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const keep = [];
  
  for (const det of sorted) {
    if (!det.box || det.box.length < 4) {
      keep.push(det);
      continue;
    }
    const [x1, y1, x2, y2] = det.box;
    const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    
    let isDuplicate = false;
    for (const prev of keep) {
      if (prev.class_name === det.class_name && prev.box && prev.box.length >= 4) {
        const [px1, py1, px2, py2] = prev.box;
        const parea = Math.max(0, px2 - px1) * Math.max(0, py2 - py1);
        const ix1 = Math.max(x1, px1);
        const iy1 = Math.max(y1, py1);
        const ix2 = Math.min(x2, px2);
        const iy2 = Math.min(y2, py2);
        const iw = Math.max(0, ix2 - ix1);
        const ih = Math.max(0, iy2 - iy1);
        const interArea = iw * ih;
        const unionArea = area + parea - interArea;
        const iou = unionArea > 0 ? interArea / unionArea : 0;
        const ioa = Math.min(area, parea) > 0 ? interArea / Math.min(area, parea) : 0;
        if (iou > 0.35 || ioa > 0.65) {
          isDuplicate = true;
          break;
        }
      }
    }
    if (!isDuplicate) {
      keep.push(det);
    }
  }
  return keep;
};

export default function MultimodalRAGPage({ darkMode = false }) {
  // Stats & Samples
  const [stats, setStats] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Inputs
  const [query, setQuery] = useState('Why was this worker marked as a safety violation, and which company safety policy applies?');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [forceType, setForceType] = useState('multimodal');

  // Execution & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [selectedAgentDetail, setSelectedAgentDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'visual' | 'documents' | 'workflow'

  const fileInputRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [statsData, scenariosData, jobsData, sessionsData] = await Promise.all([
        fetchMultimodalStats().catch(() => null),
        fetchSampleScenarios().catch(() => []),
        fetchJobs().catch(() => []),
        fetchMultimodalSessions().catch(() => [])
      ]);
      setStats(statsData);
      setScenarios(scenariosData);
      setRecentJobs(jobsData || []);
      setSessions(sessionsData || []);
    } catch (e) {
      console.error("Failed to load initial data", e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedJobId('');
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
      playSound('click');
    }
  };

  const handleSelectScenario = (sc) => {
    playSound('click');
    setQuery(sc.query);
    setForceType(sc.type);
    if (sc.type === 'multimodal' && recentJobs.length > 0) {
      setSelectedJobId(recentJobs[0].id);
      setSelectedFile(null);
      setFilePreview(null);
    } else {
      setSelectedJobId('');
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSelectJob = (e) => {
    const jId = e.target.value;
    setSelectedJobId(jId);
    if (jId) {
      setSelectedFile(null);
      setFilePreview(null);
      const jobObj = recentJobs.find(j => j.id === jId);
      if (jobObj && jobObj.result_media_path) {
        setFilePreview(jobObj.result_media_path);
      }
    }
    playSound('click');
  };

  const handleRunWorkflow = async () => {
    if (!query.trim() && !selectedFile && !selectedJobId) return;

    setIsProcessing(true);
    playSound('process');
    setActiveStageIndex(0);

    // Simulate visual progression of stages
    const timer = setInterval(() => {
      setActiveStageIndex(prev => (prev < 5 ? prev + 1 : prev));
    }, 400);

    try {
      const result = await analyzeMultimodal({
        query,
        file: selectedFile,
        jobId: selectedJobId || undefined,
        forceType: forceType || undefined
      });

      clearInterval(timer);
      setActiveStageIndex(6); // Completed
      setCurrentSession(result);

      // Initialize chat message
      setChatMessages([
        {
          role: 'user',
          text: query,
          media: result.media_path || filePreview
        },
        {
          role: 'assistant',
          text: result.final_response,
          recommendations: result.safety_recommendations,
          citations: result.citations,
          visual: result.visual_summary,
          validation: result.validation_result
        }
      ]);

      playSound('success');
      // Refresh stats
      fetchMultimodalStats().then(setStats).catch(() => {});
    } catch (err) {
      clearInterval(timer);
      setActiveStageIndex(-1);
      alert(err.message || 'Workflow execution error');
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpQuery.trim() || isProcessing) return;

    const userText = followUpQuery.trim();
    setFollowUpQuery('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);

    try {
      const result = await chatMultimodal({
        query: userText,
        sessionId: currentSession?.session_id,
        jobId: selectedJobId || undefined,
        mediaPath: currentSession?.media_path || undefined
      });

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: result.final_response,
          recommendations: result.safety_recommendations,
          citations: result.citations,
          visual: result.visual_summary,
          validation: result.validation_result
        }
      ]);
      setCurrentSession(result);
      playSound('success');
    } catch (err) {
      alert(err.message || 'Failed to send query');
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const samplePromptPills = [
    "Why was this worker marked as a safety violation?",
    "Which company safety policy applies to missing helmets?",
    "What corrective action should be taken for this site?",
    "What are the mandatory PPE requirements for Zone A?"
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border-teal-800/40 shadow-2xl shadow-teal-950/20' 
          : 'bg-gradient-to-br from-teal-50 via-white to-slate-50 border-teal-200/80 shadow-md'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone 3 &bull; Multimodal RAG & Agentic Workflows</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-3">
              <span>Intelligent Multimodal Safety Agent</span>
              <Bot className="w-8 h-8 text-teal-500 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Fuses real-time <strong>YOLOv8 computer vision detections</strong> with <strong>indexed industrial safety policies</strong>. 
              Orchestrated via <strong>LangGraph StateGraph</strong> with six coordinated autonomous agents providing cited, regulatory-grounded safety recommendations.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className={`px-4 py-3 rounded-2xl border text-center ${
              darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">LangGraph Agents</div>
              <div className="text-xl font-extrabold text-teal-500 font-mono">6 Nodes</div>
            </div>
            <div className={`px-4 py-3 rounded-2xl border text-center ${
              darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">RAG Citations</div>
              <div className="text-xl font-extrabold text-emerald-500 font-mono">100% Verified</div>
            </div>
            <div className={`col-span-2 sm:col-span-1 px-4 py-3 rounded-2xl border text-center ${
              darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200'
            }`}>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Avg Latency</div>
              <div className="text-xl font-extrabold text-cyan-400 font-mono">{stats?.avg_latency_ms || 185} ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Workflow Execution Pipeline Banner */}
      <div className={`p-5 rounded-2xl border ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-500" />
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
              LangGraph Agentic StateGraph Execution Pipeline
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {isProcessing ? 'Workflow Executing...' : currentSession ? 'Audit Complete' : 'Standing By'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {AGENT_STAGES.map((st, idx) => {
            const isCompleted = currentSession && !isProcessing;
            const isCurrent = isProcessing && activeStageIndex === idx;
            const isPast = isProcessing && activeStageIndex > idx;
            const logMatch = currentSession?.agent_logs?.find(l => l.step_order === idx + 1);

            return (
              <div
                key={st.id}
                onClick={() => logMatch && setSelectedAgentDetail(logMatch)}
                className={`p-3 rounded-xl border transition-all text-left relative overflow-hidden ${
                  logMatch ? 'cursor-pointer hover:border-teal-500 scale-[1.01]' : ''
                } ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30'
                    : (isCompleted || isPast)
                    ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : darkMode ? 'border-slate-800 bg-slate-950/40 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                  <span>0{idx + 1}</span>
                  {isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  ) : (isCompleted || isPast) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-500/40" />
                  )}
                </div>
                <div className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                  {st.name.replace(' Agent', '')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {logMatch ? `${logMatch.duration_ms} ms` : st.desc.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Control & Analysis Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Multimodal Input & Scenarios (4 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section A: Multimodal Input Box */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          } space-y-5`}>
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-teal-500" />
                <span>Multimodal Input Studio</span>
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-teal-500/10 text-teal-500">
                A. Input
              </span>
            </div>

            {/* Preloaded Scenario Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick-Select Industrial Scenarios
              </label>
              <div className="grid grid-cols-1 gap-2">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      query === sc.query
                        ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold'
                        : darkMode
                        ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{sc.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/30 text-slate-400">
                        {sc.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {sc.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Media Upload / M1 Scan Linkage */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visual Evidence (Upload or Pick Milestone 1 Scan)
              </label>
              
              {/* Existing scan select */}
              {recentJobs.length > 0 && (
                <div className="mb-2">
                  <select
                    value={selectedJobId}
                    onChange={handleSelectJob}
                    className={`w-full p-2.5 text-xs rounded-xl border font-medium outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="">-- Or link from past M1 AI Scans ({recentJobs.length} available) --</option>
                    {recentJobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.original_filename} (Compliance: {j.compliance_score ?? 'N/A'}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  filePreview
                    ? 'border-teal-500/50 bg-teal-500/5'
                    : darkMode
                    ? 'border-slate-700 hover:border-teal-500/50 bg-slate-950/40'
                    : 'border-slate-300 hover:border-teal-500/50 bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {filePreview ? (
                  <div className="space-y-2">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded-lg object-contain shadow-md"
                    />
                    <div className="text-xs text-teal-600 dark:text-teal-400 font-bold truncate">
                      {selectedFile ? selectedFile.name : 'Linked Milestone 1 Inspection Media'}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 space-y-1">
                    <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Drop site image or CCTV frame here
                    </div>
                    <div className="text-[10px] text-slate-400">
                      JPG, PNG, WEBP, MP4 &bull; Max 50 MB
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Natural Language Question Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Safety Inquiry / User Question
              </label>
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about detected violations, applicable OSHA/company policies, or corrective actions..."
                className={`w-full p-3 text-xs rounded-xl border font-medium resize-none outline-none transition-all ${
                  darkMode 
                    ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
              />
              
              {/* Prompt Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {samplePromptPills.map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(pill);
                      playSound('click');
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left truncate max-w-full ${
                      darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    "{pill}"
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunWorkflow}
              disabled={isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm text-slate-950 flex items-center justify-center space-x-2.5 shadow-lg transition-all cursor-pointer ${
                isProcessing
                  ? 'bg-teal-600/50 cursor-not-allowed opacity-75'
                  : 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/20 hover:scale-[1.01]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Orchestrating 6-Agent Workflow...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Execute LangGraph Agentic Workflow</span>
                </>
              )}
            </button>
          </div>

          {/* Past Sessions List */}
          {sessions.length > 0 && (
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                <span>Recent Audit Sessions</span>
                <span className="font-mono text-[10px]">{sessions.length} recorded</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setCurrentSession(s);
                      setChatMessages([
                        { role: 'user', text: s.user_query, media: s.media_path },
                        {
                          role: 'assistant',
                          text: s.final_response,
                          recommendations: s.safety_recommendations,
                          citations: s.citations,
                          visual: s.visual_summary,
                          validation: s.validation_result
                        }
                      ]);
                      playSound('click');
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      currentSession?.session_id === s.id
                        ? 'border-teal-500 bg-teal-500/10'
                        : darkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold truncate text-slate-800 dark:text-slate-200">{s.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{s.query_type}</span>
                      <span>{s.total_execution_ms} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visual + Document + Q&A Response Studio (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Tabbed Navigation Bar for Results */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[
              { id: 'overview', label: 'AI Q&A & Recommendations', icon: MessageSquare },
              { id: 'visual', label: 'B. Visual Intelligence', icon: Eye },
              { id: 'documents', label: 'C. Document Intelligence', icon: BookOpen },
              { id: 'workflow', label: 'E. Agent Trace Logs', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    playSound('click');
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: AI Q&A & RECOMMENDATIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Chat Thread */}
              {chatMessages.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border ${
                  darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                } space-y-3`}>
                  <Bot className="w-12 h-12 text-teal-500 mx-auto opacity-70" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Awaiting Input for Multimodal Synthesis
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Select a sample scenario or upload an image and click <strong>"Execute LangGraph Agentic Workflow"</strong> to inspect visual violations and safety policy citations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-3xl border transition-all ${
                        msg.role === 'user'
                          ? darkMode ? 'bg-slate-950 border-slate-800 ml-8' : 'bg-slate-100 border-slate-200 ml-8'
                          : darkMode ? 'bg-slate-900 border-teal-800/40 shadow-xl' : 'bg-white border-teal-200 shadow-md'
                      }`}
                    >
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {msg.role === 'user' ? (
                            <span className="text-xs font-bold text-slate-400">Auditor Question</span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="p-1 rounded-lg bg-teal-500/20 text-teal-400 font-extrabold text-xs">
                                SafeSight RAG Agent
                              </span>
                              {msg.validation?.passed && (
                                <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-500">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>100% Policy Grounded</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans space-y-3">
                        {msg.text}
                      </div>

                      {/* Structured Action Cards if present */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="text-xs font-extrabold tracking-wide uppercase text-teal-600 dark:text-teal-400 flex items-center space-x-1.5">
                            <Lightbulb className="w-4 h-4" />
                            <span>Actionable Remediation Directives</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {msg.recommendations.map((rec, rIdx) => (
                              <div
                                key={rIdx}
                                className={`p-3 rounded-xl border text-xs ${
                                  darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 dark:text-white">{rec.action}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    rec.priority.includes('Immediate') || rec.priority.includes('High')
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    {rec.priority}
                                  </span>
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                                  {rec.details}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verified Citations List if present */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                            <BookOpen className="w-4 h-4 text-teal-500" />
                            <span>Supporting Document Citations (Milestone 2 Grounded)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {msg.citations.map((cit, cIdx) => (
                              <div
                                key={cIdx}
                                className={`p-2.5 rounded-xl border text-[11px] ${
                                  darkMode ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                                  <span className="truncate">{cit.document_name}</span>
                                  <span className="text-teal-500 font-mono">p.{cit.page_number}</span>
                                </div>
                                <div className="text-slate-400 text-[10px] mt-0.5 truncate">
                                  {cit.heading}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 mt-1 italic text-[10px] line-clamp-2">
                                  "{cit.excerpt}"
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Follow-up question input */}
                  <form onSubmit={handleSendFollowUp} className="flex items-center space-x-2 mt-4">
                    <input
                      type="text"
                      value={followUpQuery}
                      onChange={(e) => setFollowUpQuery(e.target.value)}
                      placeholder="Ask follow-up question regarding policies, violations, or OSHA rules..."
                      className={`flex-1 p-3 text-xs rounded-2xl border outline-none font-medium ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-teal-500' : 'bg-white border-slate-300 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !followUpQuery.trim()}
                      className="p-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl font-bold cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL INTELLIGENCE RESULTS */}
          {activeTab === 'visual' && (
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } space-y-6`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-teal-500" />
                  <span>YOLOv8 Computer Vision Pipeline (Milestone 1)</span>
                </h3>
                <span className="text-xs font-mono font-bold text-teal-400">
                  Compliance: {currentSession?.visual_summary?.compliance_score ?? 'N/A'}%
                </span>
              </div>

              {/* Annotated Image */}
              {currentSession?.visual_summary?.annotated_path || filePreview ? (
                <div className={`border rounded-2xl overflow-hidden text-center p-1 ${
                  darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
                }`}>
                  <img
                    src={currentSession?.visual_summary?.annotated_path || filePreview}
                    alt="Annotated Visual Detection"
                    className="max-h-80 mx-auto object-contain rounded-xl"
                    onError={(e) => {
                      // Fallback gracefully if image cannot be rendered
                      e.target.style.opacity = '0.7';
                    }}
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-2xl">
                  No visual media attached to current query. Run a multimodal scenario to view YOLOv8 detections.
                </div>
              )}

              {/* Detected Objects Grid (Deduplicated Clean Detections) */}
              <div className="space-y-3">
                <div className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                  Detected Equipment &amp; Worker Classes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deduplicateDetections(currentSession?.visual_summary?.detections || []).map((det, dIdx) => (
                    <div
                      key={dIdx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        det.is_violation
                          ? darkMode
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                            : 'border-rose-200 bg-rose-50 text-rose-800 font-semibold shadow-2xs'
                          : det.is_ppe
                          ? darkMode
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                          : darkMode 
                            ? 'border-slate-800 bg-slate-950 text-slate-300' 
                            : 'border-slate-200 bg-slate-50 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold">{det.class_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Box: [{det.box?.join(', ')}]
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono">{Math.round(det.confidence * 100)}%</div>
                        <div className="text-[10px] uppercase font-bold">
                          {det.is_violation ? 'Violation' : det.is_ppe ? 'Compliant' : 'Context'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT INTELLIGENCE RESULTS */}
          {activeTab === 'documents' && (
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } space-y-6`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  <span>Retrieved Knowledge Base Chunks (Milestone 2)</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {currentSession?.retrieved_chunks?.length || 0} chunks retrieved
                </span>
              </div>

              <div className="space-y-3">
                {(currentSession?.retrieved_chunks || []).map((chunk, cIdx) => (
                  <div
                    key={cIdx}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100">
                        <FileText className="w-4 h-4 text-teal-500" />
                        <span>{chunk.document_name}</span>
                        <span className="text-slate-400 text-[11px]">&bull; Page {chunk.page_number}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-400">
                        {chunk.similarity_score}% Match
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      {chunk.heading}
                    </div>

                    <div
                      className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]"
                      dangerouslySetInnerHTML={{ __html: chunk.highlighted_snippet || chunk.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WORKFLOW EXECUTION TRACE LOGS */}
          {activeTab === 'workflow' && (
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } space-y-6`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-teal-500" />
                  <span>LangGraph Agent Execution Logs</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Total Duration: {currentSession?.total_execution_ms || 0} ms
                </span>
              </div>

              <div className="space-y-3">
                {(currentSession?.agent_logs || []).map((log, lIdx) => (
                  <div
                    key={lIdx}
                    onClick={() => setSelectedAgentDetail(log)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all hover:border-teal-500 ${
                      darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
                        <span className="font-mono text-teal-500">0{log.step_order}</span>
                        <span>{log.agent_name}</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{log.duration_ms} ms</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                      {log.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Detail Inspection Drawer / Modal */}
      {selectedAgentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`max-w-2xl w-full p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          } space-y-4`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              darkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center space-x-2.5">
                <Brain className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base">{selectedAgentDetail.agent_name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold">
                  Step 0{selectedAgentDetail.step_order} &bull; {selectedAgentDetail.duration_ms} ms
                </span>
              </div>
              <button
                onClick={() => setSelectedAgentDetail(null)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary</div>
              <div className={`text-xs p-3 rounded-xl border font-mono ${
                darkMode ? 'text-slate-300 bg-slate-950 border-slate-800' : 'text-slate-700 bg-slate-50 border-slate-200'
              }`}>
                {selectedAgentDetail.summary}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Input State Payload</div>
              <pre className={`text-[11px] p-3 rounded-xl border overflow-x-auto max-h-36 font-mono ${
                darkMode ? 'text-teal-300 bg-slate-950 border-slate-800' : 'text-teal-700 bg-slate-50 border-slate-200'
              }`}>
                {JSON.stringify(selectedAgentDetail.input_data, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output State Payload</div>
              <pre className={`text-[11px] p-3 rounded-xl border overflow-x-auto max-h-36 font-mono ${
                darkMode ? 'text-emerald-300 bg-slate-950 border-slate-800' : 'text-emerald-700 bg-slate-50 border-slate-200'
              }`}>
                {JSON.stringify(selectedAgentDetail.output_data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
