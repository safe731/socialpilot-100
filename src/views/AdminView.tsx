import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Settings,
  Database,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit2,
  Copy,
  Check,
  Save,
  Activity,
} from 'lucide-react';
import type { UserProfile, SystemSettings, AuditLog, PlatformMetrics } from '../types';
import { formatDate, timeAgo } from '../lib/utils';

interface AdminViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  settings: SystemSettings | null;
  metrics: PlatformMetrics | null;
  auditLogs: AuditLog[];
  migrationSql: string;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  onUpdateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  users,
  settings,
  metrics,
  auditLogs,
  migrationSql,
  onUpdateUser,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'audit' | 'sql'>('users');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form states for settings
  const [rateLimit, setRateLimit] = useState(settings?.rateLimitPerMinute || 200);
  const [concurrency, setConcurrency] = useState(settings?.maxConcurrentJobs || 5);
  const [maxRetries, setMaxRetries] = useState(settings?.maxRetryAttempts || 3);
  const [backoffSec, setBackoffSec] = useState(settings?.retryBackoffSeconds || 5);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(migrationSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await onUpdateSettings({
        rateLimitPerMinute: Number(rateLimit),
        maxConcurrentJobs: Number(concurrency),
        maxRetryAttempts: Number(maxRetries),
        retryBackoffSeconds: Number(backoffSec),
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await onUpdateUser(editingUser.id, {
      role: editingUser.role,
      status: editingUser.status,
      maxPagesLimit: Number(editingUser.maxPagesLimit),
      maxPostsPerDay: Number(editingUser.maxPostsPerDay),
    });
    setEditingUser(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              System Administration & Role Governance
            </h2>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
              {currentUser.role.replace('_', ' ')} Access
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authorized users, assign RBAC permissions, configure Meta rate-limits, and audit security events.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { id: 'users', label: 'User Directory & RBAC', icon: Users },
            { id: 'settings', label: 'Platform Engine Settings', icon: Settings },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
            { id: 'sql', label: 'Supabase SQL Schema', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: User Management Table */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Page Limit</th>
                  <th className="py-3 px-4">Posts / Day Limit</th>
                  <th className="py-3 px-4">Connected Pages</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                          {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {u.maxPagesLimit} pages
                    </td>

                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {u.maxPostsPerDay} posts/day
                    </td>

                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {u.connectedPagesCount}
                      </span>{' '}
                      pages
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                      >
                        Edit Limits & Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: System Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Queue & Rate Limiting Thresholds
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Meta Graph API Rate Limit (Calls / Minute)
                </label>
                <input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  min={10}
                  max={1000}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Meta Graph API standard tier limit is ~200 calls/hr per user/page.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Max Concurrent Publishing Jobs
                </label>
                <input
                  type="number"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  min={1}
                  max={25}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Max Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Retry Backoff Base (Seconds)
                  </label>
                  <input
                    type="number"
                    value={backoffSec}
                    onChange={(e) => setBackoffSec(Number(e.target.value))}
                    min={1}
                    max={60}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving Settings...' : 'Save System Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {log.userEmail}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono uppercase text-[10px] text-slate-500">
                    {log.entityType}
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Supabase PostgreSQL Migration Script */}
      {activeTab === 'sql' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Production Supabase PostgreSQL Migration (20261111_socialpilot_schema.sql)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste directly into Supabase Dashboard &rarr; SQL Editor for project <span className="font-mono font-bold text-slate-700 dark:text-slate-300">socialpilot-100</span>.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>

          <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-950 p-4 max-h-[600px] overflow-y-auto">
            <pre className="font-mono text-xs text-emerald-400 whitespace-pre leading-relaxed">
              {migrationSql}
            </pre>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit User Privileges & Capacity Limits
            </h3>
            <p className="text-xs text-slate-400 font-mono">{editingUser.email}</p>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  User Role (RBAC)
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                >
                  <option value="user">User (Standard Publisher)</option>
                  <option value="admin">Admin (Manage Users & Fleet)</option>
                  <option value="super_admin">Super Admin (Full Root Governance)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Account Status
                </label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Max Connected Facebook Pages Limit
                </label>
                <input
                  type="number"
                  value={editingUser.maxPagesLimit}
                  onChange={(e) => setEditingUser({ ...editingUser, maxPagesLimit: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Max Daily Posts Allowed
                </label>
                <input
                  type="number"
                  value={editingUser.maxPostsPerDay}
                  onChange={(e) => setEditingUser({ ...editingUser, maxPostsPerDay: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
