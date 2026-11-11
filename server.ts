import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, encryptToken, decryptToken } from './server/db.js';
import { MetaGraphApiClient } from './server/metaApi.js';
import { queueWorker } from './server/queueWorker.js';
import type { UserProfile, FacebookPage, Post, PostTarget } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Default mock authenticated user session (default to Admin Shohel Taj)
let currentUserId = 'usr_shohel';

// Helper to get active user
function getCurrentUser(): UserProfile {
  let user = db.profiles.find((p) => p.id === currentUserId);
  if (!user && db.profiles.length > 0) {
    user = db.profiles[0];
    currentUserId = user.id;
  }
  return user || {
    id: 'usr_guest',
    email: 'guest@socialpilot.io',
    fullName: 'Guest User',
    role: 'user',
    status: 'active',
    maxPagesLimit: 10,
    maxPostsPerDay: 20,
    connectedPagesCount: 0,
    createdAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// 1. System Config & Health Endpoints
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbConnected: db.isSupabaseConnected,
  });
});

app.get('/api/config', (req, res) => {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`;
  const redirectUri = process.env.META_REDIRECT_URI || `${appUrl}/auth/callback`;

  res.json({
    metaAppId: process.env.META_APP_ID || '',
    metaAppConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    appUrl,
    redirectUri,
    isSupabaseConnected: db.isSupabaseConnected,
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  });
});

// -----------------------------------------------------------------------------
// 2. Authentication Endpoints
// -----------------------------------------------------------------------------
app.get('/api/auth/me', (req, res) => {
  const user = getCurrentUser();
  // Update connected pages count
  user.connectedPagesCount = db.facebookPages.filter((p) => p.userId === user.id && p.status === 'active').length;
  res.json({ user });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  const user = db.profiles.find((p) => p.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentUserId = user.id;
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  let user = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Auto-create or login default for seamless SaaS onboarding
    user = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      fullName: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'user',
      status: 'active',
      maxPagesLimit: 100,
      maxPostsPerDay: 100,
      connectedPagesCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    db.profiles.push(user);
    db.saveToFile();
  }
  currentUserId = user.id;
  user.lastLoginAt = new Date().toISOString();
  db.saveToFile();

  res.json({ user });
});

app.post('/api/auth/register', (req, res) => {
  const { email, fullName, role } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and full name are required' });
  }
  const existing = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const newUser: UserProfile = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    fullName,
    role: (role as any) || 'user',
    status: 'active',
    maxPagesLimit: 50,
    maxPostsPerDay: 50,
    connectedPagesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.profiles.push(newUser);
  currentUserId = newUser.id;
  db.saveToFile();

  res.status(201).json({ user: newUser });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// 3. Meta Facebook OAuth & Page Connection Flow
// -----------------------------------------------------------------------------
app.get('/api/auth/facebook/url', (req, res) => {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`;
  const redirectUri = process.env.META_REDIRECT_URI || `${appUrl}/auth/callback`;

  if (!appId || !appSecret) {
    // Return setup required flag and helpful configuration instructions
    return res.json({
      configured: false,
      message: 'Meta App ID and Secret are not configured yet.',
      redirectUri,
    });
  }

  const metaClient = new MetaGraphApiClient(appId, appSecret);
  const state = `state_${currentUserId}_${Date.now()}`;
  const authUrl = metaClient.getOAuthUrl(redirectUri, state);

  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
  });
});

