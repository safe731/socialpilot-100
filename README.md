# SocialPilot 100+

**SocialPilot 100+** is an enterprise-grade multi-user social media management and scheduled publishing SaaS platform engineered to manage and distribute content across **100–1,000+ connected Facebook Pages** via the official Meta Graph API v19.

---

## 🌟 Key Architecture & Capabilities

1. **High-Throughput Multi-Page Fleet Management**:
   - Built to handle 100 to 1,000+ authorized Facebook Pages per user organization.
   - Bulk selection, category sorting, search filtering, and live audience tracking.
   - Separate, autonomous publishing jobs per target page with distinct idempotency keys.

2. **Official Meta Graph API v19 Integration**:
   - Popup-based OAuth 2.0 flow conforming to Meta Developer Platform security standards.
   - Requests approved permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `public_profile`, `email`.
   - Permanent Page Access Token retrieval via `/me/accounts`.
   - Server-side AES-256-GCM token encryption at rest. Never exposes raw access tokens to the client.

3. **Autonomous Background Queue & Scheduler**:
   - Independent background worker daemon running continuously in `server.ts` (does not require the browser tab to remain open).
   - Date, time, and timezone-aware scheduling engine.
   - Exponential backoff retry mechanism (5s, 15s, 45s) for transient network or Graph API errors.
   - Meta rate-limit handling (error codes 17, 32, 613).
   - Real-time publishing logs with post IDs, timestamps, and error codes.

4. **Multi-User Role-Based Access Control (RBAC)**:
   - **Super Admin**: Complete platform root control, role assignment, system setting configuration, and full user audits.
   - **Admin**: User activation/suspension, quota limits, and fleet oversight.
   - **User (Publisher)**: Dedicated user-level data isolation, post creation, and personal page fleet management.

5. **Supabase PostgreSQL & Dual-Mode Persistence**:
   - Complete PostgreSQL SQL schema with Row Level Security (RLS) policies in `/supabase/migrations/20261111_socialpilot_schema.sql`.
   - Integrated with existing Supabase project `socialpilot-100`.
   - Resilient persistent fallback store in `data/db.json` enabling immediate evaluation and zero setup friction.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Backend**: Node.js & Express server with Vite middleware integration
- **Database**: Supabase PostgreSQL + Row Level Security (RLS)
- **Validation**: Zod & TypeScript type contracts
- **Social Graph**: Meta Graph API v19 (`/dialog/oauth`, `/oauth/access_token`, `/me/accounts`, `/{page-id}/feed`, `/{page-id}/photos`)
- **Hosting**: Vercel & Node.js

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your credentials:
```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"

# Meta Developer App: SocialPilot 100
META_APP_ID="your_meta_app_id"
META_APP_SECRET="your_meta_app_secret"
META_REDIRECT_URI="https://your-domain.com/auth/callback"

# App URL
APP_URL="https://your-domain.com"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Database Schema

The production PostgreSQL migration is available at `/supabase/migrations/20261111_socialpilot_schema.sql`.

It establishes:
- `profiles`
- `user_roles`
- `social_accounts`
- `facebook_pages`
- `encrypted_tokens`
- `posts`
- `post_targets`
- `publishing_jobs`
- `publishing_logs`
- `audit_logs`
- `system_settings`
