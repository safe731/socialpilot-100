import React from 'react';
import { PenSquare, Plus, RefreshCw, Share2 } from 'lucide-react';
import type { NavigationTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavigationTab;
  onComposeClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  pagesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onComposeClick,
  onRefresh,
  isRefreshing,
  pagesCount,
}) => {
  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'composer': return 'Post Composer & Distribution';
      case 'posts_all': return 'All Posts Catalog';
      case 'posts_scheduled': return 'Scheduled Publications';
      case 'posts_published': return 'Published Posts History';
      case 'posts_failed': return 'Failed Publishing Jobs';
      case 'posts_drafts': return 'Draft Posts';
      case 'pages': return 'Facebook Pages Fleet (100–1000+)';
      case 'queue': return 'Background Queue & Scheduler';
      case 'admin': return 'System Administration & RBAC';
      case 'guides': return 'Integration & Meta Setup Documentation';
      default: return 'Social Media Management';
    }
  };

  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-8 sticky top-0 z-30 transition-colors">
      {/* Zone 1: Breadcrumb wordmark */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 min-w-0">
        <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
          {getTabTitle(currentTab)}
        </span>
        <span className="hidden sm:inline" aria-hidden="true">·</span>
        <span className="hidden sm:inline text-xs font-mono tabular-nums">
          {pagesCount} Pages Connected
        </span>
      </div>

      {/* Zone 2: Quick Status Links */}
      <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Graph API v19 Active
        </span>
        <span aria-hidden="true">·</span>
        <span>Queue Runner 5s Sync</span>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {currentTab !== 'composer' && (
          <button
            onClick={onComposeClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>Compose Post</span>
          </button>
        )}
      </div>
    </header>
  );
};
