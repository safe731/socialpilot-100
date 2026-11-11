import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  Share2,
  MoreVertical,
  ExternalLink,
  RotateCcw,
  Eye,
  Trash2,
  Send,
  Calendar,
} from 'lucide-react';
import type { Post } from '../types';
import { formatDate, timeAgo, truncate } from '../lib/utils';
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

  // Determine active filter from tab
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

  // Update filter when tab changes
  React.useEffect(() => {
    setActiveFilter(getFilterFromTab());
  }, [currentTab]);

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
    const matchesSearch =
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Social Media Publishing Catalog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor, inspect, retry, and reschedule multi-page Facebook distributions.
          </p>
        </div>

        <button
          onClick={onComposeClick}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          Compose New Post
        </button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'scheduled', label: 'Scheduled Queue' },
            { id: 'published', label: 'Published Feed' },
            { id: 'failed', label: 'Failed Jobs' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by post text, author, or ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No posts found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no publications matching the current filter criteria or search query.
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
                      {/* Post Content & Author */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{post.authorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{timeAgo(post.createdAt)}</span>
                          {post.linkUrl && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-blue-500 truncate max-w-[120px]">{post.linkUrl}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
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

                      {/* Target Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                          <Share2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{post.targetCount} Pages</span>
                        </div>
                      </td>

                      {/* Distribution Progress */}
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

                      {/* Timing / Schedule */}
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

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasFailed && (
                            <button
                              onClick={() => onRetryPost(post.id)}
                              className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
                              title="Retry failed targets"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {post.status === 'draft' && (
                            <button
                              onClick={() => onPublishNow(post.id)}
                              className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 transition-colors"
                              title="Publish now"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectPost(post)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Inspect distribution logs"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
