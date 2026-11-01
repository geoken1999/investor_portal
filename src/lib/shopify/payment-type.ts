export type PaymentType = "COD" | "Prepaid";

/**
 * Whether an order is cash on delivery or paid up front. Shopify lists the payment gateways an order used
 * (paymentGatewayNames); the cash-on-delivery gateway is named "Cash on Delivery (COD)" or "cash_on_delivery"
 * depending on the store's setup, so any gateway that looks like COD makes the order a COD order.
 */
export function paymentTypeOf(gatewayNames: string[]): PaymentType {
  return gatewayNames.some((name) => /\bcod\b|cash[\s_-]*on[\s_-]*delivery/i.test(name)) ? "COD" : "Prepaid";
}
