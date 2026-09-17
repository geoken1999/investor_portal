-- Shopify product sales report: a single-row settings table holding the
-- store connection + which product to track + whether investors can see it.

create table public.shopify_settings (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null,
  access_token text not null,
  tracked_product_id text,          -- Shopify GID, e.g. gid://shopify/Product/123
  tracked_product_title text,       -- denormalized, avoids an extra API call for display
  report_enabled boolean not null default false,
  connected_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shopify_settings_set_updated_at before update on public.shopify_settings
  for each row execute function public.set_updated_at();

alter table public.shopify_settings enable row level security;

-- Deliberately zero policies. This table holds a third-party API access
-- token, equivalent in sensitivity to the Supabase service-role key itself.
-- RLS-enabled-with-no-policies means NO client role (including an
-- authenticated admin's anon-key session) can read or write it at all —
-- only the service-role client (which bypasses RLS by design) ever touches
-- this table, always from server-only code (src/actions/admin/shopify.ts).