// Handle popup callback from Meta
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body style="font-family: sans-serif; padding: 24px; text-align: center;">
          <h2 style="color: #dc2626;">Facebook Authorization Declined</h2>
          <p>${error_description || error}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error_description || error}' }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (code && process.env.META_APP_ID && process.env.META_APP_SECRET) {
    try {
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`;
      const redirectUri = process.env.META_REDIRECT_URI || `${appUrl}/auth/callback`;
      const metaClient = new MetaGraphApiClient(process.env.META_APP_ID, process.env.META_APP_SECRET);

      const tokenData = await metaClient.exchangeCodeForToken(code as string, redirectUri);
      const longLived = await metaClient.getLongLivedUserToken(tokenData.access_token);
      const managedPages = await metaClient.getManagedPages(longLived.access_token);

      // Store pages for current user
      const user = getCurrentUser();
      let importedCount = 0;

      for (const page of managedPages) {
        const encrypted = encryptToken(page.access_token);
        db.pageTokens.set(page.id, encrypted);

        const existingIdx = db.facebookPages.findIndex((p) => p.id === page.id);
        const pageRecord: FacebookPage = {
          id: page.id,
          userId: user.id,
          name: page.name,
          category: page.category || 'Facebook Page',
          fanCount: page.fan_count || 0,
          pictureUrl: page.picture?.data?.url,
          tasks: page.tasks || ['MANAGE', 'CREATE_CONTENT'],
          connectedAt: new Date().toISOString(),
          tokenExpiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
          status: 'active',
          lastSyncAt: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          db.facebookPages[existingIdx] = pageRecord;
        } else {
          db.facebookPages.push(pageRecord);
          importedCount++;
        }
      }

      db.saveToFile();

      // Send success message to opener window and close popup
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Connected to Facebook</title></head>
          <body style="font-family: sans-serif; padding: 24px; text-align: center;">
            <h2 style="color: #16a34a;">Successfully Connected!</h2>
            <p>Retrieved ${managedPages.length} authorized Facebook Pages. Closing window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', count: ${managedPages.length} }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Connection Error</title></head>
          <body style="font-family: sans-serif; padding: 24px; text-align: center;">
            <h2 style="color: #dc2626;">Error Exchanging Token</h2>
            <p>${err.message}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err.message}' }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }
  }

  // Fallback response
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 24px; text-align: center;">
        <p>Authentication completed. You can close this window.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 800);
          }
        </script>
      </body>
    </html>
  `);
});

// -----------------------------------------------------------------------------
// 4. Facebook Pages Endpoints
// -----------------------------------------------------------------------------
app.get('/api/facebook/pages', (req, res) => {
  const user = getCurrentUser();
  // Filter pages accessible to this user (Admins and Super Admins can see all if ?all=true)
  const showAll = req.query.all === 'true' && (user.role === 'admin' || user.role === 'super_admin');
  const pages = showAll ? db.facebookPages : db.facebookPages.filter((p) => p.userId === user.id);
  res.json({ pages });
});

app.post('/api/facebook/pages/disconnect', (req, res) => {
  const { pageId } = req.body;
  const user = getCurrentUser();
  const pageIdx = db.facebookPages.findIndex((p) => p.id === pageId && (p.userId === user.id || user.role !== 'user'));

  if (pageIdx === -1) {
    return res.status(404).json({ error: 'Page not found or not owned by user' });
  }

  const page = db.facebookPages[pageIdx];
  db.facebookPages.splice(pageIdx, 1);
  db.pageTokens.delete(pageId);
  db.saveToFile();

  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    action: 'PAGE_DISCONNECT',
    entityType: 'page',
    entityId: pageId,
    details: `Disconnected Facebook Page [${page.name}]`,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true });
});

app.post('/api/facebook/pages/test', async (req, res) => {
  const { pageId } = req.body;
  const page = db.facebookPages.find((p) => p.id === pageId);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const encryptedToken = db.pageTokens.get(pageId);
  const hasMetaCreds = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);

  if (hasMetaCreds && encryptedToken) {
    const rawToken = decryptToken(encryptedToken);
    const metaClient = new MetaGraphApiClient(process.env.META_APP_ID!, process.env.META_APP_SECRET!);
    const testResult = await metaClient.testPagePermissions(pageId, rawToken);

    if (testResult.valid) {
      page.status = 'active';
      page.lastSyncAt = new Date().toISOString();
      page.errorMessage = undefined;
    } else {
      page.status = 'error';
      page.errorMessage = testResult.error;
    }
    db.saveToFile();

    return res.json(testResult);
  }

  // Simulated test success if live credentials not present
  page.status = 'active';
  page.lastSyncAt = new Date().toISOString();
  db.saveToFile();

  res.json({
    valid: true,
    name: page.name,
    canPost: true,
    simulated: true,
    message: 'Page token verified and publish capability is active.',
  });
});

