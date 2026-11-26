import React from 'react';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  BarChart3, 
  Bot, 
  Cpu, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  X,
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  Settings as SettingsIcon,
  FileSpreadsheet,
  UserCheck,
  LogOut
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import SafeSightLogo, { SafeSightIcon } from './SafeSightLogo';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen,
  healthData,
  darkMode = false,
  currentUser,
  onLaunchDemo,
  onLogout
}) {
  const isHealthy = healthData && healthData.status === 'healthy';
  const supportedCount = healthData?.supported_classes?.length || 10;

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      shortLabel: 'Overview', 
      icon: LayoutDashboard,
      badge: 'Hub',
      description: 'Safety overview & KPI telemetry'
    },
    { 
      id: 'image-detection', 
      label: 'Image Detection', 
      shortLabel: 'Image Scan', 
      icon: ImageIcon,
      badge: 'M1',
      description: 'Single image & photo PPE audit'
    },
    { 
      id: 'video-detection', 
      label: 'Video Detection', 
      shortLabel: 'Video Scan', 
      icon: Video,
      badge: 'M1',
      description: 'CCTV footage & keyframe analysis'
    },
    { 
      id: 'docs', 
      label: 'Documents', 
      shortLabel: 'Doc AI', 
      icon: FileText,
      badge: 'M2',
      description: 'Policy repository, OCR & semantic search'
    },
    { 
      id: 'violations', 
      label: 'Violation Monitoring', 
      shortLabel: 'Violations', 
      icon: AlertTriangle,
      badge: 'M4 Live',
      description: 'Active PPE infractions & audit trail'
    },
    { 
      id: 'reports', 
      label: 'Reports & Export', 
      shortLabel: 'Reports', 
      icon: FileSpreadsheet,
      badge: 'M4',
      description: 'PDF & Excel compliance report exports'
    },
    { 
      id: 'multimodal', 
      label: 'Multimodal RAG', 
      shortLabel: 'M3 RAG', 
      icon: Bot,
      badge: 'M3 Agent',
      description: '6-Agent visual & policy reasoning'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      shortLabel: 'Config', 
      icon: SettingsIcon,
      badge: null,
      description: 'Thresholds, feeds & system configuration'
    },
    { 
      id: 'about', 
      label: 'Architecture', 
      shortLabel: 'Pipeline', 
      icon: Cpu,
      badge: 'Pipeline',
      description: 'YOLOv8 model & tech stack info'
    }
  ];

  const handleSelect = (tabId) => {
    playSound('click');
    setActiveTab(tabId);
    if (isMobileOpen && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none bg-[#090e1a] text-slate-200 overflow-hidden">
      
      {/* Brand Header */}
      <div className="px-4 py-3 border-b border-[#172138] flex items-center justify-between bg-[#0a101f] shrink-0">
        {!isCollapsed ? (
          <div 
            onClick={() => handleSelect('dashboard')}
            className="cursor-pointer group flex items-center space-x-2"
          >
            <SafeSightLogo 
              size="sm"
              brandName="SafeSight"
              brandSuffix=".AI"
              subtitleText="Workplace Safety Monitoring"
              badgeText={null}
            />
          </div>
        ) : (
          <div 
            onClick={() => handleSelect('dashboard')}
            className="mx-auto cursor-pointer p-1"
            title="SafeSight AI • Safety Monitoring"
          >
            <SafeSightIcon className="w-8 h-8" />
          </div>
        )}

        {/* Mobile Close Button */}
        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links (Compact & perfectly scrollable if viewport is tiny) */}
      <div className="flex-1 py-2 px-2.5 space-y-0.5 overflow-y-auto no-scrollbar">
        {!isCollapsed && (
          <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Workplace Intelligence
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || 
            (item.id === 'image-detection' && activeTab === 'upload') ||
            (item.id === 'history' && activeTab === 'reports');

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
              className={`w-full flex items-center transition-all duration-150 rounded-xl cursor-pointer group text-left ${
                isCollapsed 
                  ? 'justify-center p-2 my-0.5' 
                  : 'justify-between px-2.5 py-1.5'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-[#131d36]'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#141e34] text-slate-400 group-hover:text-blue-400 group-hover:bg-[#192644]'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {!isCollapsed && (
                  <div className="truncate">
                    <div className="text-xs tracking-tight truncate font-semibold">
                      {item.label}
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badge === 'M4 Live'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-[#15213d] text-slate-400 border border-[#20315a]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Demo Launch Shortcut - Compact One-Click CTA */}
      {!isCollapsed && onLaunchDemo && (
        <div className="px-2.5 py-2 shrink-0 border-t border-[#172138]">
          <button
            onClick={() => {
              playSound('click');
              onLaunchDemo();
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Run Test Inspection</span>
          </button>
        </div>
      )}

      {/* User Profile Section at Bottom with One-Click Logout */}
      <div className="p-2.5 border-t border-[#172138] bg-[#0a101f] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                {currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-white truncate">
                    {currentUser?.name || 'Admin'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="System Online"></span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser?.role || 'Safety Director'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {/* Direct Logout Button */}
              {onLogout && (
                <button
                  onClick={() => {
                    playSound('click');
                    onLogout();
                  }}
                  className="px-2 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="Sign Out of SafeSight"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}

              {/* Collapse toggle */}
              <button
                onClick={() => {
                  playSound('click');
                  setIsCollapsed(true);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#141e34] transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-[10px]" title={currentUser?.name || 'Admin'}>
              {currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            {onLogout && (
              <button
                onClick={() => {
                  playSound('click');
                  onLogout();
                }}
                className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                playSound('click');
                setIsCollapsed(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#141e34] cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Deep Midnight Navy Sidebar: FIXED POSITION (NEVER SCROLLS AWAY) */}
      <aside className={`hidden md:block shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className={`fixed top-16 left-0 bottom-0 z-30 transition-all duration-300 border-r border-[#172138] bg-[#090e1a] flex flex-col justify-between ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl z-10 animate-in slide-in-from-left duration-300 border-r border-[#172138]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
