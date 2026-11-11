import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, FacebookPage, Post, PostTarget, PublishingLog, AuditLog, SystemSettings } from '../src/types';

// Encryption key for tokens stored at rest
const ENCRYPTION_SECRET = process.env.TOKEN_ENCRYPTION_SECRET || 'socialpilot-aes-256-gcm-master-key-32chars!!';

export function encryptToken(token: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    return `plain:${Buffer.from(token).toString('base64')}`;
  }
}

export function decryptToken(encryptedToken: string): string {
  try {
    if (encryptedToken.startsWith('plain:')) {
      return Buffer.from(encryptedToken.replace('plain:', ''), 'base64').toString('utf8');
    }
    const [ivHex, authTagHex, encryptedText] = encryptedToken.split(':');
    if (!ivHex || !authTagHex || !encryptedText) return encryptedToken;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return encryptedToken;
  }
}

export interface StoredPageToken {
  pageId: string;
  encryptedToken: string;
}

export class DatabaseStore {
  private dataDir = path.resolve(process.cwd(), 'data');
  private dbFilePath = path.join(this.dataDir, 'db.json');

  public profiles: UserProfile[] = [];
  public facebookPages: FacebookPage[] = [];
  public pageTokens: Map<string, string> = new Map(); // pageId -> encryptedToken
  public posts: Post[] = [];
  public targets: PostTarget[] = [];
  public publishingLogs: PublishingLog[] = [];
  public auditLogs: AuditLog[] = [];
  public systemSettings: SystemSettings;
  public supabase: SupabaseClient | null = null;
  public isSupabaseConnected = false;

