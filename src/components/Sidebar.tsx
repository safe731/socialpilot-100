import React from 'react';
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
  Sparkles,
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
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

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

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors h-screen sticky top-0 select-none">
      {/* Top Header / Brand Lockup */}
      <div>
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SocialPilot <span className="text-blue-600 dark:text-blue-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">100+</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
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
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${
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
                onClick={() => onSelectTab('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="whitespace-nowrap">Admin Console</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 py-0.5 rounded">
                  RBAC
                </span>
              </button>
            </>
          )}

          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Resources
          </p>
          <button
            onClick={() => onSelectTab('guides')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'guides'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span className="whitespace-nowrap">Meta & Deploy Setup</span>
          </button>
        </div>
      </div>

      {/* Footer User Info & Theme */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] text-slate-400">Theme</span>
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light / Dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Active User Card with Switcher */}
        <div
          onClick={onSwitchUserModal}
          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-medium text-xs flex items-center justify-center shrink-0">
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Switch
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
