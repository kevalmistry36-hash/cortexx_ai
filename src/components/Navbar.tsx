import React from 'react';
import { CortexxLogo } from './CortexxLogo';
import { Lock, Settings, Sparkles, LayoutDashboard, Users, BookOpen, Receipt, Sun, Moon, Award, Youtube } from 'lucide-react';

export type NavView = 'dashboard' | 'students' | 'courses' | 'invoices' | 'certificates' | 'youtube' | 'ad-studio';

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
    { id: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5 md:w-3.5 md:h-3.5 text-black dark:text-amber-400" /> },
    { id: 'youtube', label: 'YouTube Videos', icon: <Youtube className="w-5 h-5 md:w-3.5 md:h-3.5 text-black dark:text-red-500" /> },
  ];

  return (
    <>
      {/* Top Header Bar with Olive & Beige Color Combination */}
      <header className={`sticky top-0 z-30 w-full max-w-full backdrop-blur-xl border-b-2 px-3 sm:px-6 lg:px-8 py-3 no-print transition-colors overflow-x-hidden ${
        theme === 'light'
          ? 'bg-[#FAF6EE]/95 border-b-[#587731] shadow-[0_2px_15px_rgba(88,119,49,0.12)] text-[#243315]'
          : 'bg-[#11180E]/95 border-b-[#587731]/40 shadow-[0_4px_25px_rgba(0,0,0,0.6)] text-neutral-100'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => onSelectView('dashboard')}
            className="cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            <CortexxLogo size="sm" showTagline={false} inverted={theme === 'light'} />
          </div>

          {/* Zone 2: Desktop Navigation Links (Olive & Beige colors) */}
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
                        ? 'bg-[#587731] text-[#FAF6EE] font-black shadow-md border border-[#486228]'
                        : 'bg-[#587731] text-[#FAF6EE] font-black shadow-md shadow-[#587731]/25 border border-[#6D933D]'
                      : theme === 'light'
                      ? 'text-[#243315] hover:text-[#587731] hover:bg-[#587731]/10 font-black border border-transparent hover:border-[#587731]/30 shadow-2xs'
                      : 'text-neutral-300 hover:text-white hover:bg-[#587731]/25 font-bold border border-transparent hover:border-[#587731]/40'
                  }`}
                >
                  <span>{item.icon}</span>
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
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Olive & Beige Theme'}
                aria-label="Toggle visual theme"
                className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#587731] text-[#FAF6EE] border-[#486228] hover:bg-[#486228] shadow-sm'
                    : 'bg-[#182214] text-neutral-200 border-[#2C3D21] hover:border-[#587731]/50 hover:text-[#7EA746]'
                }`}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#FAF6EE]" />
                    <span className="hidden sm:inline font-bold">Olive &amp; Beige</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#7EA746]" />
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
                  ? 'bg-[#FAF6EE] text-[#243315] border-[#DCD1B0] hover:border-[#587731] hover:text-[#587731] hover:bg-[#F5EFDF] font-black'
                  : 'bg-[#182214] text-neutral-200 border-[#2C3D21] hover:border-[#587731]/50 hover:text-[#7EA746]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#587731]" />
              <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Admin Lock'}</span>
            </button>

            {/* System Settings & Cloud Sync Button - black/dark olive Settings icon in light theme */}
            <button
              onClick={onOpenSettings}
              title="System Settings & Database Backup"
              aria-label="System Settings"
              className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#FAF6EE] text-[#243315] border-[#DCD1B0] hover:border-[#587731] hover:text-[#587731] hover:bg-[#F5EFDF] font-black shadow-2xs'
                  : 'bg-[#182214] text-neutral-200 border-[#2C3D21] hover:border-[#587731]/50 hover:text-[#7EA746]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#243315] dark:text-neutral-200 stroke-[2.2]" />
              <span className="hidden sm:inline font-bold">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Sticked Navigation Bar for Mobile View: Properly placed and fitted at bottom, matching Olive & Beige Combination */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full backdrop-blur-2xl border-t-2 no-print px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors shadow-[0_-8px_32px_rgba(0,0,0,0.7)] ${
        theme === 'light'
          ? 'bg-[#FAF6EE]/95 border-t-[#587731] text-[#243315] shadow-[0_-6px_25px_rgba(88,119,49,0.14)]'
          : 'bg-[#11180E]/95 border-t-[#587731]/60 text-neutral-200'
      }`}>
        <div className="grid grid-cols-6 w-full items-center gap-0.5 max-w-full">
          {navItems
            .map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all w-full text-center group cursor-pointer ${
                    isActive
                      ? theme === 'light'
                        ? 'text-[#FAF6EE] bg-[#587731] border border-[#486228] font-black shadow-sm'
                        : 'text-[#FAF6EE] bg-[#587731] border border-[#6D933D] font-black shadow-sm'
                      : theme === 'light'
                      ? 'text-[#243315] hover:text-[#587731] hover:bg-[#587731]/10 font-black'
                      : 'text-neutral-300 hover:text-white hover:bg-[#587731]/20 font-bold'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <span>{item.icon}</span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#FAF6EE] shadow-sm animate-pulse"></span>
                    )}
                  </div>
                  <span className={`text-[10px] tracking-tight mt-1 truncate max-w-full block leading-none font-sans ${
                    isActive
                      ? 'text-[#FAF6EE] font-black'
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
