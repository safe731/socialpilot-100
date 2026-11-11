import React from 'react';
import {
  X,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ExternalLink,
  Layers,
} from 'lucide-react';
import type { Post, PostTarget, PublishingLog } from '../types';
import { formatDate } from '../lib/utils';

interface PostDetailModalProps {
  post: Post | null;
  targets: PostTarget[];
  logs: PublishingLog[];
  onClose: () => void;
  onRetry: (postId: string) => void;
  onPublishNow: (postId: string) => void;
  onCancel: (postId: string) => void;
  isActionLoading: boolean;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  targets,
  logs,
  onClose,
  onRetry,
  onPublishNow,
  onCancel,
  isActionLoading,
}) => {
  if (!post) return null;

  const hasFailed = targets.some((t) => t.status === 'failed');
  const canPublishNow = post.status === 'draft' || post.status === 'scheduled';
  const canCancel = post.status === 'scheduled' || post.status === 'queued';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Multi-Page Distribution Breakdown
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
                Post ID: {post.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Post Message & Meta */}
          <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Author: {post.authorName}
              </span>
              <span className="font-mono">{formatDate(post.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words">
              {post.content}
            </p>
            {post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1 break-all"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>{post.linkUrl}</span>
              </a>
            )}
          </div>

          {/* Quick Metrics Bar (Responsive 2x2 on mobile, 4 in a row on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] sm:text-[11px] text-slate-400">Total Targets</span>
              <p className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {targets.length}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400">Published</span>
              <p className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {targets.filter((t) => t.status === 'published').length}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
              <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400">In Queue</span>
              <p className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {targets.filter((t) => t.status === 'queued' || t.status === 'pending').length}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
              <span className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400">Failed</span>
              <p className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {targets.filter((t) => t.status === 'failed').length}
              </p>
            </div>
          </div>

          {/* Target Pages Table / Cards */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Target Facebook Pages & Delivery Status
              </h4>
              {hasFailed && (
                <button
                  onClick={() => onRetry(post.id)}
                  disabled={isActionLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 min-h-[44px] self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Failed Targets</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {targets.map((tgt) => (
                <div key={tgt.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <Share2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tgt.pageName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        ID: {tgt.pageId} · Attempts: {tgt.attempts}/{tgt.maxAttempts}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
                    {tgt.facebookPostId && (
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                        FB: {tgt.facebookPostId}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        tgt.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : tgt.status === 'failed'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {tgt.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                      {tgt.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                      {tgt.status === 'queued' && <Clock className="w-3 h-3" />}
                      {tgt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publishing Activity Logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Execution Audit Log (Meta Graph API)
            </h4>
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1.5">
              {logs.length === 0 ? (
                <p className="text-slate-500">No execution logs recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="leading-relaxed break-words">
                    <span className="text-slate-500">[{formatDate(log.createdAt)}]</span>{' '}
                    <span
                      className={
                        log.status === 'success'
                          ? 'text-emerald-400 font-bold'
                          : log.status === 'error'
                          ? 'text-rose-400 font-bold'
                          : 'text-blue-400 font-bold'
                      }
                    >
                      [{log.action}]
                    </span>{' '}
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions (Responsive Stacking & >= 44px buttons) */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {canPublishNow && (
              <button
                onClick={() => onPublishNow(post.id)}
                disabled={isActionLoading}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50"
              >
                Publish All Targets Now
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => onCancel(post.id)}
                disabled={isActionLoading}
                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50"
              >
                Cancel Distribution
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium min-h-[44px] flex items-center justify-center transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
