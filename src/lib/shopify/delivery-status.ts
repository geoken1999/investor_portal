// Where an order's shipment has got to, from its fulfillments' tracking status (Fulfillment.displayStatus, such as
// IN_TRANSIT, OUT_FOR_DELIVERY or DELIVERED). Lowercased with underscores, ready for the status badge.
const IGNORED = new Set(["CANCELED", "CANCELLED", "LABEL_VOIDED"]);
const DONE = new Set(["DELIVERED", "PICKED_UP"]);

export function deliveryStatusOf(fulfillments: { displayStatus: string | null }[]): string {
  const live = fulfillments.map((f) => (f.displayStatus ?? "").toUpperCase()).filter((s) => s && !IGNORED.has(s));
  if (live.length === 0) return "not_shipped";
  const delivered = live.filter((s) => DONE.has(s)).length;
  if (delivered === live.length) return "delivered";
  if (delivered > 0) return "partially_delivered";
  return live[live.length - 1].toLowerCase();
}
