import React, { useState } from 'react';
import { 
  Menu, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Sparkles, 
  AlertTriangle, 
  LogOut, 
  Lock, 
  ShieldCheck, 
  Bell, 
  Search, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { playSound, setSoundEnabled } from '../utils/soundEffects';
import SafeSightLogo from './SafeSightLogo';

export default function Header({ 
  onToggleMobileSidebar, 
  healthData, 
  darkMode, 
  setDarkMode, 
  soundActive, 
  setSoundActive, 
  onLaunchDemo, 
  currentUser, 
  onLogout,
  activeTab,
  onNavigateTab
}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const isHealthy = healthData && healthData.status === 'healthy';
  const isModelReady = healthData && healthData.model_loaded;
  const supportedCount = healthData?.supported_classes?.length || 10;
  const isAuthScreen = activeTab === 'login' || !currentUser;

  const toggleTheme = () => {
    playSound('click');
    setDarkMode(!darkMode);
  };

  const toggleSound = () => {
    const nextVal = !soundActive;
    setSoundActive(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) playSound('click');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 z-40 border-b backdrop-blur-md transition-colors duration-300 w-full ${
      darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-2xs'
    }`}>
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile Sidebar Trigger + Project Name / Brand */}
          <div className="flex items-center space-x-3">
            {/* Hamburger menu for mobile/tablet */}
            {!isAuthScreen && (
              <button
                onClick={() => {
                  playSound('click');
                  if (onToggleMobileSidebar) onToggleMobileSidebar();
                }}
                className={`md:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white' 
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
                title="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Brand Logo in Header */}
            <div className="flex items-center space-x-2 select-none">
              <SafeSightLogo 
                size="md"
                brandName="SafeSight"
                brandSuffix=".AI"
                subtitleText="Workplace Safety Monitoring"
                badgeText={null}
              />
            </div>
          </div>

          {/* Center: Search Bar & Surveillance Status Banner */}
          {!isAuthScreen && (
            <div className="hidden md:flex items-center space-x-3 flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Global safety search (violations, workers, policies)..."
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onNavigateTab) {
                      onNavigateTab('violations');
                    }
                  }}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-hidden transition-all ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500'
                      : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
                  }`}
                />
              </div>

              <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Surveillance Active</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-teal-700 dark:text-teal-300 font-mono text-[11px] font-bold">YOLOv8 ({supportedCount})</span>
              </div>
            </div>
          )}

          {/* Right Action Center */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Notification Bell Dropdown */}
            {!isAuthScreen && (
              <div className="relative">
                <button
                  onClick={() => {
                    playSound('click');
                    setIsNotificationOpen(prev => !prev);
                  }}
                  className={`p-2 rounded-xl border text-xs transition-colors relative cursor-pointer ${
                    isNotificationOpen
                      ? 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-slate-800 dark:border-teal-700 dark:text-teal-400'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Safety Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                    3
                  </span>
                </button>

                {/* Notifications Dropdown Panel */}
                {isNotificationOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 text-xs ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                      <span>Safety Broadcasts &amp; Alerts</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">3 New</span>
                    </div>
                    <div className="space-y-2">
                      <div 
                        onClick={() => {
                          setIsNotificationOpen(false);
                          if (onNavigateTab) onNavigateTab('violations');
                        }}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:opacity-90 cursor-pointer"
                      >
                        <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Missing Helmet Alert</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Tower Scaffold 4B: Worker detected without protective hardhat.
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">10 mins ago</span>
                      </div>

                      <div 
                        onClick={() => {
                          setIsNotificationOpen(false);
                          if (onNavigateTab) onNavigateTab('reports');
                        }}
                        className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 hover:opacity-90 cursor-pointer"
                      >
                        <div className="flex items-center space-x-1.5 text-teal-700 dark:text-teal-300 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Monthly Report Ready</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          October 2026 HSE Performance Audit has been compiled.
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">1 hour ago</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>YOLOv8 Engine Active</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          10 classes loaded. Frame deduplication (NMS) active.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Demo Button */}
            {!isAuthScreen && onLaunchDemo && (
              <button
                onClick={() => {
                  playSound('click');
                  onLaunchDemo();
                }}
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Instantly test with pre-loaded demo inspection media"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Try Demo</span>
              </button>
            )}

            {/* Sound FX Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundActive 
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={soundActive ? 'Audio FX Enabled' : 'Audio FX Muted'}
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={darkMode ? 'Switch to Crisp Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Authenticated User Profile & Logout */}
            {!isAuthScreen && currentUser && (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div 
                  className={`flex items-center space-x-2 px-2.5 py-1 rounded-xl border ${
                    darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/90 border-slate-200'
                  }`}
                  title={`Logged in as ${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs shrink-0">
                    {currentUser.avatar || currentUser.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold leading-tight truncate max-w-[100px]">
                      {currentUser.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('click');
                    if (onLogout) onLogout();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
                  title="Sign Out of Operations Terminal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
