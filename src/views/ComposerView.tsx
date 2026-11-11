import React, { useState, useMemo } from 'react';
import {
  PenSquare,
  Share2,
  Calendar,
  Clock,
  Link2,
  Image as ImageIcon,
  Check,
  Search,
  Send,
  Save,
  Globe,
  ThumbsUp,
  MessageSquare,
  Info,
} from 'lucide-react';
import type { FacebookPage } from '../types';
import { formatNumber } from '../lib/utils';

interface ComposerViewProps {
  pages: FacebookPage[];
  onSubmit: (postData: {
    content: string;
    linkUrl?: string;
    mediaUrls?: string[];
    mediaType?: 'none' | 'image' | 'link';
    targetPageIds: string[];
    status?: 'draft' | 'scheduled' | 'queued';
    scheduledFor?: string;
    timezone?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ComposerView: React.FC<ComposerViewProps> = ({
  pages,
  onSubmit,
  isSubmitting,
}) => {
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'link'>('none');
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    pages.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [pages]);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [pages, searchQuery, categoryFilter]);

  const handleSelectAll = () => {
    const allFilteredIds = filteredPages.map((p) => p.id);
    setSelectedPageIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    const filteredIdSet = new Set(filteredPages.map((p) => p.id));
    setSelectedPageIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
  };

  const togglePage = (pageId: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  const previewPage = useMemo(() => {
    if (selectedPageIds.length > 0) {
      const found = pages.find((p) => p.id === selectedPageIds[0]);
      if (found) return found;
    }
    return pages[0] || {
      id: 'preview_page',
      name: 'Your Facebook Page',
      category: 'Brand / Organization',
    };
  }, [pages, selectedPageIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (selectedPageIds.length === 0) return;

    let scheduledForIso: string | undefined = undefined;
    if (publishMode === 'schedule') {
      if (!scheduledDate) return;
      const combined = `${scheduledDate}T${scheduledTime}:00`;
      scheduledForIso = new Date(combined).toISOString();
    }

    await onSubmit({
      content,
      linkUrl: mediaType === 'link' ? linkUrl : undefined,
      mediaUrls: mediaType === 'image' && mediaUrl ? [mediaUrl] : undefined,
      mediaType,
      targetPageIds: selectedPageIds,
      status: publishMode === 'draft' ? 'draft' : publishMode === 'schedule' ? 'scheduled' : 'queued',
      scheduledFor: scheduledForIso,
      timezone,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Create & Distribute Multi-Page Post
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compose once, select target Facebook Pages (100–1000+), and distribute via official Meta Graph API.
          </p>
        </div>

        {/* Selected target counter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Selected:
          </span>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {selectedPageIds.length} / {pages.length} Pages
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Post Editor & Fleet Controls (7 Cols on desktop, 1 col on mobile) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Main Content Card */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Post Copy
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {content.length} chars
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening? Write your post message for all connected Facebook Pages..."
                rows={5}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[120px]"
                required
              />
            </div>

            {/* Media Attachment Selector (Mobile-friendly stacked or 3-col) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Attachment Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('none')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium min-h-[44px] flex items-center justify-center transition-all ${
                    mediaType === 'none'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Text Only
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('link')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium min-h-[44px] flex items-center justify-center gap-1.5 transition-all ${
                    mediaType === 'link'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Link Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-medium min-h-[44px] flex items-center justify-center gap-1.5 transition-all ${
                    mediaType === 'image'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo / Image</span>
                </button>
              </div>

              {mediaType === 'link' && (
                <div className="mt-3">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/announcement"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              {mediaType === 'image' && (
                <div className="mt-3">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Image URL (e.g. https://... or public CDN link)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Target Page Selection (Optimized for 100-1000+ pages & small touchscreens) */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-500" />
                  Target Facebook Pages Fleet
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Individual publishing job created per page with idempotency.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 min-h-[44px] flex items-center transition-colors"
                >
                  Select All ({filteredPages.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 min-h-[44px] flex items-center transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter 100+ pages by name..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs min-h-[44px] focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Page Checkbox List with accessible touch target rows */}
            <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPages.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No Facebook Pages found matching filter.
                </div>
              ) : (
                filteredPages.map((page) => {
                  const isChecked = selectedPageIds.includes(page.id);
                  return (
                    <div
                      key={page.id}
                      onClick={() => togglePage(page.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer min-h-[48px] transition-colors ${
                        isChecked
                          ? 'bg-blue-50/40 dark:bg-blue-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {page.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {page.category || 'Page'} · <span className="font-mono">ID: {page.id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatNumber(page.fanCount)} fans
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Publishing Mode & Scheduling */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 sm:space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Distribution Schedule & Dispatch
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPublishMode('now')}
                className={`py-3 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-all ${
                  publishMode === 'now'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Publish Now</span>
              </button>

              <button
                type="button"
                onClick={() => setPublishMode('schedule')}
                className={`py-3 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-all ${
                  publishMode === 'schedule'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Post</span>
              </button>

              <button
                type="button"
                onClick={() => setPublishMode('draft')}
                className={`py-3 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-all ${
                  publishMode === 'draft'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
            </div>

            {publishMode === 'schedule' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none"
                    required={publishMode === 'schedule'}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none"
                    required={publishMode === 'schedule'}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || selectedPageIds.length === 0}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Dispatching Pipeline...</span>
              ) : (
                <span className="truncate">
                  {publishMode === 'now'
                    ? `Publish to ${selectedPageIds.length} Facebook Pages`
                    : publishMode === 'schedule'
                    ? `Schedule for ${selectedPageIds.length} Pages`
                    : 'Save Multi-Page Draft'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Facebook Feed Post Preview */}
        <div className="lg:col-span-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Meta Facebook Feed Preview
            </h3>
            <span className="text-[10px] text-slate-400">
              Responsive Preview
            </span>
          </div>

          {/* Facebook Post Mockup Container (max-w-full on mobile) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden w-full max-w-full">
            {/* Post Header */}
            <div className="p-3.5 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0">
                {previewPage.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {previewPage.name}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Just now</span>
                  <span aria-hidden="true">·</span>
                  <Globe className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Post Body Message */}
            <div className="px-3.5 sm:px-4 pb-3">
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words">
                {content || 'Your Facebook post content will appear here in real-time as you type...'}
              </p>
            </div>

            {/* Post Media Attachment */}
            {mediaType === 'image' && mediaUrl && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 max-h-72 overflow-hidden flex items-center justify-center">
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-full object-cover max-h-72"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {mediaType === 'link' && linkUrl && (
              <div className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase truncate block">
                  {new URL(linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`).hostname}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  Preview Attachment Title
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  Official published link card generated by Meta Facebook OpenGraph scraper.
                </p>
              </div>
            )}

            {/* Facebook Action Bar */}
            <div className="px-3.5 sm:px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-default">
                <ThumbsUp className="w-4 h-4" />
                <span>Like</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-default">
                <MessageSquare className="w-4 h-4" />
                <span>Comment</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-default">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </div>
            </div>
          </div>

          {/* Publishing Info Callout */}
          <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Multi-Page Idempotency Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
              When dispatched, SocialPilot 100+ creates distinct publishing jobs with cryptographic idempotency keys to ensure zero duplicate publications across high-volume networks.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