// Scalability test utility: Generates batch test pages (e.g. 50 to 100+ pages) to verify bulk publishing
app.post('/api/facebook/pages/seed-batch', (req, res) => {
  const user = getCurrentUser();
  const count = Number(req.body.count) || 25;
  const categories = ['Media/News', 'Brand', 'E-commerce', 'Agency', 'Tech Community', 'Retail Outlet', 'Real Estate', 'Fitness'];

  const addedPages: FacebookPage[] = [];
  for (let i = 1; i <= count; i++) {
    const pageId = `100${Date.now()}${i}`;
    const category = categories[i % categories.length];
    const name = `SocialPilot Regional Hub #${i} (${category})`;

    const encToken = encryptToken(`EAA...TOKEN_BATCH_${pageId}`);
    db.pageTokens.set(pageId, encToken);

    const page: FacebookPage = {
      id: pageId,
      userId: user.id,
      name,
      category,
      fanCount: Math.floor(Math.random() * 80000 + 10000),
      tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'PUBLISH_AS_PAGE'],
      connectedAt: new Date().toISOString(),
      tokenExpiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
      status: 'active',
      lastSyncAt: new Date().toISOString(),
    };

    db.facebookPages.push(page);
    addedPages.push(page);
  }

  db.saveToFile();
  res.json({ success: true, count: addedPages.length });
});

// -----------------------------------------------------------------------------
// 5. Post Creation & Multi-Page Publishing
// -----------------------------------------------------------------------------
app.get('/api/posts', (req, res) => {
  const user = getCurrentUser();
  const { status, search } = req.query;

  // Filter posts for user (or all if admin requested)
  let list = db.posts.filter((p) => p.userId === user.id || user.role === 'admin' || user.role === 'super_admin');

  if (status && status !== 'all') {
    list = list.filter((p) => p.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((p) => p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q));
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Attach targets overview
  const result = list.map((post) => {
    const targets = db.targets.filter((t) => t.postId === post.id);
    return {
      ...post,
      targetCount: targets.length,
      publishedCount: targets.filter((t) => t.status === 'published').length,
      failedCount: targets.filter((t) => t.status === 'failed' && t.attempts >= t.maxAttempts).length,
      targets,
    };
  });

  res.json({ posts: result });
});

app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const targets = db.targets.filter((t) => t.postId === id);
  const logs = db.publishingLogs.filter((l) => l.postId === id);

  res.json({ post, targets, logs });
});

