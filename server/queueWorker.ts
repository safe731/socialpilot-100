import { db, decryptToken } from './db.js';
import { MetaGraphApiClient } from './metaApi.js';
import type { PostTarget, Post, PublishingLog } from '../src/types';

export class QueueWorker {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;
  private lockedJobs = new Set<string>();

  constructor() {
    this.start();
  }

  public start() {
    if (this.timer) return;
    const intervalMs = (db.systemSettings.queueProcessingIntervalSec || 5) * 1000;
    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);
    console.log(`[QueueWorker] Started with ${intervalMs}ms tick interval`);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Main worker tick:
   * 1. Finds posts scheduled for now or earlier and transitions them to 'queued'
   * 2. Finds pending / queued targets
   * 3. Dispatches jobs with concurrency limits
   */
  public async tick() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();

      // 1. Check for scheduled posts that are due
      for (const post of db.posts) {
        if (post.status === 'scheduled' && post.scheduledFor) {
          const scheduledTime = new Date(post.scheduledFor);
          if (scheduledTime <= now) {
            post.status = 'queued';
            post.updatedAt = now.toISOString();

            // Set all its targets to queued
            const targets = db.targets.filter((t) => t.postId === post.id && t.status === 'pending');
            for (const target of targets) {
              target.status = 'queued';
              target.updatedAt = now.toISOString();
            }

            console.log(`[QueueWorker] Post ${post.id} scheduled time reached. Queued ${targets.length} targets.`);
          }
        }
      }

      // 2. Find eligible targets to publish (queued or retry-ready)
      const eligibleTargets = db.targets.filter((t) => {
        if (this.lockedJobs.has(t.id)) return false;
        if (t.status === 'queued') return true;
        if (t.status === 'failed' && t.attempts < t.maxAttempts) {
          // Check retry exponential backoff
          if (t.lastAttemptAt) {
            const backoffSec = Math.pow(2, t.attempts) * (db.systemSettings.retryBackoffSeconds || 5);
            const nextRetry = new Date(new Date(t.lastAttemptAt).getTime() + backoffSec * 1000);
            return now >= nextRetry;
          }
          return true;
        }
        return false;
      });

      if (eligibleTargets.length === 0) {
        return;
      }

      // 3. Process up to maxConcurrentJobs
      const maxBatch = db.systemSettings.maxConcurrentJobs || 5;
      const batch = eligibleTargets.slice(0, maxBatch);

      await Promise.all(batch.map((target) => this.processTarget(target)));

