# SocialPilot 100+ Testing & Verification Checklist

Use this checklist to verify each stage of the application.

---

## 1. Authentication & RBAC Isolation
- [x] Switch between Super Admin, Admin, and User in the identity modal.
- [x] Verify that the Admin Console sidebar tab is accessible only to Admin and Super Admin.
- [x] Verify that modifying a user's page limit or daily post limit in Admin Console persists.
- [x] Test registration of a new user account with isolated page fleet.

## 2. Meta OAuth & Facebook Page Fleet Management
- [x] Click "Connect Facebook Account" — verify popup opens official OAuth dialog or guides user if keys are unconfigured.
- [x] Test Page Token validation via "Test Token" button on connected pages.
- [x] Test scalability by clicking "Scale Fleet (+50 Pages)" to simulate high-volume 100+ page fleets.
- [x] Search pages by name and filter by category in the fleet manager.
- [x] Disconnect a page and verify deletion from active list.

## 3. Post Composer & Live Preview
- [x] Compose a text-only post and verify live character counter.
- [x] Attach a link URL and inspect the generated OpenGraph preview card in the Facebook Feed mockup.
- [x] Attach a photo URL and inspect image rendering.
- [x] Test "Select All (X)" and "Clear Selection" in target page selector.
- [x] Verify that individual target publishing jobs are generated with distinct idempotency keys.

## 4. Scheduling & Background Queue
- [x] Click "Publish Now" — verify immediate transition to `queued` and dispatch by background worker daemon.
- [x] Schedule a post for a future time — verify that status remains `scheduled` until the set time is reached.
- [x] Save as Draft — verify that targets remain in `pending` state until manually published.
- [x] Inspect Post Details modal to see per-page Facebook Post IDs and timestamps.
- [x] Test "Trigger Queue Tick Now" in the Queue Engine tab to verify manual tick execution.

## 5. Security & Tokens
- [x] Verify that all Page Access Tokens are encrypted with AES-256-GCM at rest.
- [x] Confirm that no access tokens or app secrets are exposed in client-side API responses.
- [x] Inspect Supabase migration file `/supabase/migrations/20261111_socialpilot_schema.sql` for complete RLS policies.

## 6. Mobile-First & Responsive Verification (320px - 430px & Desktop)
- [x] **320px (Android compact phones)**: Zero horizontal scrolling; all cards stack cleanly; touch targets $\ge 44\text{px}$.
- [x] **360px & 375px (Standard Android & iPhone)**: Fluid grid scaling, responsive post cards, mobile drawer slide-out with backdrop.
- [x] **390px & 430px (Large Android phones)**: Full-width touch-friendly post composer, live Facebook mockup containment, accessible dialogs.
- [x] **768px (Tablets)**: Transition between mobile card lists and desktop data tables with balanced typography.
- [x] **1024px+ (Desktop)**: Persistent sidebar navigation, multi-column metrics, and expanded data tables.
- [x] **Navigation Drawer**: Accessible hamburger menu toggle with backdrop dismiss and active state highlight.
- [x] **Touch Targets**: All interactive buttons, tabs, dropdowns, and checkboxes meet WCAG $\ge 44\text{px}$ minimum tap height.
