import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthModalProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (userId: string) => Promise<void>;
  onLogin: (email: string) => Promise<void>;
  onRegister: (data: { email: string; fullName: string; role?: string }) => Promise<void>;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
  onRegister,
  onClose,
}) => {
  const [mode, setMode] = useState<'switch' | 'new'>('switch');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | 'super_admin'>('user');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    setLoading(true);
    try {
      await onRegister({ email, fullName, role });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (userId: string) => {
    setLoading(true);
    try {
      await onSwitchUser(userId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-[calc(100vw-24px)] sm:w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Identity & Role Switcher
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Session: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.fullName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector (min 40px touch targets) */}
        <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setMode('switch')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all min-h-[40px] flex items-center justify-center ${
              mode === 'switch'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Preset Profiles
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all min-h-[40px] flex items-center justify-center ${
              mode === 'new'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            New Account
          </button>
        </div>

        {mode === 'switch' ? (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">
              Select an account to test permissions, isolated fleets, and role capabilities:
            </p>

            <div className="space-y-2">
              {availableUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => !isCurrent && handleQuickSwitch(u.id)}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between min-h-[48px] cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 cursor-default'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        {u.fullName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {u.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@agency.com"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Initial Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px] focus:outline-none"
              >
                <option value="user">User (Social Media Publisher)</option>
                <option value="admin">Admin (Manage Team & Pages)</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !fullName}
              className="w-full py-3 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors min-h-[44px] disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating...' : 'Register Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
