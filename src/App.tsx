import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastProvider, useToast } from './components/Toast';
import { DashboardView } from './views/DashboardView';
import { ComposerView } from './views/ComposerView';
import { PostsListView } from './views/PostsListView';
import { PagesManagerView } from './views/PagesManagerView';
import { QueueMonitorView } from './views/QueueMonitorView';
import { AdminView } from './views/AdminView';
import { SetupGuidesView } from './views/SetupGuidesView';
import { PostDetailModal } from './views/PostDetailModal';
import { AuthModal } from './components/AuthModal';
import { api } from './lib/api';
import type { UserProfile, FacebookPage, Post, PostTarget, PublishingLog, AuditLog, SystemSettings, PlatformMetrics } from './types';

function MainApp() {
  const { success, error, info } = useToast();

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [queuedTargets, setQueuedTargets] = useState<PostTarget[]>([]);
  const [queueLogs, setQueueLogs] = useState<PublishingLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [migrationSql, setMigrationSql] = useState<string>('');

  // Config
  const [config, setConfig] = useState<{
    metaAppId: string;
    metaAppConfigured: boolean;
    appUrl: string;
    redirectUri: string;
    isSupabaseConnected: boolean;
  }>({
    metaAppId: '',
    metaAppConfigured: false,
    appUrl: '',
    redirectUri: '',
    isSupabaseConnected: false,
  });

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [testingPageId, setTestingPageId] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isQueueTriggering, setIsQueueTriggering] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected post for detail modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostTargets, setSelectedPostTargets] = useState<PostTarget[]>([]);
  const [selectedPostLogs, setSelectedPostLogs] = useState<PublishingLog[]>([]);
  const [isPostActionLoading, setIsPostActionLoading] = useState(false);

  // Load initial data
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [cfgRes, meRes, pagesRes, postsRes, queueStatusRes] = await Promise.all([
        api.getConfig(),
        api.getMe(),
        api.getPages(),
        api.getPosts(),
        api.getQueueStatus(),
      ]);

      setConfig(cfgRes);
      setCurrentUser(meRes.user);
      setPages(pagesRes.pages);
      setPosts(postsRes.posts);

      // If user is admin/super_admin, load admin metrics
      if (meRes.user.role === 'admin' || meRes.user.role === 'super_admin') {
        const [metricsRes, adminUsersRes, settingsRes, auditRes, sqlRes] = await Promise.all([
          api.getAdminMetrics().catch(() => ({ metrics: null })),
          api.getAdminUsers().catch(() => ({ users: [] })),
          api.getAdminSettings().catch(() => ({ settings: null })),
          api.getAdminAuditLogs().catch(() => ({ logs: [] })),
          api.getExportSql().catch(() => ({ sql: '' })),
        ]);

        if (metricsRes.metrics) setMetrics(metricsRes.metrics);
        if (adminUsersRes.users) setAvailableUsers(adminUsersRes.users);
        if (settingsRes.settings) setSettings(settingsRes.settings);
        if (auditRes.logs) setAuditLogs(auditRes.logs);
        if (sqlRes.sql) setMigrationSql(sqlRes.sql);
      }
    } catch (err: any) {
      console.error('Data load error:', err);
      if (!quiet) error('Connection Error', err.message);
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
    // Background polling for queue and post status
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Listen for popup OAuth messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        success('Facebook Connected', `Imported authorized Facebook Pages successfully.`);
        loadData();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        error('Facebook OAuth Error', event.data.error || 'Authorization failed');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [success, error, loadData]);

  // Handle Meta Facebook OAuth Connect
  const handleConnectFacebook = async () => {
    setIsConnectingMeta(true);
    try {
      const authRes = await api.getFacebookAuthUrl();

      if (!authRes.configured || !authRes.url) {
        info(
          'Meta App Setup Guide',
          'Add META_APP_ID & META_APP_SECRET to enable live Facebook OAuth. Opening Setup Guide...'
        );
        setCurrentTab('guides');
        return;
      }

      // Open OAuth provider URL directly in popup as per OAuth skill guidelines
      const popupWidth = 600;
      const popupHeight = 700;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;

      const popup = window.open(
        authRes.url,
        'facebook_oauth_popup',
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!popup) {
        error('Popup Blocked', 'Please allow popups in your browser to connect your Facebook account.');
      }
    } catch (err: any) {
      error('OAuth Connection Failed', err.message);
    } finally {
      setIsConnectingMeta(false);
    }
  };

  // Test Facebook Page Token
  const handleTestPage = async (pageId: string) => {
    setTestingPageId(pageId);
    try {
      const res = await api.testPage(pageId);
      if (res.valid) {
        success('Token Validated', `${res.name || 'Facebook Page'} has verified publish permissions.`);
      } else {
        error('Token Error', res.error || 'Failed to verify Page token with Meta Graph API');
      }
      loadData(true);
    } catch (err: any) {
      error('Test Failed', err.message);
    } finally {
      setTestingPageId(null);
    }
  };

  // Disconnect Page
  const handleDisconnectPage = async (pageId: string) => {
    try {
      await api.disconnectPage(pageId);
      success('Page Disconnected', 'Facebook Page removed from your publishing fleet.');
      loadData(true);
    } catch (err: any) {
      error('Failed to Disconnect', err.message);
    }
  };

  // Seed Batch Pages for 100+ scalability demonstration
  const handleSeedBatch = async (count = 25) => {
    try {
      const res = await api.seedBatchPages(count);
      success('Fleet Scaled', `Added ${res.count} authorized regional nodes to test 100+ page publishing.`);
      loadData(true);
    } catch (err: any) {
      error('Failed to scale fleet', err.message);
    }
  };

  // Create Post
  const handleCreatePost = async (postData: any) => {
    setIsSubmittingPost(true);
    try {
      const res = await api.createPost(postData);
      success(
        postData.status === 'scheduled' ? 'Post Scheduled' : 'Distribution Dispatched',
        `Created publishing jobs for ${res.targetCount} Facebook Pages.`
      );
      await loadData(true);
      setCurrentTab('posts_all');
    } catch (err: any) {
      error('Post Creation Failed', err.message);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Post Detail Inspection
  const handleSelectPost = async (post: Post) => {
    try {
      const detailRes = await api.getPost(post.id);
      setSelectedPost(detailRes.post);
      setSelectedPostTargets(detailRes.targets);
      setSelectedPostLogs(detailRes.logs);
    } catch (err: any) {
      error('Could not load post details', err.message);
    }
  };

  // Retry Failed Targets on Post
  const handleRetryPost = async (postId: string) => {
    setIsPostActionLoading(true);
    try {
      const res = await api.retryPost(postId);
      success('Retry Dispatched', `Queued ${res.retriedCount} failed targets for publishing retry.`);
      if (selectedPost?.id === postId) {
        handleSelectPost(selectedPost);
      }
      loadData(true);
    } catch (err: any) {
      error('Retry Failed', err.message);
    } finally {
      setIsPostActionLoading(false);
    }
  };

  // Publish Draft or Scheduled Post Now
  const handlePublishNow = async (postId: string) => {
    setIsPostActionLoading(true);
    try {
      const res = await api.publishNow(postId);
      success('Publishing Queued', `Queued ${res.queuedCount} targets for immediate publication.`);
      if (selectedPost?.id === postId) {
        handleSelectPost(selectedPost);
      }
      loadData(true);
    } catch (err: any) {
      error('Failed to trigger publish', err.message);
    } finally {
      setIsPostActionLoading(false);
    }
  };

  // Cancel Scheduled Post
  const handleCancelPost = async (postId: string) => {
    setIsPostActionLoading(true);
    try {
      await api.cancelPost(postId);
      info('Post Cancelled', 'Distribution cancelled.');
      if (selectedPost?.id === postId) {
        handleSelectPost(selectedPost);
      }
      loadData(true);
    } catch (err: any) {
      error('Failed to cancel', err.message);
    } finally {
      setIsPostActionLoading(false);
    }
  };

  // Trigger Queue Tick
  const handleTriggerQueue = async () => {
    setIsQueueTriggering(true);
    try {
      await api.processQueue();
      success('Queue Tick Triggered', 'Autonomous background worker processed eligible scheduled publications.');
      loadData(true);
    } catch (err: any) {
      error('Queue Tick Failed', err.message);
    } finally {
      setIsQueueTriggering(false);
    }
  };

  // Switch User
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      setCurrentUser(res.user);
      success('Identity Switched', `Logged in as ${res.user.fullName} (${res.user.role})`);
      loadData(true);
    } catch (err: any) {
      error('Failed to switch user', err.message);
    }
  };

  // Login
  const handleLogin = async (email: string) => {
    try {
      const res = await api.login(email);
      setCurrentUser(res.user);
      success('Login Successful', `Welcome back, ${res.user.fullName}!`);
      loadData(true);
    } catch (err: any) {
      error('Login Failed', err.message);
    }
  };

  // Register
  const handleRegister = async (data: any) => {
    try {
      const res = await api.register(data);
      setCurrentUser(res.user);
      success('Account Created', `Welcome to SocialPilot 100+, ${res.user.fullName}!`);
      loadData(true);
    } catch (err: any) {
      error('Registration Failed', err.message);
    }
  };

  // Admin Update User
  const handleAdminUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await api.updateAdminUser(userId, updates);
      success('User Privileges Updated', 'Changes committed to database.');
      loadData(true);
    } catch (err: any) {
      error('Update Failed', err.message);
    }
  };

  // Admin Update Settings
  const handleAdminUpdateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      await api.updateAdminSettings(updates);
      success('Settings Saved', 'System engine rate limits and worker parameters updated.');
      loadData(true);
    } catch (err: any) {
      error('Failed to update settings', err.message);
    }
  };

  // Scheduled and Failed counts
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const failedCount = posts.filter((p) => p.status === 'failed' || p.failedCount > 0).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-medium text-slate-500">
            Initializing SocialPilot 100+ Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors max-w-full overflow-x-hidden">
      {/* Sidebar Navigation (Desktop sticky sidebar + Mobile slide-out drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchUserModal={() => setIsAuthModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        pagesCount={pages.length}
        scheduledCount={scheduledCount}
        failedCount={failedCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <Navbar
          currentTab={currentTab}
          onComposeClick={() => setCurrentTab('composer')}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
          pagesCount={pages.length}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              recentPosts={posts}
              pages={pages}
              onNavigate={setCurrentTab}
              onComposeClick={() => setCurrentTab('composer')}
              onTriggerQueue={handleTriggerQueue}
              isQueueTriggering={isQueueTriggering}
              metaAppConfigured={config.metaAppConfigured}
            />
          )}

          {currentTab === 'composer' && (
            <ComposerView
              pages={pages}
              onSubmit={handleCreatePost}
              isSubmitting={isSubmittingPost}
            />
          )}

          {(currentTab === 'posts_all' ||
            currentTab === 'posts_scheduled' ||
            currentTab === 'posts_published' ||
            currentTab === 'posts_failed' ||
            currentTab === 'posts_drafts') && (
            <PostsListView
              currentTab={currentTab}
              posts={posts}
              onSelectPost={handleSelectPost}
              onRetryPost={handleRetryPost}
              onPublishNow={handlePublishNow}
              onComposeClick={() => setCurrentTab('composer')}
            />
          )}

          {currentTab === 'pages' && (
            <PagesManagerView
              pages={pages}
              onConnectFacebook={handleConnectFacebook}
              onDisconnectPage={handleDisconnectPage}
              onTestPage={handleTestPage}
              onSeedBatch={handleSeedBatch}
              onRefresh={() => loadData(false)}
              isConnecting={isConnectingMeta}
              testingPageId={testingPageId}
              metaAppConfigured={config.metaAppConfigured}
            />
          )}

          {currentTab === 'queue' && (
            <QueueMonitorView
              queuedTargets={posts.flatMap((p) => (p.targets || []).filter((t) => t.status === 'queued' || t.status === 'publishing'))}
              logs={auditLogs.map((a) => ({
                id: a.id,
                postId: a.entityId || '',
                jobId: '',
                pageId: '',
                pageName: a.entityType,
                userId: a.userId,
                action: (a.action.toLowerCase() as any) || 'publish_attempt',
                status: 'info',
                message: a.details,
                createdAt: a.createdAt,
              }))}
              onTriggerTick={handleTriggerQueue}
              isTriggering={isQueueTriggering}
              intervalSec={settings?.queueProcessingIntervalSec || 5}
              maxConcurrent={settings?.maxConcurrentJobs || 5}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              currentUser={currentUser}
              users={availableUsers}
              settings={settings}
              metrics={metrics}
              auditLogs={auditLogs}
              migrationSql={migrationSql}
              onUpdateUser={handleAdminUpdateUser}
              onUpdateSettings={handleAdminUpdateSettings}
            />
          )}

          {currentTab === 'guides' && (
            <SetupGuidesView
              appUrl={config.appUrl}
              redirectUri={config.redirectUri}
              metaAppId={config.metaAppId}
            />
          )}
        </main>
      </div>

      {/* Post Details & Delivery Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          targets={selectedPostTargets}
          logs={selectedPostLogs}
          onClose={() => setSelectedPost(null)}
          onRetry={handleRetryPost}
          onPublishNow={handlePublishNow}
          onCancel={handleCancelPost}
          isActionLoading={isPostActionLoading}
        />
      )}

      {/* Auth & Role Switcher Modal */}
      {isAuthModalOpen && (
        <AuthModal
          currentUser={currentUser}
          availableUsers={availableUsers.length > 0 ? availableUsers : [currentUser]}
          onSwitchUser={handleSwitchUser}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
