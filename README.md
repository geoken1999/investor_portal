# Investor Portal

A secure investor portal built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase (Postgres + Auth + Storage). Investors view their investments, returns, payouts, reports, and documents; admins manage investors, investments, payouts, reports, and documents from a separate admin portal.

This is being built incrementally. See the project plan / conversation history for the full roadmap.

## Status

- **Authentication & Onboarding: implemented.** Login, logout, forgot/reset password, self-service password change, admin-created investor accounts (admin generates a temporary password and shares it directly — email delivery proved unreliable, see "Adding an investor" below), disabled-account blocking, and role-based route separation (investor vs. admin) with server-side authorization and Postgres RLS.
- **Admin Portal: implemented.** Dashboard KPIs, investor management (add/edit/delete), investment CRUD (including an "Exited" status), payout CRUD + mark-paid — returns are calculated from paid payouts only, not projected — document/report upload & management, audit log viewer, account settings (password, Shopify integration).
- **Investor Portal: implemented.** Dashboard (real totals, returns, next payout, performance chart, amounts in ₹), investments list + detail, payouts (upcoming/history), documents, reports (including an optional live Shopify product-sales section), password change. Mobile nav (hamburger + slide-in sheet) works on both portals.
- **Shopify integration: implemented.** Admin-only: connect one Shopify store (Dev Dashboard app, Client ID + Client Secret), pick one product to track, and toggle whether its sales (date, quantity, selling price, fulfillment status — no customer data) appear in every investor's Reports page. See "Shopify sales report" below.
- **Deferred:** investor profile self-editing beyond password (name/phone still read-only), notifications, PDF generation/e-signature, multi-currency, tax calculations. See "Scope & MVP assumptions" below for how Reports/Documents and investment "type" were deliberately simplified.

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI primitives), Recharts
- **Backend:** Next.js Server Actions + Route Handlers
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **Storage:** Supabase Storage (private `documents` bucket, signed-URL downloads)
- **Money math:** `decimal.js` end-to-end — Postgres `numeric` columns are never coerced through native floats
- **Deployment target:** Vercel

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). From **Project Settings → API**, copy the Project URL, `anon` public key, and `service_role` secret key.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from step 2. Leave `NEXT_PUBLIC_SITE_URL` as `http://localhost:3000` for local development.

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser — it's only read in `src/lib/supabase/admin.ts`, a server-only module.

### 4. Apply the database migrations, in order

Run each file against your project via the Supabase dashboard's SQL editor (or `supabase db push` with the CLI linked to your project):

