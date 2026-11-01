export interface SalesCounts {
  placed: number;
  fulfilled: number;
}

/**
 * The only figures investors see about the tracked product's orders: how many orders were placed and how many of
 * them are fulfilled. An order that has the product on more than one line counts once. Cancelled orders are already
 * left out by the fetch.
 */
export function summarizeSales(lines: { orderName: string; fulfillmentStatus: string }[]): SalesCounts {
  const placed = new Set<string>();
  const fulfilled = new Set<string>();
  for (const line of lines) {
    placed.add(line.orderName);
    if (line.fulfillmentStatus.toUpperCase() === "FULFILLED") fulfilled.add(line.orderName);
  }
  return { placed: placed.size, fulfilled: fulfilled.size };
}
