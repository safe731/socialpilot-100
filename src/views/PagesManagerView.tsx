import React, { useState } from 'react';
import {
  Share2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Check,
  Info,
} from 'lucide-react';
import type { FacebookPage } from '../types';
import { formatDate, timeAgo, formatNumber } from '../lib/utils';

interface PagesManagerViewProps {
  pages: FacebookPage[];
  onConnectFacebook: () => void;
  onDisconnectPage: (pageId: string) => void;
  onTestPage: (pageId: string) => void;
  onSeedBatch: (count: number) => void;
  onRefresh: () => void;
  isConnecting: boolean;
  testingPageId: string | null;
  metaAppConfigured: boolean;
}

export const PagesManagerView: React.FC<PagesManagerViewProps> = ({
  pages,
  onConnectFacebook,
  onDisconnectPage,
  onTestPage,
  onSeedBatch,
  onRefresh,
  isConnecting,
  testingPageId,
  metaAppConfigured,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = Array.from(new Set(pages.map((p) => p.category).filter(Boolean))) as string[];

  const filteredPages = pages.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Fleet Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Connected Facebook Pages Fleet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authorized Facebook Pages, verify Meta Graph API access tokens, and maintain 100–1000+ publication nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scalability Batch Generator */}
          <button
            onClick={() => onSeedBatch(50)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            title="Generate 50 regional nodes to test 100+ scalability"
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Scale Fleet (+50 Pages)</span>
          </button>

          {/* Connect Facebook via Meta OAuth */}
          <button
            onClick={onConnectFacebook}
            disabled={isConnecting}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Share2 className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>Connect Facebook Account</span>
          </button>
        </div>
      </div>

      {/* Meta API Permissions Advisory Card */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-blue-950 dark:text-blue-100">
              Meta Graph API v19 Scope & App Review Governance
            </h4>
            <p className="text-blue-800 dark:text-blue-300/80 leading-relaxed text-[11px]">
              Page publishing requires <code className="font-mono bg-blue-100/80 dark:bg-blue-900/80 px-1 py-0.5 rounded">pages_show_list</code>, <code className="font-mono bg-blue-100/80 dark:bg-blue-900/80 px-1 py-0.5 rounded">pages_read_engagement</code>, and <code className="font-mono bg-blue-100/80 dark:bg-blue-900/80 px-1 py-0.5 rounded">pages_manage_posts</code>. Personal profile timeline posting is not supported by standard Meta API policy.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
            {pages.length} Connected
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages by name or Meta Page ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Page Categories ({pages.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Pages Grid / Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {filteredPages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Facebook Pages found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click "Connect Facebook Account" to authenticate via Meta OAuth or click "Scale Fleet (+50 Pages)" to simulate a 100+ page test environment.
            </p>
            <button
              onClick={onConnectFacebook}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Connect Facebook
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Facebook Page</th>
                  <th className="py-3 px-4">Meta Page ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Token Status</th>
                  <th className="py-3 px-4">Last Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPages.map((page) => {
                  const isTesting = testingPageId === page.id;
                  return (
                    <tr key={page.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {page.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {page.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Tasks: {page.tasks?.slice(0, 2).join(', ') || 'MANAGE'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Page ID */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {page.id}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {page.category || 'General'}
                      </td>

                      {/* Fans */}
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatNumber(page.fanCount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            page.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          }`}
                        >
                          {page.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {page.status}
                        </span>
                      </td>

                      {/* Last Sync */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {timeAgo(page.lastSyncAt)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onTestPage(page.id)}
                            disabled={isTesting}
                            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors disabled:opacity-50"
                            title="Verify Graph API publish token permissions"
                          >
                            {isTesting ? 'Verifying...' : 'Test Token'}
                          </button>

                          <button
                            onClick={() => onDisconnectPage(page.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Disconnect page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
