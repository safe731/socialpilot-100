# Meta Developer App Configuration Guide

This guide details how to configure your existing Meta Developer application **SocialPilot 100** for production multi-page Facebook publishing with SocialPilot 100+.

---

## 1. App Basic Settings

1. Log in to [developers.facebook.com](https://developers.facebook.com)
2. Select your app: **SocialPilot 100**
3. Navigate to **App Settings** → **Basic**:
   - Copy your **App ID** to `META_APP_ID` in `.env`
   - Copy your **App Secret** to `META_APP_SECRET` in `.env`
   - Set **App Domains**: `ais-dev-5lsfpbjmo3zgdwmjkp6epn-24576730926.asia-southeast1.run.app` (and your production Vercel domain)
   - Add **Privacy Policy URL** and **Terms of Service URL**

---

## 2. Facebook Login for Business Settings

1. In the left navigation, select **Facebook Login for Business** → **Settings**
2. Enable **Client OAuth Login**: `Yes`
3. Enable **Web OAuth Login**: `Yes`
4. In **Valid OAuth Redirect URIs**, enter:
   ```
   https://ais-dev-5lsfpbjmo3zgdwmjkp6epn-24576730926.asia-southeast1.run.app/auth/callback
   https://ais-pre-5lsfpbjmo3zgdwmjkp6epn-24576730926.asia-southeast1.run.app/auth/callback
   https://your-vercel-domain.vercel.app/auth/callback
   ```
5. Click **Save Changes**.

---

## 3. Required Meta Graph API Permissions

SocialPilot 100+ requests the following granular permissions:

| Permission | Purpose | Access Level |
|---|---|---|
| `pages_show_list` | Retrieves the list of Facebook Pages managed by the user | Standard / Advanced |
| `pages_read_engagement` | Reads post performance and verifies page permissions | Standard / Advanced |
| `pages_manage_posts` | Publishes status updates, links, and photos to Facebook Pages | Advanced Access (App Review) |
| `public_profile` | Authenticates user identity and retrieves name | Standard |
| `email` | Authenticates user email | Standard |

---

## 4. Development Mode vs. App Review (Live Mode)

### Development Mode (Testing immediately)
- In Development Mode, any Meta account added under **App Roles** → **Administrators**, **Developers**, or **Testers** can authenticate and publish to their Facebook Pages **without App Review**.
- This allows immediate end-to-end testing of publishing to real Facebook Pages!

### Live Mode & App Review (Production)
- To allow regular external users to connect their Facebook Pages, submit an App Review for:
  1. `pages_manage_posts`
  2. `pages_read_engagement`
- Meta requires a screencast recording demonstrating the OAuth connection and post publishing workflow (which can be recorded directly from SocialPilot 100+).

---

## 5. Important Meta Policy Note on Personal Profiles

The standard Meta Graph API does **not** allow automated posting to personal user profile timelines. SocialPilot 100+ publishes strictly to authorized **Facebook Pages** where the user holds management tasks (`CREATE_CONTENT` or `PUBLISH_AS_PAGE`), ensuring full compliance with Meta Platform Terms.
