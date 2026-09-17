import "server-only";
import { shopifyGraphQL } from "@/lib/shopify/client";
import { requestShopifyAccessToken } from "@/lib/shopify/token";

export interface ShopifyProduct {
  id: string;
  title: string;
}

/**
 * Sanity-check called when the admin connects a store — exchanges the
 * Client ID/Secret for an access token and makes one cheap call, confirming
 * everything actually works before we save it. Returns the token it
 * obtained so the caller can seed the cache instead of requesting a second
 * one immediately after.
 */
export async function verifyShopifyCredentials(
  shopDomain: string,
  clientId: string,
  clientSecret: string,
): Promise<{ shopName: string; accessToken: string; expiresInSeconds: number }> {
  const { accessToken, expiresInSeconds } = await requestShopifyAccessToken(
    shopDomain,
    clientId,
    clientSecret,
  );
  const data = await shopifyGraphQL<{ shop: { name: string } }>(
    shopDomain,
    accessToken,
    `query { shop { name } }`,
  );
  return { shopName: data.shop.name, accessToken, expiresInSeconds };
}

/**
 * First 100 products, for the admin's tracked-product picker. A store with
 * a larger catalog than that isn't supported by this simple picker yet —
 * documented MVP limitation.
 */
export async function fetchShopifyProducts(
  shopDomain: string,
  accessToken: string,
): Promise<ShopifyProduct[]> {
  const data = await shopifyGraphQL<{
    products: { edges: { node: { id: string; title: string } }[] };
  }>(
    shopDomain,
    accessToken,
    `query {
      products(first: 100) {
        edges { node { id title } }
      }
    }`,
  );
  return data.products.edges.map((e) => e.node);
}
