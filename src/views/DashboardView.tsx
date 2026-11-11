import React from 'react';
import {
  Users,
  Share2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Settings,
  Play,
} from 'lucide-react';
import type { PlatformMetrics, Post, FacebookPage } from '../types';
import { formatDate, timeAgo, formatNumber } from '../lib/utils';

interface DashboardViewProps {
  metrics: PlatformMetrics | null;
  recentPosts: Post[];
  pages: FacebookPage[];
  onNavigate: (tab: any) => void;
  onComposeClick: () => void;
  onTriggerQueue: () => void;
  isQueueTriggering: boolean;
  metaAppConfigured: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentPosts,
  pages,
  onNavigate,
  onComposeClick,
  onTriggerQueue,
  isQueueTriggering,
  metaAppConfigured,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Banner if Meta App ID is not yet configured in environment */}
      {!metaAppConfigured && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100">
                Meta Developer Credentials Setup Available
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Add <code className="font-mono bg-amber-200/60 dark:bg-amber-900/50 px-1 py-0.5 rounded break-all">META_APP_ID</code> and <code className="font-mono bg-amber-200/60 dark:bg-amber-900/50 px-1 py-0.5 rounded break-all">META_APP_SECRET</code> to your environment for direct live Graph API publishing. Interactive sandbox mode is currently active.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('guides')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-900 dark:bg-amber-100 text-white dark:text-amber-950 text-xs font-semibold hover:bg-amber-800 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center shrink-0"
          >
            Setup Guide
          </button>
        </div>
      )}

      {/* Hero Metric Overview Cards (Mobile: 2 cols, Tablet: 3 cols, Desktop: 6 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5">
        <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium">Pages Fleet</span>
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics?.totalConnectedPages ?? pages.length}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            1,000+ capacity
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium">Published</span>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics?.totalPublished ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400">
            Delivered
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium">Scheduled</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics?.totalScheduled ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            In queue time
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium">Queue Jobs</span>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics?.queueLength ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            Active in queue
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium">Failed</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics?.totalFailed ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            Auto-retry
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-medium">Active Users</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {metrics?.activeUsers ?? 1}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            RBAC Active
          </p>
        </div>
      </div>

      {/* Main Grid: Responsive Stacking (Recent Posts + Fleet Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Recent Publishing Activity */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Recent Publications
            </h3>
            <button
              onClick={() => onNavigate('posts_all')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 min-h-[44px] sm:min-h-0 py-2 sm:py-0"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            {recentPosts.length === 0 ? (
              <div className="p-8 sm:p-10 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No posts published yet
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Compose your first multi-page distribution post to broadcast content to your connected Facebook Pages.
                </p>
                <button
                  onClick={onComposeClick}
                  className="mt-4 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs min-h-[44px]"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="p-3.5 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{post.authorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono whitespace-nowrap">{timeAgo(post.createdAt)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono whitespace-nowrap">{post.targetCount} Targets</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed break-words">
                          {post.content}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 mt-1 sm:mt-0">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              : post.status === 'scheduled'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : post.status === 'queued' || post.status === 'publishing'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Fleet Actions & Summary */}
        <div className="space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Publishing Fleet Actions
          </h3>

          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Queue Processor Engine
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                Autonomous background daemon processes scheduled jobs and retries failed attempts every 5 seconds.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={onTriggerQueue}
                disabled={isQueueTriggering}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold min-h-[44px] transition-colors disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isQueueTriggering ? 'animate-spin' : ''}`} />
                <span>{isQueueTriggering ? 'Processing Tick...' : 'Trigger Queue Tick Now'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {metrics?.dbStatus === 'supabase_connected' ? 'Supabase' : 'Local Store'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Meta API Status</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {metaAppConfigured ? 'Live Graph API' : 'Sandbox Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Page Summary */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Active Pages Summary
              </span>
              <button
                onClick={() => onNavigate('pages')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] flex items-center"
              >
                Manage Fleet
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {pages.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{p.category}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    {formatNumber(p.fanCount)} fans
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
