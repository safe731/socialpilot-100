# Vercel Deployment & GitHub Synchronization Guide

This document outlines the deployment workflow for **SocialPilot 100+** to Vercel and synchronization with the GitHub repository `ShohelTajBhola/socialpilot`.

---

## 1. GitHub Repository Connection

1. Repository: [https://github.com/ShohelTajBhola/socialpilot](https://github.com/ShohelTajBhola/socialpilot)
2. Push the codebase to your `main` branch:
   ```bash
   git add .
   git commit -m "feat: complete SocialPilot 100+ production architecture"
   git push origin main
   ```

---

## 2. Vercel Project Setup

1. In the [Vercel Dashboard](https://vercel.com), select **Add New Project**.
2. Select your repository `ShohelTajBhola/socialpilot`.
3. In **Environment Variables**, add the variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_REDIRECT_URI` (set to `https://your-project.vercel.app/auth/callback`)
   - `APP_URL` (set to `https://your-project.vercel.app`)
   - `QUEUE_PROVIDER_TOKEN`
4. Click **Deploy**.

---

## 3. Autonomous Scheduled Publishing via Vercel Cron

To process scheduled posts continuously on Vercel without a persistent server process, add `vercel.json` in the root:

```json
{
  "crons": [
    {
      "path": "/api/queue/process",
      "schedule": "* * * * *"
    }
  ]
}
```

This triggers the queue worker every minute to dispatch due posts automatically.