1. `supabase/migrations/0001_module1_auth.sql` — `profiles`, `audit_logs`, RLS, the `is_admin()` helper.
2. `supabase/migrations/0002_investments_payouts_documents.sql` — `investments`, `payouts`, `documents`, their RLS policies, and the private `documents` storage bucket + its storage-level RLS policies.
3. `supabase/migrations/0003_investment_exited_status.sql` — adds `'exited'` as a valid `investments.status` value.
4. `supabase/migrations/0004_shopify_integration.sql` — `shopify_settings` (RLS enabled with zero policies — see "Shopify sales report" below).
5. `supabase/migrations/0005_shopify_client_credentials.sql` — switches `shopify_settings` from a static access token to a Client ID + Client Secret (Shopify's current custom-app credential model, see below).

### 5. Create your first admin

There's no self-serve admin signup by design, and admin accounts are created the same way investor accounts are (see below) — but that requires being logged in as an admin already. To bootstrap the very first one: create yourself a user in the Supabase dashboard (**Authentication → Users → Add user**, with a password, "Auto Confirm User" checked), then in the SQL editor:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'you@example.com';
```

### 6. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Adding an investor

1. Log in as an admin and go to **Investors**.
2. Submit the "Add an investor" form with their name and email. This creates their account directly with a random temporary password — no email is sent (Supabase's email delivery proved unreliable to depend on; see the git history for the email-invite version if you want to revisit it once custom SMTP is reliably configured).
3. A dialog shows that password once — copy it and share it with the investor securely (not over email). It isn't recoverable afterward; if lost, use **Forgot password** on the login page instead.
4. The investor logs in immediately with that password and changes it from **Profile → Password** whenever they like.
5. From **Investors**, edit an investor to update their name/phone or set their status to Disabled (blocks login server-side, doesn't delete their account) or back to Active, or delete them entirely (permanently removes their account, investments, payouts, and documents — cannot be undone).

## Managing investments, payouts, and documents

- **Investments** (`/admin/investments`): create/edit/delete, assign to an investor. `current_value` and `total_return` are always the sum of that investment's **paid** payouts (`current_value = principal_amount + total_return`) — never a projected or accrued figure. See `src/lib/finance/calculations.ts` for the full model and reasoning.
- **Payouts** (`/admin/payouts`): create/edit against an investment, or use the one-click "Mark paid" action. Payouts are always admin-entered, never auto-generated.
- **Documents** (`/admin/documents`) and **Reports** (`/admin/reports`): the same underlying table and upload flow, filtered by category — Reports shows only the statement/report categories, Documents shows everything including agreements. Files upload to a private Supabase Storage bucket; investors and admins download via short-lived (60s) signed URLs, never public links.

## Shopify sales report

Admin-only, and controlled entirely by admin whether investors see it at all:

1. In [Shopify's Dev Dashboard](https://dev.shopify.com): create an app in the same organization as your store → give it the `read_orders`, `read_all_orders`, and `read_products` Admin API scopes → install it on your store → open the app's **Settings** tab and copy its **Client ID** and **Client secret**. (Shopify replaced the old "paste a static Admin API token from your store's own admin panel" flow with this Client ID/Secret model for custom apps in January 2026 — the old flow is gone for new apps.)
2. In this app: `/admin/settings` → **Shopify integration** → paste your `*.myshopify.com` domain, Client ID, and Client secret → **Connect store**. The credentials are verified against Shopify (by actually exchanging them for a token) before saving.
3. Pick which product to track from the dropdown (fetched live from your store) and save it. A preview of that product's sales from the last 30 days appears right there so you can check the data before showing it to anyone.
4. Flip **"Show this report to investors"** on when you're ready. Every investor then sees a "Sales" card at the top of their Reports page — order date, quantity, selling price, fulfillment status, and a running total, showing full history by default with a date-range filter to narrow it down. No customer names, emails, or addresses are ever fetched or shown.
5. Disconnecting removes the saved credentials entirely and hides the report immediately.

Built on Shopify's **GraphQL** Admin API (the REST Admin API is deprecated for new integrations as of 2025) using the **client_credentials grant**: the stored Client ID/Secret are exchanged for a short-lived (24h) access token, which is cached in `shopify_settings` and refreshed automatically shortly before it expires (`src/lib/shopify/token.ts`, `src/lib/shopify/settings.ts`) — every caller asks for "a valid token" and never handles the exchange itself. This still only works for a store in the same Shopify organization as the app — a single-store, admin-owned integration, not a multi-merchant OAuth app. Since Shopify's order search has no product-ID filter, each report fetch queries orders in the requested date range and filters their line items in-app for the tracked product — fine for typical store volumes; documented as an MVP limitation for very high-volume stores (`src/lib/shopify/sales.ts`).

## Testing

```bash
npm run test    # Vitest unit tests (validation schemas, finance calculations)
npm run lint    # ESLint
npm run build   # Type-check + production build
```

### Manual smoke-test checklist

Run through this once your Supabase project is connected and all four migrations are applied:

**Auth**
- [ ] Admin adds an investor from `/admin/investors`; a dialog shows a working temporary password; the investor logs in with it immediately and lands on `/dashboard`
- [ ] That investor changes their password from `/profile`, confirming their current password first; the old password stops working and the new one logs them in
- [ ] An investor visiting any `/admin/*` route is redirected away, not shown admin content, and vice versa
- [ ] Disabling an investor (Investors → edit → Status → Disabled) blocks their next login attempt with a clear message
- [ ] Deleting an investor (Investors → delete, with confirmation) removes their auth account, investments, payouts, and documents (including the actual files in Storage), and they can no longer log in
- [ ] Forgot password → reset email → `/reset-password` → new password works on next login

**Admin data management**
- [ ] Create an investment, assign it to an investor; before any paid payout, current value equals the principal exactly (no projected/accrued return)
- [ ] Create a scheduled payout and a paid payout against that investment; only the **paid** one affects current value/return — "Mark paid" works from the table
- [ ] Set an investment's status to **Exited**; the badge updates and current value/return are unaffected (still reflect paid payouts)
- [ ] Upload a document in a report category via `/admin/reports`; it appears in `/admin/documents` too but a document uploaded as "agreement" via `/admin/documents` does NOT appear in `/admin/reports`
- [ ] `/admin/dashboard` KPI counts match what you just created
- [ ] `/admin/audit-logs` shows entries for every action above

**Investor views + data isolation (the critical security check)**
- [ ] The investor above sees their investment, computed current value, next payout, and total payouts received correctly on `/dashboard`, `/investments`, `/payouts`, `/documents`, `/reports`
- [ ] A **second** investor, with no investments of their own, cannot see the first investor's data anywhere, and navigating directly to `/investments/<first investor's investment id>` returns a 404 (not their data) — this is enforced by Postgres RLS, not just hidden in the UI

**Mobile**
- [ ] At a phone-width viewport, both portals show a hamburger button (no sidebar); it opens a slide-in menu with all nav items, and tapping one navigates and closes the menu

**Shopify (if you've connected a store)**
- [ ] Connecting with a wrong domain or a revoked token is rejected with a clear error, and nothing is saved
- [ ] After picking a tracked product, the admin preview table shows real recent orders for that product only — not other products
- [ ] With the report toggle off, investors see no Shopify section on `/reports`; with it on, they do, and the date-range filter changes the results
- [ ] No customer name, email, or address appears anywhere in the rendered sales table
- [ ] Disconnecting removes the card's connected state and the investor-facing section disappears immediately

## Security notes

- Authorization is enforced in three independent layers: `middleware.ts` (UX redirect only), server-side guards in `src/lib/auth/guards.ts` (`requireInvestor` / `requireAdmin`, called in every protected layout), and Postgres Row Level Security (the real backstop for data access — every investor-scoped table's `select` policy is `investor_id = auth.uid() OR is_admin()`).
- The service-role Supabase client (`src/lib/supabase/admin.ts`) is used only for privileged operations — Auth Admin API calls (`createUser`, `deleteUser`) and all `shopify_settings` reads/writes (that table has no RLS policies at all; only the service-role client can touch it, always from server-only code) — and is never imported into client-reachable code. Document uploads and all other admin mutations use the ordinary RLS-bound client, authorized via the `is_admin()` policies.
- The Shopify Client Secret (and the short-lived access tokens exchanged from it) are exactly as sensitive as the Supabase service-role key and are treated the same way: never sent to the browser, never logged, read only in server-only modules (`src/lib/shopify/*`).
- The temporary password an admin generates for a new investor is returned once, in the server action's response, and shown once in a dialog — it is never stored in plaintext or logged anywhere (`audit_logs` records that the account was created, not the password).
- Document downloads re-check RLS on the `documents` row before minting a signed URL, so requesting another investor's document ID fails closed (not found) rather than leaking a URL.
- Changing your own password (`/profile`, `/admin/settings`) requires re-entering the current password server-side (via a fresh `signInWithPassword` check) before the update is allowed — an unattended, already-authenticated session can't be used to silently lock the real owner out.
- Deleting an investor removes their Storage files explicitly (Postgres cascade only removes database rows, not the underlying files) before deleting the auth account.
- Returns (`current_value`, `total_return`) are derived only from payouts an admin has actually marked **paid** — never projected or accrued — so the number an investor sees always traces back to a real, admin-entered payout record. See `src/lib/finance/calculations.ts` for the full model.
- All mutations validate input server-side with Zod, independent of any client-side validation, and every meaningful action (login, invites, deletions, CRUD on investments/payouts/documents, downloads) is written to `audit_logs`.
