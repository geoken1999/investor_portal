import "server-only";

const API_VERSION = "2026-07";

export class ShopifyApiError extends Error {}

/**
 * Thin wrapper around the Shopify GraphQL Admin API. Server-only — the
 * access token this takes must never reach client-side code. Shopify
 * deprecated the REST Admin API for new integrations (GraphQL required for
 * new apps since April 2025), so this is the only client this app has.
 */
export async function shopifyGraphQL<T>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ShopifyApiError(
      `Shopify API request failed (${response.status}). Check the shop domain and access token.`,
    );
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new ShopifyApiError(
      json.errors.map((e: { message: string }) => e.message).join("; "),
    );
  }

  return json.data as T;
}
