import type { UserProfile, FacebookPage, Post, PostTarget, PublishingLog, AuditLog, SystemSettings, PlatformMetrics } from '../types';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Config
  getConfig: () => request<{
    metaAppId: string;
    metaAppConfigured: boolean;
    appUrl: string;
    redirectUri: string;
    isSupabaseConnected: boolean;
    supabaseUrl: string;
  }>('/api/config'),

  // Auth & Session
  getMe: () => request<{ user: UserProfile }>('/api/auth/me'),
  switchUser: (userId: string) => request<{ user: UserProfile }>('/api/auth/switch-user', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
  login: (email: string, password?: string) => request<{ user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (data: { email: string; fullName: string; role?: string }) => request<{ user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Meta OAuth & Pages
  getFacebookAuthUrl: () => request<{ configured: boolean; url?: string; redirectUri: string; message?: string }>('/api/auth/facebook/url'),
  getPages: (all = false) => request<{ pages: FacebookPage[] }>(`/api/facebook/pages${all ? '?all=true' : ''}`),
  disconnectPage: (pageId: string) => request<{ success: boolean }>('/api/facebook/pages/disconnect', {
    method: 'POST',
    body: JSON.stringify({ pageId }),
  }),
  testPage: (pageId: string) => request<{ valid: boolean; name?: string; canPost?: boolean; error?: string; message?: string }>('/api/facebook/pages/test', {
    method: 'POST',
    body: JSON.stringify({ pageId }),
  }),
  seedBatchPages: (count = 25) => request<{ success: boolean; count: number }>('/api/facebook/pages/seed-batch', {
    method: 'POST',
    body: JSON.stringify({ count }),
  }),

  // Posts & Publishing
  getPosts: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ posts: Post[] }>(`/api/posts${query}`);
  },
  getPost: (id: string) => request<{ post: Post; targets: PostTarget[]; logs: PublishingLog[] }>(`/api/posts/${id}`),
  createPost: (data: {
    content: string;
    linkUrl?: string;
    mediaUrls?: string[];
    mediaType?: 'none' | 'image' | 'link';
    targetPageIds: string[];
    status?: 'draft' | 'scheduled' | 'queued';
    scheduledFor?: string;
    timezone?: string;
  }) => request<{ post: Post; targetCount: number }>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  publishNow: (postId: string) => request<{ success: boolean; queuedCount: number }>(`/api/posts/${postId}/publish-now`, {
    method: 'POST',
  }),
  cancelPost: (postId: string) => request<{ success: boolean }>(`/api/posts/${postId}/cancel`, {
    method: 'POST',
  }),
  retryPost: (postId: string) => request<{ success: boolean; retriedCount: number }>(`/api/posts/${postId}/retry`, {
    method: 'POST',
  }),

  // Queue
  getQueueStatus: () => request<{ queuedJobs: number; scheduledPosts: number; intervalSec: number; maxConcurrent: number }>('/api/queue/status'),
  processQueue: () => request<{ success: boolean; message: string }>('/api/queue/process', {
    method: 'POST',
  }),

  // Admin
  getAdminMetrics: () => request<{ metrics: PlatformMetrics }>('/api/admin/metrics'),
  getAdminUsers: () => request<{ users: (UserProfile & { connectedPagesCount: number; totalPostsCount: number })[] }>('/api/admin/users'),
  updateAdminUser: (id: string, updates: Partial<UserProfile>) => request<{ user: UserProfile }>(`/api/admin/users/${id}/update`, {
    method: 'POST',
    body: JSON.stringify(updates),
  }),
  getAdminSettings: () => request<{ settings: SystemSettings }>('/api/admin/settings'),
  updateAdminSettings: (updates: Partial<SystemSettings>) => request<{ settings: SystemSettings }>('/api/admin/settings', {
    method: 'POST',
    body: JSON.stringify(updates),
  }),
  getAdminAuditLogs: () => request<{ logs: AuditLog[] }>('/api/admin/audit-logs'),
  getExportSql: () => request<{ sql: string }>('/api/admin/export-sql'),
};
