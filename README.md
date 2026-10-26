# דוכן (Dukan)

**Upload your products. Your store is ready.**

Dukan is a multi-tenant SaaS for small Israeli businesses (bakeries, home food, ceramics, jewelry, gifts). A merchant signs up, uploads product photos, types names and prices, picks a style, and publishes a working Hebrew RTL storefront with a cart and pickup orders. A dashboard handles the orders. Merchants never deal with code, domains, or deployments.

- One codebase, one Vercel app, one Supabase project. Publishing a store is a database change, not a deployment.
- Stores live at `/s/<slug>`. The data model reserves `stores.custom_domain` for branded domains later.
- Hebrew-first, RTL-native, mobile-first.

---

## What's in the MVP

| Area | Implemented |
| --- | --- |
| Accounts | Email/password signup, login, logout, password reset (PKCE), email confirmation route, secure SSR sessions (`@supabase/ssr`) |
| Onboarding | Business details with live slug suggestion and availability check → bulk photo upload (one card per photo, drag and drop, multi-select from phone) → names, prices, categories, descriptions → style picker with live preview → pickup and payment info → **פרסום החנות שלי** → success screen with copy, open, and WhatsApp share |
| Products | Create, edit, delete, archive and restore, duplicate, hide or show, out-of-stock, featured, reorder, up to 8 photos per product, primary photo, merge cards into one product, bulk visibility, category, stock, and price % changes, category management |
| Images | Client-side downscale to WebP, server-side validation and re-encode with `sharp` (strips EXIF/GPS) into 1600px and 640px WebP, per-store storage paths, `srcset` and lazy loading, orphan-file cleanup |
| Storefront | Home, catalog with category browsing, product page with gallery, cart (persisted per store), checkout for pickup, order confirmation, about and contact. Three templates (בוטיק, סדנה, נועז) from one component set, with merchant colors and font presets |
| Orders | Server-priced, idempotent order creation; honeypot, minimum fill time, in-memory and database rate limits; status flow חדשה → אושרה → בהכנה → מוכנה לאיסוף → הושלמה / בוטלה; click-to-WhatsApp with a prefilled message; auto-refresh every 30s |
| Dashboard | Overview (real counts, order value labeled as such), orders, products, design editor (desktop and mobile preview), settings (details, pickup, slug with redirects, pause orders, visibility), plan and subscription |
| Trial and billing | Server-side 7-day trial that starts on first publish and can't be reset; expiry blocks new orders and keeps all data; statuses `trialing / active / past_due / canceled / expired`; manual activation by a platform admin; pluggable `BillingProvider` |
| Platform admin | `/platform-admin`: merchants, stores, trial and subscription state, product, order, and storage counts; activate, deactivate, extend or end trial, suspend or unsuspend; orphan cleanup; audit log |
| Marketing | Landing page and `/pricing`, using real screenshots of the product (demo stores, labeled) |
| Optional AI | Per-product "suggest name and description from the photo" via Claude. Off unless configured. Suggestions only; never invents ingredients or materials; never alters photos |

### Intentionally deferred

Online payment collection and a real billing provider, shipping and delivery, inventory counts and variants, custom domains, automatic email/WhatsApp notifications to merchants or customers, staff accounts UI (the schema supports `staff` memberships), distributed rate limiting (Redis), analytics.

---

## Routes

**Public:** `/`, `/pricing`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/s/[slug]`, `/s/[slug]/catalog`, `/s/[slug]/products/[productSlug]`, `/s/[slug]/cart`, `/s/[slug]/checkout`, `/s/[slug]/order-success?t=<token>`

**Merchant:** `/onboarding`, `/onboarding/products`, `/onboarding/design`, `/onboarding/publish`, `/onboarding/live`, `/dashboard`, `/dashboard/orders`, `/dashboard/orders/[id]`, `/dashboard/products`, `/dashboard/design`, `/dashboard/settings`, `/dashboard/billing`, `/preview` (private preview of your own store, with catalog, product, cart and checkout pages)

**Platform owner:** `/platform-admin`

**API:** `POST /api/uploads` (authenticated image upload), `GET /api/storage/...` (local development media only), `POST /auth/signout`

---

## Architecture

```
Browser ──► Next.js 16 (App Router, Vercel)
             ├─ proxy.ts           refreshes the Supabase session cookie (optimistic redirects only)
             ├─ Server Components  read data
             ├─ Server Actions     mutate data (every action re-derives the merchant from the session)
             └─ lib/db.ts          Postgres (postgres.js) with RLS per transaction:
                                     asUser()    → SET LOCAL ROLE authenticated + JWT claims
                                     asAnon()    → SET LOCAL ROLE anon (public functions only)
                                     asService() → SET LOCAL ROLE service_role (orders, admin)
