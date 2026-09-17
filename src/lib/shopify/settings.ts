import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestShopifyAccessToken } from "@/lib/shopify/token";
import { ShopifyApiError } from "@/lib/shopify/client";
import type { ShopifySettings } from "@/types/database";

// Fixed id for the single settings row this table ever holds — lets every
// read/write target it without a separate lookup query.
export const SHOPIFY_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// Refresh a bit before actual expiry so a request in flight never gets
// rejected mid-use by an access token that expired seconds ago.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

/**
 * `shopify_settings` has no RLS policies at all (see migration 0004), so
 * every read of it — admin config page included — goes through the
 * service-role client, never the regular RLS-bound one.
 */
export async function getShopifySettings(): Promise<ShopifySettings | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient.from("shopify_settings").select("*").maybeSingle();
  return data;
}

/**
 * Returns a live Admin API access token for the connected store, using the
 * cached one if it's still valid or exchanging the stored Client ID/Secret
 * for a fresh one (client_credentials grant) and caching that back to the
 * row otherwise. Every caller that needs to talk to Shopify goes through
 * this — none of them handle token acquisition themselves.
 */
export async function getValidAccessToken(settings: ShopifySettings): Promise<string> {
  const cachedExpiry = settings.cached_token_expires_at
    ? new Date(settings.cached_token_expires_at).getTime()
    : 0;
  if (settings.cached_access_token && cachedExpiry - EXPIRY_SAFETY_MARGIN_MS > Date.now()) {
    return settings.cached_access_token;
  }

  if (!settings.client_id || !settings.client_secret) {
    throw new ShopifyApiError("This store has no Client ID/Secret saved. Reconnect it.");
  }

  const { accessToken, expiresInSeconds } = await requestShopifyAccessToken(
    settings.shop_domain,
    settings.client_id,
    settings.client_secret,
  );

  const adminClient = createAdminClient();
  await adminClient
    .from("shopify_settings")
    .update({
      cached_access_token: accessToken,
      cached_token_expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    })
    .eq("id", settings.id);

  return accessToken;
}
