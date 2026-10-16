import React from 'react';
import { CortexxLogo } from './CortexxLogo';
import { Lock, Settings, Sparkles, LayoutDashboard, Users, BookOpen, Receipt, Sun, Moon } from 'lucide-react';

export type NavView = 'dashboard' | 'students' | 'courses' | 'invoices' | 'ad-studio';

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
    { id: 'ad-studio', label: 'Banner Studio', icon: <Sparkles className="w-5 h-5 md:w-3.5 md:h-3.5 text-orange-400" /> },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 lg:px-8 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => onSelectView('dashboard')}
            className="cursor-pointer shrink-0 transition-opacity hover:opacity-95"
          >
            <CortexxLogo size="sm" showTagline={false} inverted={theme === 'light'} />
          </div>

          {/* Zone 2: Desktop Navigation Links (Single line, quiet hover states) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-sm'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-orange-400'
                }`}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
                    <span className="hidden sm:inline">White & Orange</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-400" />
                    <span className="hidden sm:inline">Dark Theme</span>
                  </>
                )}
              </button>
            )}

            {/* Admin Lock Button */}
            <button
              onClick={onLockAdmin}
              title={isLocked ? 'Admin system locked' : 'Lock Admin Access with PIN'}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isLocked
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden xs:inline">{isLocked ? 'Locked' : 'Admin Lock'}</span>
            </button>

            {/* System Settings & Cloud Sync Button */}
            <button
              onClick={onOpenSettings}
              title="System Settings & Database Backup"
              className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-lg border border-transparent hover:border-neutral-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Sticked Navigation Bar for Mobile View */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 px-2 py-2 flex items-center justify-around no-print shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-orange-400 bg-orange-500/15 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