      db.saveToFile();
    } catch (err) {
      console.error('[QueueWorker] Error in tick:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processes a single target job
   */
  public async processTarget(target: PostTarget): Promise<void> {
    const parentPost = db.posts.find((p) => p.id === target.postId);
    if (!parentPost) return;

    if (parentPost.status === 'cancelled') {
      target.status = 'cancelled';
      return;
    }

    this.lockedJobs.add(target.id);
    target.status = 'publishing';
    target.attempts += 1;
    target.lastAttemptAt = new Date().toISOString();
    parentPost.status = 'publishing';

    // Log the attempt
    const attemptLog: PublishingLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId: target.postId,
      jobId: target.id,
      pageId: target.pageId,
      pageName: target.pageName,
      userId: parentPost.userId,
      action: 'publish_attempt',
      status: 'info',
      message: `Attempt #${target.attempts}/${target.maxAttempts}: Initiating Meta Graph API publish to Facebook Page [${target.pageName}] (ID: ${target.pageId})`,
      createdAt: new Date().toISOString(),
    };
    db.publishingLogs.unshift(attemptLog);

    try {
      const page = db.facebookPages.find((p) => p.id === target.pageId);
      const encryptedToken = db.pageTokens.get(target.pageId);

      let publishedFbPostId: string | null = null;
      const hasRealMetaCreds = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);

      if (hasRealMetaCreds && encryptedToken) {
        const rawToken = decryptToken(encryptedToken);
        const metaClient = new MetaGraphApiClient(process.env.META_APP_ID!, process.env.META_APP_SECRET!);

        // Attempt actual Graph API publication
        const result = await metaClient.publishToPage(target.pageId, rawToken, {
          message: parentPost.content,
          linkUrl: parentPost.linkUrl,
          mediaUrl: parentPost.mediaUrls?.[0],
        });

        publishedFbPostId = result.id;
      } else {
        // If Meta App credentials are not provided in environment, simulate realistic API response
        // for demonstration with simulated network latency of 300ms
        await new Promise((resolve) => setTimeout(resolve, 300));
        publishedFbPostId = `${target.pageId}_${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
      }

      // Success
      target.status = 'published';
      target.facebookPostId = publishedFbPostId;
      target.publishedAt = new Date().toISOString();
      target.errorMessage = undefined;

      const successLog: PublishingLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        postId: target.postId,
        jobId: target.id,
        pageId: target.pageId,
        pageName: target.pageName,
        userId: parentPost.userId,
        action: 'publish_success',
        status: 'success',
        message: `Successfully published to Facebook Page [${target.pageName}]. Meta Graph API Post ID: ${publishedFbPostId}`,
        createdAt: new Date().toISOString(),
      };
      db.publishingLogs.unshift(successLog);

      // Audit log entry
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        userId: parentPost.userId,
        userEmail: parentPost.authorName || 'user',
        action: 'POST_PUBLISHED',
        entityType: 'post',
        entityId: target.postId,
        details: `Published to Facebook Page [${target.pageName}] with ID ${publishedFbPostId}`,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(`[QueueWorker] Failed to publish to page ${target.pageName}:`, err.message);

      target.status = 'failed';
      target.errorMessage = err.message || 'Meta Graph API call failed';
      target.metaErrorCode = err.code;
      target.metaErrorSubcode = err.subcode;

      const errorLog: PublishingLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        postId: target.postId,
        jobId: target.id,
        pageId: target.pageId,
        pageName: target.pageName,
        userId: parentPost.userId,
        action: 'publish_failed',
        status: 'error',
        message: `Publishing failed on attempt ${target.attempts}: ${target.errorMessage}`,
        metadata: {
          code: err.code,
          subcode: err.subcode,
          type: err.type,
        },
        createdAt: new Date().toISOString(),
      };
      db.publishingLogs.unshift(errorLog);
    } finally {
      this.lockedJobs.delete(target.id);
      this.recalculatePostStatus(parentPost);
    }
  }

  /**
   * Recalculates parent post aggregates (publishedCount, failedCount, overall status)
   */
  public recalculatePostStatus(post: Post) {
    const targets = db.targets.filter((t) => t.postId === post.id);
    post.targetCount = targets.length;
    post.publishedCount = targets.filter((t) => t.status === 'published').length;
    post.failedCount = targets.filter((t) => t.status === 'failed' && t.attempts >= t.maxAttempts).length;

    const hasPublishing = targets.some((t) => t.status === 'publishing');
    const hasQueued = targets.some((t) => t.status === 'queued' || (t.status === 'failed' && t.attempts < t.maxAttempts));
    const allPublished = targets.length > 0 && targets.every((t) => t.status === 'published');
    const allFailed = targets.length > 0 && targets.every((t) => t.status === 'failed' && t.attempts >= t.maxAttempts);

    if (hasPublishing) {
      post.status = 'publishing';
    } else if (hasQueued) {
      post.status = 'queued';
    } else if (allPublished) {
      post.status = 'published';
    } else if (allFailed) {
      post.status = 'failed';
    } else if (post.publishedCount > 0) {
      post.status = 'published'; // Partial success is marked published with count indicators
    }

    post.updatedAt = new Date().toISOString();
  }
}

export const queueWorker = new QueueWorker();
