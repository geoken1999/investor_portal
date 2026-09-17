import "server-only";
import { ShopifyApiError } from "@/lib/shopify/client";

export interface ShopifyTokenResult {
  accessToken: string;
  expiresInSeconds: number;
}

/**
 * Exchanges a Dev Dashboard app's Client ID + Client Secret for a
 * short-lived (24h) Admin API access token via the client_credentials
 * grant — the flow Shopify now requires for custom apps (replaced the old
 * static-token model in Jan 2026). Only works when the app and the store
 * belong to the same Shopify organization — i.e. this is still a
 * single-store, developer/admin-owned integration, not a multi-merchant
 * OAuth app.
 */
export async function requestShopifyAccessToken(
  shopDomain: string,
  clientId: string,
  clientSecret: string,
): Promise<ShopifyTokenResult> {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ShopifyApiError(
      `Shopify rejected these credentials (${response.status}). Check the Client ID, Client Secret, and that the app is installed on this store.`,
    );
  }

  const json = await response.json();
  if (!json.access_token) {
    throw new ShopifyApiError("Shopify did not return an access token for these credentials.");
  }

  return {
    accessToken: json.access_token,
    expiresInSeconds: json.expires_in ?? 86399,
  };
}
