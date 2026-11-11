export type UserRole = 'super_admin' | 'admin' | 'user';

export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  maxPagesLimit: number;
  maxPostsPerDay: number;
  connectedPagesCount: number;
  totalPostsCount?: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface FacebookPage {
  id: string; // Meta Page ID
  userId: string;
  name: string;
  category?: string;
  categoryList?: Array<{ id: string; name: string }>;
  fanCount?: number;
  pictureUrl?: string;
  perms?: string[]; // e.g. ["ADMINISTER", "EDIT_PROFILE", "CREATE_CONTENT", "MODERATE", "PUBLISH_AS_PAGE"]
  tasks?: string[]; // Graph API v19+ tasks: ["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"]
  connectedAt: string;
  tokenExpiresAt?: string;
  status: 'active' | 'expired' | 'error' | 'disconnected';
  lastSyncAt: string;
  errorMessage?: string;
}

export type PostStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'queued' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

export type JobStatus = 
  | 'pending' 
  | 'queued' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

export interface PostTarget {
  id: string;
  postId: string;
  pageId: string;
  pageName: string;
  pagePictureUrl?: string;
  status: JobStatus;
  facebookPostId?: string;
  publishedAt?: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  metaErrorCode?: number;
  metaErrorSubcode?: number;
  idempotencyKey: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  content: string;
  linkUrl?: string;
  mediaUrls?: string[];
  mediaType?: 'none' | 'image' | 'link';
  status: PostStatus;
  scheduledFor?: string;
  timezone: string;
  targetCount: number;
  publishedCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  targets?: PostTarget[];
}

export interface PublishingLog {
  id: string;
  postId: string;
  jobId: string;
  pageId: string;
  pageName: string;
  userId: string;
  action: 'publish_attempt' | 'publish_success' | 'publish_failed' | 'publish_retry' | 'cancelled';
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: 'post' | 'page' | 'user' | 'system';
  entityId?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalConnectedPages: number;
  totalPosts: number;
  totalPublished: number;
  totalScheduled: number;
  totalFailed: number;
  queueLength: number;
  metaApiStatus: 'connected' | 'unconfigured' | 'rate_limited' | 'error';
  dbStatus: 'supabase_connected' | 'local_store_active';
}

export interface SystemSettings {
  metaAppId: string;
  metaAppConfigured: boolean;
  rateLimitPerMinute: number;
  maxConcurrentJobs: number;
  maxRetryAttempts: number;
  retryBackoffSeconds: number;
  queueProcessingIntervalSec: number;
  logRetentionDays: number;
}
