-- Shopify replaced the static Admin API access token for custom apps with
-- a Client ID + Client Secret (Dev Dashboard apps), exchanged for a
-- short-lived (24h) access token via the client_credentials grant — the
-- old "paste a token from your store's admin panel" flow migration 0004
-- was built around is no longer available for new apps (changed ~Jan 2026).
-- Still a single-store, admin-owned integration — the client_credentials
-- grant only works within the developer's own Shopify organization, same
-- as before; only the credential shape changes.

-- Any prior connection was saved under the old static-token model and is
-- structurally incompatible with the new flow — the admin needs to
-- reconnect with a Client ID + Client Secret regardless, so there's
-- nothing worth preserving here.
delete from public.shopify_settings;

alter table public.shopify_settings drop column access_token;
alter table public.shopify_settings add column client_id text;
alter table public.shopify_settings add column client_secret text;

-- Caches the short-lived access token this flow produces, so a fresh one
-- isn't requested from Shopify on every single report/preview render —
-- reused until close to its 24h expiry (see src/lib/shopify/settings.ts).
alter table public.shopify_settings add column cached_access_token text;
alter table public.shopify_settings add column cached_token_expires_at timestamptz;
