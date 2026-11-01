import { describe, expect, it } from "vitest";
import { deliveryStatusOf } from "../delivery-status";

const f = (...statuses: (string | null)[]) => statuses.map((displayStatus) => ({ displayStatus }));

describe("deliveryStatusOf", () => {
  it("says not shipped when nothing has been sent", () => {
    expect(deliveryStatusOf([])).toBe("not_shipped");
    expect(deliveryStatusOf(f("CANCELED", "LABEL_VOIDED", null))).toBe("not_shipped");
  });

  it("says delivered when every live shipment arrived", () => {
    expect(deliveryStatusOf(f("DELIVERED"))).toBe("delivered");
    expect(deliveryStatusOf(f("DELIVERED", "CANCELED", "PICKED_UP"))).toBe("delivered");
  });

  it("says partially delivered when only some did", () => {
    expect(deliveryStatusOf(f("DELIVERED", "IN_TRANSIT"))).toBe("partially_delivered");
  });

  it("otherwise shows the latest shipment's status", () => {
    expect(deliveryStatusOf(f("IN_TRANSIT"))).toBe("in_transit");
    expect(deliveryStatusOf(f("CONFIRMED", "OUT_FOR_DELIVERY"))).toBe("out_for_delivery");
    expect(deliveryStatusOf(f("ATTEMPTED_DELIVERY"))).toBe("attempted_delivery");
  });
});
