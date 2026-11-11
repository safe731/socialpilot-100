import React, { useState } from 'react';
import {
  BookOpen,
  Share2,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface SetupGuidesViewProps {
  appUrl: string;
  redirectUri: string;
  metaAppId: string;
}

export const SetupGuidesView: React.FC<SetupGuidesViewProps> = ({
  appUrl,
  redirectUri,
  metaAppId,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Integration, Meta Developer & Deployment Guides
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete production setup checklist for Meta App Review, Supabase PostgreSQL (<code className="font-mono">socialpilot-100</code>), and Vercel hosting.
        </p>
      </div>

      {/* Guide 1: Meta Developer App Setup */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Meta Developer App: "SocialPilot 100" Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Configure OAuth Redirect URIs, App Secret, and Page Publishing Permissions.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <p>
            1. Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">Meta Developer Portal <ExternalLink className="w-3 h-3" /></a> and open your app <strong>SocialPilot 100</strong>.
          </p>

          <p>
            2. In the left sidebar, navigate to <strong>Facebook Login for Business</strong> (or Facebook Login) → <strong>Settings</strong>.
          </p>

          <p>
            3. In the <strong>Valid OAuth Redirect URIs</strong> field, add your exact container callback URL:
          </p>

          <div className="p-2.5 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs flex items-center justify-between">
            <span className="truncate pr-2">{redirectUri}</span>
            <button
              onClick={() => copyToClipboard(redirectUri, 'redirect')}
              className="p-1 hover:text-white text-slate-400 shrink-0"
              title="Copy URI"
            >
              {copiedKey === 'redirect' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p>
            4. In <strong>App Settings</strong> → <strong>Basic</strong>, copy your <strong>App ID</strong> and <strong>App Secret</strong> into your environment variables:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs space-y-1">
            <p>META_APP_ID="your_meta_app_id"</p>
            <p>META_APP_SECRET="your_meta_app_secret"</p>
            <p>META_REDIRECT_URI="{redirectUri}"</p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Meta Graph API Permission & App Review Notes
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              <li>
                <strong>Development Mode</strong>: Admins, Developers, and Testers added to the Meta App can connect their managed Facebook Pages immediately without App Review!
              </li>
              <li>
                <strong>Production / Live Mode (Advanced Access)</strong>: To allow external users to connect their pages, submit an App Review for <code className="font-mono">pages_manage_posts</code> and <code className="font-mono">pages_read_engagement</code>.
              </li>
              <li>
                <strong>Timeline Policy</strong>: Standard Meta Graph API does not support automated personal profile timeline publishing. Only authorized Facebook Pages can be published to.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Guide 2: Supabase Setup */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Supabase PostgreSQL Project: "socialpilot-100"
            </h3>
            <p className="text-xs text-slate-400">
              Apply database migrations and Row Level Security policies.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <p>
            1. Open your Supabase project <strong>socialpilot-100</strong> at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">supabase.com/dashboard <ExternalLink className="w-3 h-3" /></a>.
          </p>

          <p>
            2. Go to <strong>SQL Editor</strong> → click <strong>New Query</strong>.
          </p>

          <p>
            3. Switch to the <strong>Admin Console → Supabase SQL Schema</strong> tab in this app, copy the generated migration script, paste it into the Supabase SQL editor, and click <strong>Run</strong>.
          </p>

          <p>
            4. Go to <strong>Project Settings</strong> → <strong>API</strong> and copy your credentials into <code className="font-mono">.env</code>:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs space-y-1">
            <p>NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-publishable-key"</p>
            <p>SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"</p>
          </div>
        </div>
      </div>

      {/* Guide 3: Vercel Deployment & GitHub */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3. GitHub & Vercel Production Deployment
            </h3>
            <p className="text-xs text-slate-400">
              Deploy to Vercel and synchronize with repository ShohelTajBhola/socialpilot.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <p>
            1. Repository: <a href="https://github.com/ShohelTajBhola/socialpilot" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono">https://github.com/ShohelTajBhola/socialpilot</a>.
          </p>
          <p>
            2. In Vercel Project Settings, add all Environment Variables from <code className="font-mono">.env.example</code>.
          </p>
          <p>
            3. Scheduled Publishing on Vercel: Vercel Cron Jobs can trigger <code className="font-mono">/api/queue/process</code> every minute by adding a <code className="font-mono">vercel.json</code> cron configuration:
          </p>

          <div className="p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs">
            <pre>{`{
  "crons": [
    {
      "path": "/api/queue/process",
      "schedule": "* * * * *"
    }
  ]
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
