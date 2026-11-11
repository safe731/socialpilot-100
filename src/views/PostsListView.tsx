import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Share2,
  RotateCcw,
  Eye,
  Send,
  Calendar,
} from 'lucide-react';
import type { Post } from '../types';
import { formatDate, timeAgo } from '../lib/utils';
import type { NavigationTab } from '../components/Sidebar';

interface PostsListViewProps {
  currentTab: NavigationTab;
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onRetryPost: (postId: string) => void;
  onPublishNow: (postId: string) => void;
  onComposeClick: () => void;
}

export const PostsListView: React.FC<PostsListViewProps> = ({
  currentTab,
  posts,
  onSelectPost,
  onRetryPost,
  onPublishNow,
  onComposeClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getFilterFromTab = (): string => {
    switch (currentTab) {
      case 'posts_scheduled': return 'scheduled';
      case 'posts_published': return 'published';
      case 'posts_failed': return 'failed';
      case 'posts_drafts': return 'draft';
      default: return 'all';
    }
  };

  const [activeFilter, setActiveFilter] = useState(getFilterFromTab());

  React.useEffect(() => {
    setActiveFilter(getFilterFromTab());
  }, [currentTab]);

  const filteredPosts = posts.filter((p) => {
    const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
    const matchesSearch =
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Social Media Publishing Catalog
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor, inspect, retry, and reschedule multi-page Facebook distributions.
          </p>
        </div>

        <button
          onClick={onComposeClick}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center self-start sm:self-auto"
        >
          Compose New Post
        </button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Filter Segmented Buttons (Horizontal scroll with touch targets on mobile) */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'published', label: 'Published' },
            { id: 'failed', label: 'Failed' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap min-h-[40px] flex items-center ${
                activeFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 1. Mobile Card-Based Post List (< 768px: optimized for 320px-430px Android phones) */}
      <div className="md:hidden space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No posts found
            </p>
            <p className="text-xs text-slate-400">
              No publications match this filter.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const hasFailed = post.failedCount > 0 || post.status === 'failed';
            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all"
              >
                {/* Header: Status & Timing */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      post.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : post.status === 'scheduled'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : post.status === 'queued' || post.status === 'publishing'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        : post.status === 'failed'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {post.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                    {post.status === 'scheduled' && <Clock className="w-3 h-3" />}
                    {post.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                    {post.status}
                  </span>

                  <span className="font-mono text-[11px] text-slate-400">
                    {timeAgo(post.createdAt)}
                  </span>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed break-words">
                  {post.content}
                </p>

                {/* Metrics & Progress Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Share2 className="w-3 h-3 text-blue-500" />
                      {post.targetCount} Targets
                    </span>
                    <span>
                      {post.publishedCount} published {post.failedCount > 0 ? `· ${post.failedCount} failed` : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${
                          post.targetCount > 0
                            ? Math.round((post.publishedCount / post.targetCount) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Mobile Action Buttons (>= 44px touch targets) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {hasFailed && (
                    <button
                      onClick={() => onRetryPost(post.id)}
                      className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-semibold min-h-[44px] flex items-center gap-1.5 transition-colors"
                      title="Retry failed targets"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}

                  {post.status === 'draft' && (
                    <button
                      onClick={() => onPublishNow(post.id)}
                      className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold min-h-[44px] flex items-center gap-1.5 transition-colors"
                      title="Publish now"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectPost(post)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium min-h-[44px] flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Tabular Grid (>= 768px: clean data table) */}
      <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No posts found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no publications matching the filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Post Content</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fleet Targets</th>
                  <th className="py-3 px-4">Distribution Progress</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPosts.map((post) => {
                  const hasFailed = post.failedCount > 0 || post.status === 'failed';
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => onSelectPost(post)}
                    >
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{post.authorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{timeAgo(post.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              : post.status === 'scheduled'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : post.status === 'queued' || post.status === 'publishing'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : post.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {post.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                          {post.status === 'scheduled' && <Clock className="w-3 h-3" />}
                          {post.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                          {post.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                          <Share2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{post.targetCount} Pages</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>
                              {post.publishedCount} / {post.targetCount} published
                            </span>
                            {post.failedCount > 0 && (
                              <span className="text-rose-600 font-bold">
                                {post.failedCount} failed
                              </span>
                            )}
                          </div>
                          <div className="w-28 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{
                                width: `${
                                  post.targetCount > 0
                                    ? Math.round((post.publishedCount / post.targetCount) * 100)
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {post.status === 'scheduled' && post.scheduledFor ? (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(post.scheduledFor)}</span>
                          </div>
                        ) : (
                          <span>{formatDate(post.createdAt)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasFailed && (
                            <button
                              onClick={() => onRetryPost(post.id)}
                              className="p-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                              title="Retry failed targets"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {post.status === 'draft' && (
                            <button
                              onClick={() => onPublishNow(post.id)}
                              className="p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                              title="Publish now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectPost(post)}
                            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                            title="Inspect distribution logs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
