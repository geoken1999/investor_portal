import { describe, expect, it } from "vitest";
import { paymentTypeOf } from "../payment-type";

describe("paymentTypeOf", () => {
  it("calls cash on delivery gateways COD", () => {
    expect(paymentTypeOf(["Cash on Delivery (COD)"])).toBe("COD");
    expect(paymentTypeOf(["cash_on_delivery"])).toBe("COD");
    expect(paymentTypeOf(["COD"])).toBe("COD");
    expect(paymentTypeOf(["Razorpay", "Cash on Delivery"])).toBe("COD");
  });

  it("calls everything else prepaid", () => {
    expect(paymentTypeOf(["Razorpay Secure (UPI, Cards, Wallets, NetBanking)"])).toBe("Prepaid");
    expect(paymentTypeOf(["shopify_payments"])).toBe("Prepaid");
    expect(paymentTypeOf([])).toBe("Prepaid");
  });
});
