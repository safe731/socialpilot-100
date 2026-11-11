import React from 'react';
import { Menu, PenSquare, RefreshCw, Share2 } from 'lucide-react';
import type { NavigationTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavigationTab;
  onComposeClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  pagesCount: number;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onComposeClick,
  onRefresh,
  isRefreshing,
  pagesCount,
  onOpenMobileMenu,
}) => {
  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'composer': return 'Post Composer';
      case 'posts_all': return 'All Posts';
      case 'posts_scheduled': return 'Scheduled Queue';
      case 'posts_published': return 'Published Feed';
      case 'posts_failed': return 'Failed Jobs';
      case 'posts_drafts': return 'Drafts';
      case 'pages': return 'Facebook Pages';
      case 'queue': return 'Queue Engine';
      case 'admin': return 'Administration';
      case 'guides': return 'Setup & Docs';
      default: return 'Social Media';
    }
  };

  return (
    <header className="h-16 px-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 transition-colors max-w-full">
      {/* Zone 1: Mobile Hamburger & Title / Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger (min 44px touch target) */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title / Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0">
          <span className="font-bold text-slate-900 dark:text-white truncate">
            {getTabTitle(currentTab)}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline text-xs font-mono tabular-nums whitespace-nowrap">
            {pagesCount} Pages
          </span>
        </div>
      </div>

      {/* Zone 2: Status Indicators (Tablet & Desktop) */}
      <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Graph API v19 Active
        </span>
        <span aria-hidden="true">·</span>
        <span className="whitespace-nowrap">5s Daemon Loop</span>
      </div>

      {/* Zone 3: Primary Action Controls (Optimized for small screens) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50"
          title="Refresh Data"
          aria-label="Refresh application data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {currentTab !== 'composer' && (
          <button
            onClick={onComposeClick}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap min-h-[44px] shrink-0"
          >
            <PenSquare className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">New Post</span>
          </button>
        )}
      </div>
    </header>
  );
};