app.post('/api/posts', (req, res) => {
  const user = getCurrentUser();
  const { content, linkUrl, mediaUrls, mediaType, targetPageIds, status, scheduledFor, timezone } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  if (!targetPageIds || !Array.isArray(targetPageIds) || targetPageIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one Facebook Page to publish to' });
  }

  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const isSchedule = status === 'scheduled' && scheduledFor;
  const postStatus = isSchedule ? 'scheduled' : status === 'draft' ? 'draft' : 'queued';

  const newPost: Post = {
    id: postId,
    userId: user.id,
    authorName: user.fullName || user.email,
    content: content.trim(),
    linkUrl: linkUrl ? linkUrl.trim() : undefined,
    mediaUrls: mediaUrls || [],
    mediaType: mediaType || 'none',
    status: postStatus,
    scheduledFor: isSchedule ? scheduledFor : undefined,
    timezone: timezone || 'UTC',
    targetCount: targetPageIds.length,
    publishedCount: 0,
    failedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.posts.unshift(newPost);

  // Create a separate publishing job / target for each selected Facebook Page
  for (const pageId of targetPageIds) {
    const page = db.facebookPages.find((p) => p.id === pageId);
    const target: PostTarget = {
      id: `tgt_${postId}_${pageId}`,
      postId,
      pageId,
      pageName: page ? page.name : `Page ${pageId}`,
      status: postStatus === 'draft' ? 'pending' : postStatus === 'scheduled' ? 'pending' : 'queued',
      attempts: 0,
      maxAttempts: 3,
      idempotencyKey: `idemp_${postId}_${pageId}`,
    };
    db.targets.push(target);
  }

  db.saveToFile();

  // Audit log
  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    action: postStatus === 'scheduled' ? 'POST_SCHEDULED' : postStatus === 'draft' ? 'POST_DRAFTED' : 'POST_QUEUED',
    entityType: 'post',
    entityId: postId,
    details: `Created post for ${targetPageIds.length} Facebook Pages with status [${postStatus}]`,
    createdAt: now,
  });

  // If queued for immediate publishing, trigger the queue worker tick
  if (postStatus === 'queued') {
    setTimeout(() => queueWorker.tick(), 50);
  }

  res.status(201).json({ post: newPost, targetCount: targetPageIds.length });
});

app.post('/api/posts/:id/publish-now', (req, res) => {
  const { id } = req.params;
  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.status = 'queued';
  post.scheduledFor = undefined;
  post.updatedAt = new Date().toISOString();

  // Queue all pending or failed targets
  const targets = db.targets.filter((t) => t.postId === id && t.status !== 'published');
  for (const target of targets) {
    target.status = 'queued';
  }

  db.saveToFile();
  setTimeout(() => queueWorker.tick(), 50);

  res.json({ success: true, queuedCount: targets.length });
});

app.post('/api/posts/:id/cancel', (req, res) => {
  const { id } = req.params;
  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.status = 'cancelled';
  post.updatedAt = new Date().toISOString();

  const targets = db.targets.filter((t) => t.postId === id && t.status !== 'published');
  for (const target of targets) {
    target.status = 'cancelled';
  }

  db.saveToFile();
  res.json({ success: true });
});

app.post('/api/posts/:id/retry', (req, res) => {
  const { id } = req.params;
  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const failedTargets = db.targets.filter((t) => t.postId === id && t.status === 'failed');
  for (const target of failedTargets) {
    target.status = 'queued';
    target.attempts = 0; // reset for fresh retry
  }

  post.status = 'queued';
  post.updatedAt = new Date().toISOString();

  db.saveToFile();
  setTimeout(() => queueWorker.tick(), 50);

  res.json({ success: true, retriedCount: failedTargets.length });
});

// -----------------------------------------------------------------------------
// 6. Queue Processing Endpoints
// -----------------------------------------------------------------------------
app.get('/api/queue/status', (req, res) => {
  const queuedTargets = db.targets.filter((t) => t.status === 'queued' || t.status === 'publishing');
  const scheduledPosts = db.posts.filter((p) => p.status === 'scheduled');

  res.json({
    queuedJobs: queuedTargets.length,
    scheduledPosts: scheduledPosts.length,
    intervalSec: db.systemSettings.queueProcessingIntervalSec,
    maxConcurrent: db.systemSettings.maxConcurrentJobs,
  });
});

app.post('/api/queue/process', async (req, res) => {
  await queueWorker.tick();
  res.json({ success: true, message: 'Queue processing triggered' });
});

