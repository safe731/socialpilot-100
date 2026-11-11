import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Share2,
  ShieldCheck,
  BookOpen,
  Sun,
  Moon,
  Layers,
  X,
} from 'lucide-react';
import type { UserProfile } from '../types';

export type NavigationTab = 
  | 'dashboard'
  | 'composer'
  | 'posts_all'
  | 'posts_scheduled'
  | 'posts_published'
  | 'posts_failed'
  | 'posts_drafts'
  | 'pages'
  | 'queue'
  | 'admin'
  | 'guides';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  currentUser: UserProfile;
  onSwitchUserModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  pagesCount: number;
  scheduledCount: number;
  failedCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSwitchUserModal,
  darkMode,
  onToggleDarkMode,
  pagesCount,
  scheduledCount,
  failedCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'composer' as NavigationTab, label: 'Post Composer', icon: PenSquare, highlight: true },
    { id: 'posts_all' as NavigationTab, label: 'All Posts', icon: FileText },
    { id: 'posts_scheduled' as NavigationTab, label: 'Scheduled Queue', icon: Clock, count: scheduledCount },
    { id: 'posts_published' as NavigationTab, label: 'Published Feed', icon: CheckCircle },
    { id: 'posts_failed' as NavigationTab, label: 'Failed Jobs', icon: AlertTriangle, count: failedCount, countAlert: failedCount > 0 },
    { id: 'posts_drafts' as NavigationTab, label: 'Drafts', icon: FolderOpen },
    { id: 'pages' as NavigationTab, label: 'Facebook Pages', icon: Share2, count: pagesCount },
    { id: 'queue' as NavigationTab, label: 'Queue Engine', icon: Layers },
  ];

  const handleItemClick = (id: NavigationTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="h-full flex flex-col justify-between select-none">
      {/* Top Header / Brand Lockup */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-16 px-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SocialPilot <span className="text-blue-600 dark:text-blue-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">100+</span>
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list with touch-friendly min-height >= 44px on mobile */}
        <div className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Publishing
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium min-h-[44px] transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                      item.countAlert
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                System Administration
              </p>
              <button
                onClick={() => handleItemClick('admin')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium min-h-[44px] transition-all ${
                  currentTab === 'admin'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Admin Console</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                  RBAC
                </span>
              </button>
            </>
          )}

          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Resources
          </p>
          <button
            onClick={() => handleItemClick('guides')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium min-h-[44px] transition-all ${
              currentTab === 'guides'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Meta & Deploy Setup</span>
          </button>
        </div>
      </div>

      {/* Footer User Info & Theme */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] text-slate-400 font-medium">Appearance</span>
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            title="Toggle Light / Dark mode"
            aria-label="Toggle Light and Dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Active User Card with Switcher */}
        <div
          onClick={() => {
            onSwitchUserModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer min-h-[44px] flex items-center transition-all"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-medium text-xs flex items-center justify-center shrink-0">
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 pr-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0 hover:underline">
              Switch
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors h-screen sticky top-0 select-none z-20">
        {content}
      </aside>

      {/* 2. Mobile Drawer (< 1024px) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-[280px] max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
