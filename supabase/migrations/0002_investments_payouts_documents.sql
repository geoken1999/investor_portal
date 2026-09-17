-- Investments, Payouts, Documents (Documents also serves the Reports screens
-- via a category filter — see README / plan notes for why these share one
-- table instead of two near-identical ones).

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references auth.users(id) on delete cascade,
  investment_type text not null,
  principal_amount numeric(14,2) not null check (principal_amount >= 0),
  start_date date not null,
  maturity_date date,
  return_rate numeric(6,3) not null check (return_rate >= 0), -- annual %, e.g. 12.500
  payment_frequency text not null check (payment_frequency in
    ('monthly','quarterly','semi_annual','annual','at_maturity')),
  status text not null default 'pending' check (status in
    ('pending','active','matured','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investments_investor_id_idx on public.investments(investor_id);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  investor_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  payout_date date not null,
  status text not null default 'scheduled' check (status in
    ('scheduled','pending','processing','paid','failed','cancelled')),
  reference_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payouts_investment_id_idx on public.payouts(investment_id);
create index payouts_investor_id_idx on public.payouts(investor_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid references public.investments(id) on delete set null,
  category text not null check (category in
    ('agreement','investment_statement','payout_statement',
     'quarterly_report','annual_statement','tax_document')),
  title text not null,
  storage_path text not null,
  file_size bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index documents_investor_id_idx on public.documents(investor_id);

create trigger investments_set_updated_at before update on public.investments
  for each row execute function public.set_updated_at();
create trigger payouts_set_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

alter table public.investments enable row level security;
alter table public.payouts enable row level security;
alter table public.documents enable row level security;

-- Investors: read-only access to their own rows. Admins: full access.
-- (public.is_admin() is defined in migration 0001.)
create policy "investments_select_own_or_admin" on public.investments
  for select using (investor_id = auth.uid() or public.is_admin());
create policy "investments_insert_admin_only" on public.investments
  for insert with check (public.is_admin());
create policy "investments_update_admin_only" on public.investments
  for update using (public.is_admin());
create policy "investments_delete_admin_only" on public.investments
  for delete using (public.is_admin());

create policy "payouts_select_own_or_admin" on public.payouts
  for select using (investor_id = auth.uid() or public.is_admin());
create policy "payouts_insert_admin_only" on public.payouts
  for insert with check (public.is_admin());
create policy "payouts_update_admin_only" on public.payouts
  for update using (public.is_admin());
create policy "payouts_delete_admin_only" on public.payouts
  for delete using (public.is_admin());

create policy "documents_select_own_or_admin" on public.documents
  for select using (investor_id = auth.uid() or public.is_admin());
create policy "documents_insert_admin_only" on public.documents
  for insert with check (public.is_admin());
create policy "documents_delete_admin_only" on public.documents
  for delete using (public.is_admin());

-- Private storage bucket for document files (no public URLs — access is via
-- short-lived signed URLs generated server-side under RLS).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Object path convention: "<investor_id>/<document_id>-<filename>" so RLS
-- can scope by the first path segment without a join back to `documents`.
create policy "documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'documents' and (
      public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
create policy "documents_storage_admin_write" on storage.objects
  for insert with check (bucket_id = 'documents' and public.is_admin());
create policy "documents_storage_admin_delete" on storage.objects
  for delete using (bucket_id = 'documents' and public.is_admin());
