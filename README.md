# Investor Portal

A secure investor portal built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase (Postgres + Auth + Storage). Investors view their investments, returns, payouts, reports, and documents; admins manage investors, investments, payouts, reports, and documents from a separate admin portal.

This is being built incrementally. See the project plan / conversation history for the full roadmap.

## Status

- **Authentication & Onboarding: implemented.** Login, logout, forgot/reset password, self-service password change, admin-invited investor accounts (email invite link, investor sets their own password — no password ever passes through the admin or this app), disabled-account blocking, and role-based route separation (investor vs. admin) with server-side authorization and Postgres RLS.
- **Admin Portal: implemented.** Dashboard KPIs, investor management (add/edit/delete), investment CRUD (including an "Exited" status), payout CRUD + mark-paid — returns are calculated from paid payouts only, not projected — document/report upload & management, audit log viewer, account settings (password).
- **Investor Portal: implemented.** Dashboard (real totals, returns, next payout, performance chart, amounts in ₹), investments list + detail, payouts (upcoming/history), documents, reports, password change. Mobile nav (hamburger + slide-in sheet) works on both portals.
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
2. Submit the "Add an investor" form with their name and email. Supabase emails them an invite link — no password is generated, shown, or handled by this app at any point.
3. The link lands them on **Activate your account**, where they set their own password and confirm their name/phone.
4. From **Investors**, edit an investor to update their name/phone or set their status to Disabled (blocks login server-side, doesn't delete their account) or back to Active, or delete them entirely (permanently removes their account, investments, payouts, and documents — cannot be undone).

## Managing investments, payouts, and documents

- **Investments** (`/admin/investments`): create/edit/delete, assign to an investor. `current_value` and `total_return` are always computed on the fly from `principal_amount`, `return_rate`, `start_date`/`maturity_date`, and `status` — see `src/lib/finance/calculations.ts` for the documented accrual model and its assumptions.
- **Payouts** (`/admin/payouts`): create/edit against an investment, or use the one-click "Mark paid" action. Payouts are always admin-entered, never auto-generated.
- **Documents** (`/admin/documents`) and **Reports** (`/admin/reports`): the same underlying table and upload flow, filtered by category — Reports shows only the statement/report categories, Documents shows everything including agreements. Files upload to a private Supabase Storage bucket; investors and admins download via short-lived (60s) signed URLs, never public links.

## Testing

```bash
npm run test    # Vitest unit tests (validation schemas, finance calculations)
npm run lint    # ESLint
npm run build   # Type-check + production build
```

### Manual smoke-test checklist

Run through this once your Supabase project is connected and all three migrations are applied:

**Auth**
- [ ] Admin adds an investor from `/admin/investors`; the invite email lands on `/activate` with the email pre-filled; setting a password there redirects to `/dashboard`
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

## Security notes

- Authorization is enforced in three independent layers: `middleware.ts` (UX redirect only), server-side guards in `src/lib/auth/guards.ts` (`requireInvestor` / `requireAdmin`, called in every protected layout), and Postgres Row Level Security (the real backstop for data access — every investor-scoped table's `select` policy is `investor_id = auth.uid() OR is_admin()`).
- The service-role Supabase client (`src/lib/supabase/admin.ts`) is used only for privileged Auth Admin API calls (`inviteUserByEmail`, `deleteUser`) and is never imported into client-reachable code. Document uploads and all other admin mutations use the ordinary RLS-bound client, authorized via the `is_admin()` policies — not the service role.
- No investor or admin password is ever generated, displayed, or stored by this application — accounts are provisioned via Supabase's own invite-email flow, and the investor sets their password themselves during activation.
- Document downloads re-check RLS on the `documents` row before minting a signed URL, so requesting another investor's document ID fails closed (not found) rather than leaking a URL.
- Changing your own password (`/profile`, `/admin/settings`) requires re-entering the current password server-side (via a fresh `signInWithPassword` check) before the update is allowed — an unattended, already-authenticated session can't be used to silently lock the real owner out.
- Deleting an investor removes their Storage files explicitly (Postgres cascade only removes database rows, not the underlying files) before deleting the auth account.
- Returns (`current_value`, `total_return`) are derived only from payouts an admin has actually marked **paid** — never projected or accrued — so the number an investor sees always traces back to a real, admin-entered payout record. See `src/lib/finance/calculations.ts` for the full model.
- All mutations validate input server-side with Zod, independent of any client-side validation, and every meaningful action (login, invites, deletions, CRUD on investments/payouts/documents, downloads) is written to `audit_logs`.
