import { 
  ShieldCheck, 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  Info, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertTriangle,
  Lock,
  LogOut,
  FileText
} from 'lucide-react';
import { playSound, setSoundEnabled } from '../utils/soundEffects';
import SafeSightLogo from './SafeSightLogo';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  healthData, 
  darkMode, 
  setDarkMode, 
  soundActive, 
  setSoundActive,
  onLaunchDemo,
  currentUser,
  onLogout
}) {
  const isHealthy = healthData && healthData.status === 'healthy';
  const isModelReady = healthData && healthData.model_loaded;
  const supportedCount = healthData?.supported_classes?.length || 10;
  const isAuthScreen = activeTab === 'login' || !currentUser;

  const handleTabChange = (tab) => {
    playSound('click');
    setActiveTab(tab);
  };

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

  const navItems = [
    { id: 'dashboard', label: 'Command Center', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'AI Scanner', shortLabel: 'Analyze', icon: UploadCloud, badge: 'Live' },
    { id: 'history', label: 'Audit Records', shortLabel: 'History', icon: History },
    { id: 'docs', label: 'Document Intelligence', shortLabel: 'Doc AI', icon: FileText, badge: 'M2' },
    { id: 'about', label: 'Architecture', shortLabel: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          
          {/* Brand Logo & Title with Light Orange Hardhat & Teal Shield */}
          <div 
            className={`flex items-center space-x-3 select-none ${currentUser ? 'cursor-pointer group' : ''}`}
            onClick={() => {
              if (currentUser) handleTabChange('dashboard');
            }}
          >
            <SafeSightLogo 
              size="md" 
              badgeText={isAuthScreen ? 'ACCESS GATEWAY' : 'PRO OPS'} 
            />
          </div>

          {/* If on Login Screen / Not Logged In: HIDE ALL INTERNAL NAV ITEMS */}
          {isAuthScreen ? (
            <div className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Authentication Required &bull; Sign in to access AI Scanner & Reports</span>
            </div>
          ) : (
            /* Interactive Navigation Tabs for Authenticated Personnel */
            <nav className="flex items-center space-x-1 sm:space-x-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-teal-500 text-teal-900 dark:text-slate-950 shadow-sm border border-slate-200/70 dark:border-teal-400 scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="md:hidden">{item.shortLabel}</span>
                    {item.badge && !isActive && (
                      <span className="hidden lg:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Action Center */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Demo Button - ONLY FOR LOGGED IN USERS */}
            {!isAuthScreen && (
              <button
                onClick={() => {
                  if (onLaunchDemo) onLaunchDemo();
                  else handleTabChange('upload');
                }}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Instantly test with pre-loaded demo inspection media"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Try Demo</span>
              </button>
            )}

            {/* Neural Model Status Chip - ONLY FOR LOGGED IN USERS */}
            {!isAuthScreen && (
              <div className="hidden xl:flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {isHealthy && isModelReady ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>YOLOv8 Active</span>
                    <span className="text-[10px] text-slate-400 font-mono">({supportedCount} cls)</span>
                  </>
                ) : isHealthy && !isModelReady ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">Model Standby</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-rose-600 dark:text-rose-400">Connecting...</span>
                  </>
                )}
              </div>
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

            {/* Authenticated User Profile & Logout - ONLY FOR LOGGED IN USERS */}
            {!isAuthScreen && currentUser && (
              <div className="flex items-center space-x-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div 
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  title={`Logged in as ${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs">
                    {currentUser.avatar || currentUser.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[110px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold leading-tight truncate max-w-[110px]">
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

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
              title={darkMode ? 'Switch to Crisp Light Mode' : 'Switch to High-Tech Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
