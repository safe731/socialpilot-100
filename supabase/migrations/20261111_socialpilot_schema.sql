-- ==============================================================================
-- Migration: 20261111_socialpilot_schema.sql
-- Project: SocialPilot 100+
-- Description: Complete multi-user schema for Meta Facebook Page publishing,
--              queue management, RBAC, RLS policies, encrypted tokens, and audit logs.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  max_pages_limit INTEGER NOT NULL DEFAULT 50,
  max_posts_per_day INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER ROLES (Explicit RBAC Tracking)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
  granted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, role)
);

-- 3. SOCIAL ACCOUNTS (Meta User Connections)
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'facebook' CHECK (provider = 'facebook'),
  provider_account_id TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  email TEXT,
  access_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, provider, provider_account_id)
);

-- 4. FACEBOOK PAGES (Connected Pages, supporting 100-1000+ per user)
CREATE TABLE IF NOT EXISTS public.facebook_pages (
  id TEXT PRIMARY KEY, -- Facebook Page ID string
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  fan_count INTEGER DEFAULT 0,
  picture_url TEXT,
  tasks TEXT[] NOT NULL DEFAULT '{}',
  access_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'disconnected')),
  error_message TEXT,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ENCRYPTED TOKENS (Secure token storage vault)
CREATE TABLE IF NOT EXISTS public.encrypted_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user_token', 'page_token')),
  entity_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  iv TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. POSTS (Parent post record)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  link_url TEXT,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT NOT NULL DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'link')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'queued', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  target_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. POST TARGETS (One row per target Facebook Page)
CREATE TABLE IF NOT EXISTS public.post_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'publishing', 'published', 'failed', 'cancelled')),
  facebook_post_id TEXT,
  published_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  meta_error_code INTEGER,
  meta_error_subcode INTEGER,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. PUBLISHING JOBS (Queue worker queue items)
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.post_targets(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'publishing', 'published', 'failed', 'cancelled')),
  run_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. PUBLISHING LOGS (Fine-grained audit per page attempt)
CREATE TABLE IF NOT EXISTS public.publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  job_id UUID,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('publish_attempt', 'publish_success', 'publish_failed', 'publish_retry', 'cancelled')),
  status TEXT NOT NULL CHECK (status IN ('info', 'success', 'warning', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. AUDIT LOGS (Platform-wide user actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'page', 'user', 'system')),
  entity_id TEXT,
  details TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT QUEUE AND 1000+ PAGE PUBLISHING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_facebook_pages_user ON public.facebook_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_status ON public.facebook_pages(status);
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON public.posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON public.posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_post_targets_post ON public.post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_page ON public.post_targets(page_id);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_worker ON public.publishing_jobs(status, run_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_target ON public.publishing_jobs(target_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_post ON public.publishing_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin/super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users see own, Admins see all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Facebook Pages: Users manage own pages, Admins view all
CREATE POLICY "Users manage own pages" ON public.facebook_pages
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Posts: Users manage own posts, Admins view all
CREATE POLICY "Users manage own posts" ON public.posts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Post Targets: Accessible if parent post accessible
CREATE POLICY "Users access own post targets" ON public.post_targets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_targets.post_id AND (posts.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Publishing Jobs & Logs: User isolation
CREATE POLICY "Users access own publishing jobs" ON public.publishing_jobs
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users access own publishing logs" ON public.publishing_logs
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Audit Logs: Admins see all, users see own
CREATE POLICY "Audit logs visible to owner or admin" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- System Settings: Read by authenticated, write by admin
CREATE POLICY "Authenticated users view settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins update settings" ON public.system_settings
  FOR ALL USING (public.is_admin());

-- ==============================================================================
-- INITIAL SYSTEM SETTINGS SEED
-- ==============================================================================
INSERT INTO public.system_settings (key, value)
VALUES
  ('general', '{"platformName": "SocialPilot 100+", "supportEmail": "soheltajbhola@gmail.com", "maxPagesPerUser": 1000}'::jsonb),
  ('meta_api', '{"apiVersion": "v19.0", "rateLimitPerMinute": 200, "maxRetryAttempts": 3, "retryBackoffSeconds": 5}'::jsonb),
  ('queue', '{"workerIntervalSec": 5, "batchSize": 25, "jobLockTimeoutSec": 60}'::jsonb)
ON CONFLICT (key) DO NOTHING;
