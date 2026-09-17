import "server-only";
import { shopifyGraphQL } from "@/lib/shopify/client";

export interface ProductSaleLine {
  orderName: string;
  date: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  currencyCode: string;
  fulfillmentStatus: string;
}

interface OrdersPage {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: {
      node: {
        name: string;
        createdAt: string;
        displayFulfillmentStatus: string;
        lineItems: {
          edges: {
            node: {
              quantity: number;
              product: { id: string } | null;
              discountedUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
              discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } };
            };
          }[];
        };
      };
    }[];
  };
}

const ORDERS_QUERY = `
  query ProductSales($cursor: String, $searchQuery: String!) {
    orders(first: 50, after: $cursor, query: $searchQuery, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          name
          createdAt
          displayFulfillmentStatus
          lineItems(first: 50) {
            edges {
              node {
                quantity
                product { id }
                discountedUnitPriceSet { shopMoney { amount currencyCode } }
                discountedTotalSet { shopMoney { amount currencyCode } }
              }
            }
          }
        }
      }
    }
  }
`;

const MAX_ORDERS_SCANNED = 500;

/**
 * Sales lines for one tracked product, optionally bounded by date. Shopify's
 * order search syntax has no product_id filter, so this fetches candidate
 * orders (newest first) and filters their line items in-app for the tracked
 * product — fine for typical store volumes; a store with very high order
 * counts would eventually want a synced/webhook-based approach instead of
 * live-fetching on every report view (documented MVP limitation, not built
 * here). Orders are scanned newest-first specifically so that if the scan
 * cap below is hit on a high-volume store, it's the oldest orders in range
 * that get dropped, not the most recent ones.
 *
 * Fulfillment status is the order-level `displayFulfillmentStatus` —
 * Shopify's GraphQL schema doesn't expose a clean per-line-item status the
 * way the old REST API did, and order-level matches the "basic details"
 * this report is meant to show. No customer PII (name/email/address) is
 * ever requested here.
 */
export async function fetchProductSales(
  shopDomain: string,
  accessToken: string,
  productId: string,
  from?: string,
  to?: string,
): Promise<ProductSaleLine[]> {
  const clauses: string[] = [];
  if (from) clauses.push(`created_at:>=${from}`);
  if (to) clauses.push(`created_at:<=${to}`);
  const searchQuery = clauses.join(" ");
  const lines: ProductSaleLine[] = [];
  let cursor: string | null = null;
  let scanned = 0;

  while (scanned < MAX_ORDERS_SCANNED) {
    const data: OrdersPage = await shopifyGraphQL<OrdersPage>(
      shopDomain,
      accessToken,
      ORDERS_QUERY,
      { cursor, searchQuery },
    );

    for (const { node: order } of data.orders.edges) {
      scanned += 1;
      for (const { node: item } of order.lineItems.edges) {
        if (item.product?.id !== productId) continue;
        lines.push({
          orderName: order.name,
          date: order.createdAt.slice(0, 10),
          quantity: item.quantity,
          unitPrice: item.discountedUnitPriceSet.shopMoney.amount,
          lineTotal: item.discountedTotalSet.shopMoney.amount,
          currencyCode: item.discountedTotalSet.shopMoney.currencyCode,
          fulfillmentStatus: order.displayFulfillmentStatus,
        });
      }
    }

    if (!data.orders.pageInfo.hasNextPage) break;
    cursor = data.orders.pageInfo.endCursor;
  }

  return lines.sort((a, b) => b.date.localeCompare(a.date));
}