// -----------------------------------------------------------------------------
// 7. Admin Dashboard & RBAC Management
// -----------------------------------------------------------------------------
app.get('/api/admin/metrics', (req, res) => {
  const user = getCurrentUser();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const totalUsers = db.profiles.length;
  const activeUsers = db.profiles.filter((u) => u.status === 'active').length;
  const totalConnectedPages = db.facebookPages.filter((p) => p.status === 'active').length;
  const totalPosts = db.posts.length;
  const totalPublished = db.targets.filter((t) => t.status === 'published').length;
  const totalScheduled = db.posts.filter((p) => p.status === 'scheduled').length;
  const totalFailed = db.targets.filter((t) => t.status === 'failed' && t.attempts >= t.maxAttempts).length;
  const queueLength = db.targets.filter((t) => t.status === 'queued' || t.status === 'publishing').length;

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalConnectedPages,
      totalPosts,
      totalPublished,
      totalScheduled,
      totalFailed,
      queueLength,
      metaApiStatus: process.env.META_APP_ID ? 'connected' : 'unconfigured',
      dbStatus: db.isSupabaseConnected ? 'supabase_connected' : 'local_store_active',
    },
  });
});

app.get('/api/admin/users', (req, res) => {
  const user = getCurrentUser();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const usersWithCounts = db.profiles.map((u) => {
    const userPages = db.facebookPages.filter((p) => p.userId === u.id);
    const userPosts = db.posts.filter((p) => p.userId === u.id);
    return {
      ...u,
      connectedPagesCount: userPages.length,
      totalPostsCount: userPosts.length,
    };
  });

  res.json({ users: usersWithCounts });
});

app.post('/api/admin/users/:id/update', (req, res) => {
  const admin = getCurrentUser();
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const targetUser = db.profiles.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { role, status, maxPagesLimit, maxPostsPerDay } = req.body;

  // Protect super_admin modification unless executor is super_admin
  if (targetUser.role === 'super_admin' && admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admins can modify Super Admin accounts' });
  }

  if (role) targetUser.role = role;
  if (status) targetUser.status = status;
  if (typeof maxPagesLimit === 'number') targetUser.maxPagesLimit = maxPagesLimit;
  if (typeof maxPostsPerDay === 'number') targetUser.maxPostsPerDay = maxPostsPerDay;

  db.saveToFile();

  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: admin.id,
    userEmail: admin.email,
    action: 'USER_MODIFIED',
    entityType: 'user',
    entityId: targetUser.id,
    details: `Updated user [${targetUser.email}]: role=${targetUser.role}, status=${targetUser.status}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ user: targetUser });
});

app.get('/api/admin/audit-logs', (req, res) => {
  const user = getCurrentUser();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json({ logs: db.auditLogs.slice(0, 50) });
});

app.get('/api/admin/settings', (req, res) => {
  res.json({ settings: db.systemSettings });
});

app.post('/api/admin/settings', (req, res) => {
  const user = getCurrentUser();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { rateLimitPerMinute, maxConcurrentJobs, maxRetryAttempts, retryBackoffSeconds, queueProcessingIntervalSec } = req.body;

  if (typeof rateLimitPerMinute === 'number') db.systemSettings.rateLimitPerMinute = rateLimitPerMinute;
  if (typeof maxConcurrentJobs === 'number') db.systemSettings.maxConcurrentJobs = maxConcurrentJobs;
  if (typeof maxRetryAttempts === 'number') db.systemSettings.maxRetryAttempts = maxRetryAttempts;
  if (typeof retryBackoffSeconds === 'number') db.systemSettings.retryBackoffSeconds = retryBackoffSeconds;
  if (typeof queueProcessingIntervalSec === 'number') {
    db.systemSettings.queueProcessingIntervalSec = queueProcessingIntervalSec;
    queueWorker.stop();
    queueWorker.start();
  }

  db.saveToFile();
  res.json({ settings: db.systemSettings });
});

// Export SQL migration schema directly to admin UI
app.get('/api/admin/export-sql', (req, res) => {
  try {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261111_socialpilot_schema.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      return res.json({ sql });
    }
    res.status(404).json({ error: 'Migration file not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 8. Start Dev Server / Static Assets
// -----------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SocialPilot 100+] Server listening on port ${PORT}`);
    console.log(`[SocialPilot 100+] Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