  constructor() {
    this.systemSettings = {
      metaAppId: process.env.META_APP_ID || '',
      metaAppConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      rateLimitPerMinute: 200,
      maxConcurrentJobs: 5,
      maxRetryAttempts: 3,
      retryBackoffSeconds: 5,
      queueProcessingIntervalSec: 5,
      logRetentionDays: 30,
    };

    this.initSupabase();
    this.loadFromFile();
    if (this.profiles.length === 0) {
      this.seedDefaultData();
      this.saveToFile();
    }
  }

  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseConnected = true;
      } catch (e) {
        console.warn('Failed to initialize Supabase client:', e);
        this.supabase = null;
        this.isSupabaseConnected = false;
      }
    }
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.profiles = parsed.profiles || [];
        this.facebookPages = parsed.facebookPages || [];
        this.posts = parsed.posts || [];
        this.targets = parsed.targets || [];
        this.publishingLogs = parsed.publishingLogs || [];
        this.auditLogs = parsed.auditLogs || [];
        if (parsed.tokens && Array.isArray(parsed.tokens)) {
          for (const item of parsed.tokens) {
            this.pageTokens.set(item.pageId, item.encryptedToken);
          }
        }
        if (parsed.systemSettings) {
          this.systemSettings = { ...this.systemSettings, ...parsed.systemSettings };
        }
      }
    } catch (e) {
      console.error('Error loading db.json:', e);
    }
  }

  public saveToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const tokensArray: StoredPageToken[] = [];
      for (const [pageId, encryptedToken] of this.pageTokens.entries()) {
        tokensArray.push({ pageId, encryptedToken });
      }
      const data = {
        profiles: this.profiles,
        facebookPages: this.facebookPages,
        posts: this.posts,
        targets: this.targets,
        publishingLogs: this.publishingLogs,
        auditLogs: this.auditLogs,
        systemSettings: this.systemSettings,
        tokens: tokensArray,
      };
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  private seedDefaultData() {
    // Seed default users
    const now = new Date().toISOString();
    this.profiles = [
      {
        id: 'usr_super_admin',
        email: 'superadmin@socialpilot.io',
        fullName: 'Alex Vance (Super Admin)',
        role: 'super_admin',
        status: 'active',
        maxPagesLimit: 1000,
        maxPostsPerDay: 500,
        connectedPagesCount: 12,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastLoginAt: now,
      },
      {
        id: 'usr_shohel',
        email: 'soheltajbhola@gmail.com',
        fullName: 'Shohel Taj (Admin)',
        role: 'admin',
        status: 'active',
        maxPagesLimit: 500,
        maxPostsPerDay: 200,
        connectedPagesCount: 8,
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        lastLoginAt: now,
      },
      {
        id: 'usr_sarah',
        email: 'marketing@socialpilot.io',
        fullName: 'Sarah Chen (Publisher)',
        role: 'user',
        status: 'active',
        maxPagesLimit: 50,
        maxPostsPerDay: 50,
        connectedPagesCount: 4,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        lastLoginAt: now,
      },
    ];

    // Seed realistic authorized Facebook Pages for Alex & Shohel
    const samplePagesData: Array<{ id: string; name: string; category: string; fanCount: number; userId: string }> = [
      { id: '109283746501928', name: 'TechPulse Daily Tech News', category: 'Media/News Company', fanCount: 384000, userId: 'usr_shohel' },
      { id: '209384756102938', name: 'Global SaaS Architects', category: 'Software Company', fanCount: 92400, userId: 'usr_shohel' },
      { id: '304958671928374', name: 'EcoLiving Innovations Hub', category: 'Community & Culture', fanCount: 145000, userId: 'usr_shohel' },
      { id: '409586719283746', name: 'NextGen AI & Cloud Insights', category: 'Science & Tech', fanCount: 68200, userId: 'usr_shohel' },
      { id: '509687129384756', name: 'Vanguard Retail & Commerce', category: 'E-commerce Brand', fanCount: 219000, userId: 'usr_shohel' },
      { id: '609788139485766', name: 'Apex Fitness & Health Club', category: 'Fitness & Wellness', fanCount: 78500, userId: 'usr_shohel' },
      { id: '709889149586776', name: 'Urban Culinary Journal', category: 'Restaurant & Dining', fanCount: 112000, userId: 'usr_shohel' },
      { id: '809990159687786', name: 'Skyline Real Estate Ventures', category: 'Real Estate Company', fanCount: 43200, userId: 'usr_shohel' },
      { id: '901001169788796', name: 'Horizon Ventures Asia', category: 'Financial Service', fanCount: 54100, userId: 'usr_super_admin' },
      { id: '101112179889806', name: 'CyberSec Shield Enterprise', category: 'Internet Company', fanCount: 88700, userId: 'usr_super_admin' },
      { id: '111213189990816', name: 'Nordic Design Collective', category: 'Design Agency', fanCount: 32900, userId: 'usr_super_admin' },
      { id: '121314190001826', name: 'Velocity Motors Global', category: 'Automotive', fanCount: 198000, userId: 'usr_super_admin' },
    ];

    this.facebookPages = samplePagesData.map((p) => {
      const pageId = p.id;
      // Store encrypted mock token
      const encToken = encryptToken(`EAA...PAGE_ACCESS_TOKEN_FOR_${p.id}`);
      this.pageTokens.set(pageId, encToken);

      return {
        id: pageId,
        userId: p.userId,
        name: p.name,
        category: p.category,
        fanCount: p.fanCount,
        pictureUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop`,
        tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ADVERTISE', 'ANALYZE'],
        connectedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        tokenExpiresAt: new Date(Date.now() + 55 * 86400000).toISOString(),
        status: 'active',
        lastSyncAt: now,
      };
    });

    // Seed realistic sample posts
    const p1Id = 'post_launch_announcement';
    const p2Id = 'post_weekly_tips';
    const p3Id = 'post_scheduled_drop';

    this.posts = [
      {
        id: p1Id,
        userId: 'usr_shohel',
        authorName: 'Shohel Taj',
        content: 'Excited to announce the major release of our new platform architecture! Scalable to 1,000+ multi-page distributions with zero latency.',
        linkUrl: 'https://socialpilot.io/blog/architecture-release',
        mediaType: 'link',
        status: 'published',
        timezone: 'UTC',
        targetCount: 4,
        publishedCount: 4,
        failedCount: 0,
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 23 * 3600000).toISOString(),
      },
      {
        id: p2Id,
        userId: 'usr_shohel',
        authorName: 'Shohel Taj',
        content: '5 Essential habits for scaling your community across 100+ social channels without burning out your editorial team.',
        mediaType: 'none',
        status: 'published',
        timezone: 'America/New_York',
        targetCount: 3,
        publishedCount: 3,
        failedCount: 0,
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
      },
      {
        id: p3Id,
        userId: 'usr_shohel',
        authorName: 'Shohel Taj',
        content: 'Special Friday Product Spotlight: Dive into automated queue processing with exponential backoff and rate-limit guardrails.',
        linkUrl: 'https://socialpilot.io/spotlight',
        mediaType: 'link',
        status: 'scheduled',
        scheduledFor: new Date(Date.now() + 2 * 3600000).toISOString(),
        timezone: 'UTC',
        targetCount: 5,
        publishedCount: 0,
        failedCount: 0,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ];

    // Seed targets for p1
    const p1Pages = this.facebookPages.slice(0, 4);
    p1Pages.forEach((page, idx) => {
      this.targets.push({
        id: `tgt_${p1Id}_${page.id}`,
        postId: p1Id,
        pageId: page.id,
        pageName: page.name,
        status: 'published',
        facebookPostId: `${page.id}_98273645019${idx}`,
        publishedAt: new Date(Date.now() - 23 * 3600000 + idx * 2000).toISOString(),
        attempts: 1,
        maxAttempts: 3,
        lastAttemptAt: new Date(Date.now() - 23 * 3600000 + idx * 2000).toISOString(),
        idempotencyKey: `idemp_${p1Id}_${page.id}`,
      });

      this.publishingLogs.push({
        id: `log_${p1Id}_${page.id}`,
        postId: p1Id,
        jobId: `job_${p1Id}_${page.id}`,
        pageId: page.id,
        pageName: page.name,
        userId: 'usr_shohel',
        action: 'publish_success',
        status: 'success',
        message: `Published successfully to Facebook Page [${page.name}]. Graph API ID: ${page.id}_98273645019${idx}`,
        createdAt: new Date(Date.now() - 23 * 3600000 + idx * 2000).toISOString(),
      });
    });

    // Seed targets for p3 (scheduled)
    const p3Pages = this.facebookPages.slice(0, 5);
    p3Pages.forEach((page) => {
      this.targets.push({
        id: `tgt_${p3Id}_${page.id}`,
        postId: p3Id,
        pageId: page.id,
        pageName: page.name,
        status: 'queued',
        attempts: 0,
        maxAttempts: 3,
        idempotencyKey: `idemp_${p3Id}_${page.id}`,
      });
    });

    // Seed audit logs
    this.auditLogs = [
      {
        id: 'aud_1',
        userId: 'usr_shohel',
        userEmail: 'soheltajbhola@gmail.com',
        action: 'OAUTH_CONNECT',
        entityType: 'page',
        entityId: '109283746501928',
        details: 'Connected 8 Facebook Pages via Meta Graph API v19 with pages_manage_posts scope',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'aud_2',
        userId: 'usr_shohel',
        userEmail: 'soheltajbhola@gmail.com',
        action: 'POST_PUBLISH_BULK',
        entityType: 'post',
        entityId: p1Id,
        details: 'Dispatched post to 4 target Facebook Pages simultaneously',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'aud_3',
        userId: 'usr_super_admin',
        userEmail: 'superadmin@socialpilot.io',
        action: 'ROLE_UPDATE',
        entityType: 'user',
        entityId: 'usr_shohel',
        details: 'Promoted Shohel Taj to Platform Admin role',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];
  }
}

export const db = new DatabaseStore();
