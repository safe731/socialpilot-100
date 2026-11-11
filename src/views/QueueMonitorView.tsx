import React from 'react';
import {
  Layers,
  Play,
  RotateCcw,
  Server,
  Zap,
} from 'lucide-react';
import type { PostTarget, PublishingLog } from '../types';
import { formatDate } from '../lib/utils';

interface QueueMonitorViewProps {
  queuedTargets: PostTarget[];
  logs: PublishingLog[];
  onTriggerTick: () => void;
  isTriggering: boolean;
  intervalSec: number;
  maxConcurrent: number;
}

export const QueueMonitorView: React.FC<QueueMonitorViewProps> = ({
  queuedTargets,
  logs,
  onTriggerTick,
  isTriggering,
  intervalSec,
  maxConcurrent,
}) => {
  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Publishing Queue & Background Engine
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time worker daemon executing scheduled distributions, managing rate limits, and handling exponential backoff.
          </p>
        </div>

        <button
          onClick={onTriggerTick}
          disabled={isTriggering}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 self-start sm:self-auto"
        >
          <Play className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
          <span>{isTriggering ? 'Executing Tick...' : 'Trigger Immediate Tick'}</span>
        </button>
      </div>

      {/* Engine Status KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Worker Status</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Daemon
          </p>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">
            Poll interval: {intervalSec}s loop
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">In-Flight Jobs</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {queuedTargets.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Locked & processing
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Concurrency Limit</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {maxConcurrent} workers
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Prevents Meta API rate spikes
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Retry Strategy</span>
            <RotateCcw className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Exp. Backoff
          </p>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">
            5s · 15s · 45s (Max 3)
          </p>
        </div>
      </div>

      {/* Live Publishing Stream & Target Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Active Queued Targets */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Queued & Publishing Targets ({queuedTargets.length})
          </h3>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {queuedTargets.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-xs text-slate-400">
                Queue is clear. No publications currently in progress.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {queuedTargets.map((target) => (
                  <div key={target.id} className="p-3 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {target.pageName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        Post ID: {target.postId} · Attempt {target.attempts}/{target.maxAttempts}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded shrink-0 ${
                        target.status === 'publishing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {target.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Meta Graph API Execution Logs */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Live Meta Graph API Execution Stream
          </h3>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-950 p-3 sm:p-4 shadow-xs text-slate-300 font-mono text-xs max-h-80 overflow-y-auto space-y-2 max-w-full">
            {logs.length === 0 ? (
              <p className="text-slate-600">No logs in stream.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="leading-relaxed border-b border-slate-900/60 pb-1.5 last:border-none break-words">
                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-1">
                    <span>{formatDate(log.createdAt)}</span>
                    <span className="text-slate-400 truncate max-w-[160px]">Node: {log.pageName}</span>
                  </div>
                  <div className="mt-0.5 break-words">
                    <span
                      className={`font-bold ${
                        log.status === 'success'
                          ? 'text-emerald-400'
                          : log.status === 'error'
                          ? 'text-rose-400'
                          : 'text-blue-400'
                      }`}
                    >
                      [{log.action.toUpperCase()}]
                    </span>{' '}
                    <span>{log.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