Supabase ── Auth (GoTrue) · Postgres (RLS) · Storage (public-read bucket, server-only writes)
```

**Tenant isolation is enforced in the database.** RLS is enabled on every table. Merchants reach rows only through `store_memberships`. `anon` has no table access at all: public storefront data comes from `SECURITY DEFINER` functions that return only public fields of published, non-suspended stores. Privileged columns (status, slug, owner, order totals, subscriptions) are not grantable to merchants. Orders are created only by `place_order()`, which is executable only by `service_role`, prices items from the database, and is idempotent per checkout. Because the Supabase REST API is reachable with the public anon key, the RLS rules are written to be safe even against direct API calls, not just this app.

**Caching:** public store payloads are cached with `unstable_cache` and tagged `storefront:<slug>`. Every merchant mutation calls `revalidateTag(tag, { expire: 0 })`, so edits show on the next visit without a rebuild.

**Billing boundary:** `src/lib/billing` defines `BillingProvider`. The MVP ships `ManualBilling`, which collects nothing and points merchants to contact you. Accounts become `active` only through the platform-admin action (audited). To add a real provider, implement `BillingProvider` plus a webhook route that updates `public.subscriptions` with the service role.

**AI boundary:** `src/lib/ai/enrichment.ts` defines `EnrichmentProvider`. It's enabled only with `AI_ENRICHMENT_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`, and it's called only when the merchant clicks.

Key folders: `supabase/migrations` (schema, RLS, functions), `src/lib` (db, auth, data loaders, server actions, themes, formatting), `src/components` (`ui`, `store`, `products`, `design`, `dashboard`, `marketing`, `admin`), `tests` (unit, db/RLS, e2e).

---

## Run locally

Requirements: Node 20+ and Postgres 15+ binaries. Supabase Auth can come from the Supabase CLI or a GoTrue binary.

### Option A: Supabase CLI (Docker)

```bash
npm install
supabase init            # once; keep the existing supabase/migrations folder
supabase start           # applies supabase/migrations
cp .env.example .env.local   # fill from `supabase status`:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
npm run dev
```

### Option B: Docker-free stack (what this repo's tests use)

`npm run local:up` starts Postgres on 54322, GoTrue (Supabase Auth) on 9999, a local SMTP sink on 2500 (emails are written to `.local/mail/`), and a proxy that exposes `/auth/v1` on 54321. It also writes `.env.local` (with `STORAGE_DRIVER=local`) and applies the migrations.

```bash
# GoTrue build (once): see scripts/local-stack.sh for GOTRUE_BIN / GOTRUE_SRC
npm install
npm run local:up
npm run dev              # http://localhost:3000
npm run local:reset      # wipe and recreate the local database
```

### Make yourself a platform admin

Admins are granted only in SQL, never from user metadata:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'you@example.com';
```

---

## Tests

```bash
npm run lint && npm run typecheck
npm test                 # unit tests (formatting, Israel time zone, slugs, theme contrast)
npm run test:db          # RLS and authorization tests against the real migrations (local stack)
npm run build
npm run test:e2e         # Playwright: builds nothing, starts `next start` on :3100 (run `npm run build` first)
```

The E2E suite covers the full scenario: register merchant A → business → upload 4 photos → merge two → names and prices → template → preview → publish → anonymous customer browses, adds to cart, orders → merchant A sees the order and changes its status → merchant A edits a price → the public store shows the new price → merchant B can't open A's order, see A's orders or preview, or upload into A's product, and is refused `/platform-admin` → an admin ends A's trial: the store refuses orders while data stays intact → the admin activates a subscription: orders work again. A separate test runs password reset through email. A responsive check verifies there's no horizontal scroll at 375px and 1440px on public and dashboard pages.

`npm run marketing:capture` rebuilds the demo stores through the real UI and refreshes `public/marketing/*.webp`.

---

## Deploy: Supabase + GitHub + Vercel

### 1. Supabase (Free plan)

1. Create a project (choose a region near Israel, e.g. `eu-central-1`).
2. Apply the migrations in order, using any one of these:
   - `supabase link --project-ref <ref> && supabase db push`, or
   - `DATABASE_URL="<direct connection string>" npm run db:migrate`, or
   - paste each file from `supabase/migrations/` into the SQL editor, in filename order.
3. Check that the `store-media` bucket exists (created by migration 2), is public, has a 2 MB limit, and accepts `image/webp` only.
4. **Authentication → URL configuration:** Site URL `https://<your-domain>`. Redirect URLs: `https://<your-domain>/auth/confirm`.
5. **Authentication → Email templates** (recommended for SSR). In *Confirm signup*, link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`. In *Reset password*, link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
   (The default templates also work through the PKCE `code` flow, as long as the link is opened in the same browser.)
6. **SMTP:** Supabase's built-in email is heavily rate-limited and meant for testing. Configure a custom SMTP provider before real users sign up (several have free tiers).
7. Copy the API URL, anon/publishable key, service_role key, and the **transaction pooler** connection string (port 6543).
8. Grant yourself platform admin (SQL above).

### 2. GitHub

Push this repository. No per-merchant repositories or branches are ever created.

### 3. Vercel

1. Import the repository (framework: Next.js; defaults are fine).
2. Set the environment variables from `.env.example` (`STORAGE_DRIVER=supabase`, a long random `ORDER_IP_SALT`, `NEXT_PUBLIC_SITE_URL` = your Vercel URL).
3. Deploy. New stores go live by publishing in the app, with no redeploy.

**Hobby plan note:** Vercel Hobby is for non-commercial use. It's fine for building and testing, but move to Vercel Pro (or another commercially permitted host) before taking paying customers. Nothing in the code depends on the plan.

---

## Before accepting paying customers

1. Move hosting to a commercially permitted plan (e.g. Vercel Pro) and consider Supabase Pro (backups, no project pausing, larger storage).
2. Integrate an Israeli-compatible recurring billing provider behind `BillingProvider`, with a signed webhook that sets `subscriptions.status` and `current_period_end`. Add invoices/receipts as required by Israeli tax rules.
3. Configure custom SMTP and real transactional email (signup, password reset, ideally a "new order" email to merchants).
4. Publish terms of service and a privacy policy (customer PII is stored per the Israeli Privacy Protection Law), and add a data export/deletion process.
5. Replace the in-memory rate limiter with a shared store (e.g. Redis), and consider a CAPTCHA on checkout if spam appears.
6. Add error monitoring (e.g. Sentry) and uptime checks; review the Supabase security and performance advisors.
7. Optional: custom domains per store (`stores.custom_domain` is reserved; resolve the tenant by `Host` in `proxy.ts`).
