import React from 'react';
import { CortexxLogo } from './CortexxLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { Lock, Settings, Sparkles, LayoutDashboard, Users, BookOpen, Receipt, Sun, Moon, Award } from 'lucide-react';

export type NavView = 'dashboard' | 'students' | 'courses' | 'invoices' | 'ad-studio' | 'certificates';

interface NavbarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onLockAdmin: () => void;
  onOpenSettings: () => void;
  isLocked: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onSelectView,
  onLockAdmin,
  onOpenSettings,
  isLocked,
  theme = 'dark',
  onToggleTheme,
}) => {
  const navItems: { id: NavView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 md:w-3.5 md:h-3.5" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-5 h-5 md:w-3.5 md:h-3.5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5 md:w-3.5 md:h-3.5" /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt className="w-5 h-5 md:w-3.5 md:h-3.5" /> },
    { id: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5 md:w-3.5 md:h-3.5 text-amber-400" /> },
    { id: 'ad-studio', label: 'Banner Studio', icon: <Sparkles className="w-5 h-5 md:w-3.5 md:h-3.5 text-orange-400" /> },
  ];

  return (
    <>
      {/* Top Header Bar with Dashboard Type Color Combination */}
      <header className={`sticky top-0 z-30 w-full max-w-full backdrop-blur-xl border-b-2 px-3 sm:px-6 lg:px-8 py-3 no-print transition-colors overflow-x-hidden ${
        theme === 'light'
          ? 'bg-white/95 border-b-orange-500 shadow-[0_2px_15px_rgba(249,115,22,0.12)] text-black'
          : 'bg-neutral-950/95 border-b-orange-500/40 shadow-[0_4px_25px_rgba(0,0,0,0.6)] text-neutral-100'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => onSelectView('dashboard')}
            className="cursor-pointer shrink-0 transition-opacity hover:opacity-95"
          >
            <CortexxLogo size="sm" showTagline={false} inverted={theme === 'light'} />
          </div>

          {/* Zone 2: Desktop Navigation Links (Dashboard type colors) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs lg:text-sm rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? theme === 'light'
                        ? 'bg-orange-500 text-white font-black shadow-md border border-orange-600'
                        : 'bg-orange-500 text-neutral-950 font-black shadow-md shadow-orange-500/25 border border-orange-400'
                      : theme === 'light'
                      ? 'text-black hover:text-black hover:bg-orange-100 font-black border border-transparent hover:border-orange-400 shadow-2xs'
                      : 'text-neutral-300 hover:text-white hover:bg-orange-500/25 font-bold border border-transparent hover:border-orange-500/40'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Theme Toggle, Settings, & Admin Lock Action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle Button placed right near Admin Lock */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to White & Orange Light Mode'}
                aria-label="Toggle visual theme"
                className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-sm'
                    : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:border-orange-500/40 hover:text-orange-400'
                }`}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
                    <span className="hidden sm:inline font-bold">White & Orange</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-orange-400" />
                    <span className="hidden sm:inline font-semibold">Dark Theme</span>
                  </>
                )}
              </button>
            )}

            {/* Admin Lock Button */}
            <button
              onClick={onLockAdmin}
              title={isLocked ? 'Admin system locked' : 'Lock Admin Access with PIN'}
              className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isLocked
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25'
                  : theme === 'light'
                  ? 'bg-white text-black border-neutral-300 hover:border-orange-500 hover:text-black hover:bg-orange-100 font-black'
                  : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:border-orange-500/40 hover:text-orange-400'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Admin Lock'}</span>
            </button>

            {/* PWA Web App Home Screen Install Shortcut (Hidden on mobile to save space and prevent horizontal scroll) */}
            <div className="hidden md:flex shrink-0">
              <PWAInstallButton variant="compact" />
            </div>

            {/* System Settings & Cloud Sync Button */}
            <button
              onClick={onOpenSettings}
              title="System Settings & Database Backup"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'text-neutral-800 hover:text-black hover:bg-orange-100 border-transparent hover:border-orange-400'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900 border-transparent hover:border-neutral-800'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Sticked Navigation Bar for Mobile View: Properly placed and fitted at bottom, matching Dashboard Color Combination */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full backdrop-blur-2xl border-t-2 no-print px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors shadow-[0_-8px_32px_rgba(0,0,0,0.7)] ${
        theme === 'light'
          ? 'bg-white/95 border-t-orange-500 text-black shadow-[0_-6px_25px_rgba(249,115,22,0.14)]'
          : 'bg-neutral-950/95 border-t-orange-500/60 text-neutral-200'
      }`}>
        <div className="grid grid-cols-5 w-full items-center gap-1 max-w-full">
          {navItems
            .filter(item => item.id !== 'ad-studio')
            .map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all w-full text-center group cursor-pointer ${
                    isActive
                      ? theme === 'light'
                        ? 'text-orange-600 bg-orange-500/15 border border-orange-500/40 font-black shadow-sm'
                        : 'text-orange-400 bg-orange-500/20 border border-orange-500/40 font-black shadow-sm'
                      : theme === 'light'
                      ? 'text-black hover:text-black hover:bg-orange-100 font-black'
                      : 'text-neutral-300 hover:text-white hover:bg-orange-500/20 font-bold'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    {item.icon}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500 animate-pulse"></span>
                    )}
                  </div>
                  <span className={`text-[10px] tracking-tight mt-1 truncate max-w-full block leading-none font-sans ${
                    isActive
                      ? theme === 'light'
                        ? 'text-orange-600 font-black'
                        : 'text-orange-400 font-black'
                      : ''
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
        </div>
      </nav>
    </>
  );
};
