import React, { useState } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Layers,
  Search,
} from 'lucide-react';
import type { FacebookPage } from '../types';
import { timeAgo, formatNumber } from '../lib/utils';

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
  isConnecting,
  testingPageId,
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
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Header and Fleet Actions (Stack on mobile, row on tablet/desktop) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Connected Facebook Pages Fleet
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authorized Facebook Pages, verify Meta Graph API access tokens, and maintain 100–1000+ publication nodes.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2">
          {/* Scalability Batch Generator */}
          <button
            onClick={() => onSeedBatch(50)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            title="Generate 50 regional nodes to test 100+ scalability"
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Scale Fleet (+50)</span>
          </button>

          {/* Connect Facebook via Meta OAuth */}
          <button
            onClick={onConnectFacebook}
            disabled={isConnecting}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>Connect Facebook</span>
          </button>
        </div>
      </div>

      {/* Meta API Permissions Advisory Card */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h4 className="font-bold text-blue-950 dark:text-blue-100 text-xs sm:text-sm">
              Meta Graph API v19 Scope & Governance
            </h4>
            <p className="text-blue-800 dark:text-blue-300/80 leading-relaxed text-[11px] break-words">
              Requires <code className="font-mono bg-blue-100/80 dark:bg-blue-900/80 px-1 py-0.5 rounded">pages_show_list</code> and <code className="font-mono bg-blue-100/80 dark:bg-blue-900/80 px-1 py-0.5 rounded">pages_manage_posts</code>. Personal profile timeline posting is not supported by standard Meta API policy.
            </p>
          </div>
        </div>
        <div className="shrink-0 self-start sm:self-auto">
          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 whitespace-nowrap">
            {pages.length} Connected
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages by name or ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs min-h-[44px] focus:outline-none"
          >
            <option value="all">All Categories ({pages.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 1. Mobile Cards Layout (< 768px: for 320px–430px Android screens) */}
      <div className="md:hidden space-y-3">
        {filteredPages.length === 0 ? (
          <div className="p-8 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Facebook Pages found
            </p>
            <p className="text-xs text-slate-400">
              Connect your account or scale fleet to add nodes.
            </p>
            <button
              onClick={onConnectFacebook}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[44px]"
            >
              Connect Facebook
            </button>
          </div>
        ) : (
          filteredPages.map((page) => {
            const isTesting = testingPageId === page.id;
            return (
              <div
                key={page.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
              >
                {/* Header: Avatar, Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {page.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {page.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        ID: {page.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
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
                </div>

                {/* Details row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{page.category || 'General'}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formatNumber(page.fanCount)} followers
                  </span>
                  <span className="font-mono text-slate-400">
                    Sync: {timeAgo(page.lastSyncAt)}
                  </span>
                </div>

                {/* Actions row: Accessible touch targets >= 44px */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onTestPage(page.id)}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {isTesting ? 'Verifying...' : 'Test Token'}
                  </button>

                  <button
                    onClick={() => onDisconnectPage(page.id)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                    title="Disconnect page"
                    aria-label="Disconnect Facebook page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Tabular Grid (>= 768px: clean data table) */}
      <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {filteredPages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Facebook Pages found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click "Connect Facebook" to authenticate via Meta OAuth or click "Scale Fleet (+50)" to simulate a high-capacity fleet.
            </p>
            <button
              onClick={onConnectFacebook}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[44px]"
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

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {page.id}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {page.category || 'General'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatNumber(page.fanCount)}
                      </td>

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

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {timeAgo(page.lastSyncAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onTestPage(page.id)}
                            disabled={isTesting}
                            className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors disabled:opacity-50"
                            title="Verify Graph API publish token permissions"
                          >
                            {isTesting ? 'Verifying...' : 'Test Token'}
                          </button>

                          <button
                            onClick={() => onDisconnectPage(page.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
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
