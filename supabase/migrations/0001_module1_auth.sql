-- Module 1: Authentication & Onboarding
-- profiles (1:1 extension of auth.users) + audit_logs, with RLS.
--
-- Deviation from the original design doc: `profiles.email` is denormalized
-- from auth.users at creation time so the admin investor list and every
-- future admin screen can read it under ordinary RLS instead of the
-- service-role client. It is not kept in sync if a user later changes their
-- email via Supabase Auth — acceptable for the MVP, revisit if self-service
-- email changes are added.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'investor' check (role in ('investor','admin')),
  status text not null default 'invited' check (status in ('invited','active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_user_id_idx on public.audit_logs(user_id);
create index audit_logs_action_idx on public.audit_logs(action);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

-- Auto-create a profile row whenever a new auth.users row appears
-- (covers both the admin-invite flow and any future self-serve signup).
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance, reused by every future table.
create function public.set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER helper so RLS policies on profiles can check "is this
-- caller an admin" without recursively re-triggering RLS on profiles.
create function public.is_admin() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- Row inserts happen via the handle_new_user trigger (SECURITY DEFINER), so
-- this only covers a direct insert attempt from the API layer — restricted
-- to admins (e.g. a future manual profile-creation flow).
create policy "profiles_insert_admin_only" on public.profiles
  for insert with check (public.is_admin());

create policy "audit_logs_select_admin_only" on public.audit_logs
  for select using (public.is_admin());

create policy "audit_logs_insert_authenticated" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- ---------------------------------------------------------------------
-- Admin bootstrap (run manually, once, after inviting your first admin
-- through Supabase's dashboard or `auth.admin.inviteUserByEmail`):
--
--   update public.profiles
--   set role = 'admin', status = 'active'
--   where id = '<uuid of the invited auth user>';
-- ---------------------------------------------------------------------
