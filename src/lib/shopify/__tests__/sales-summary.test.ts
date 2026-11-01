import { describe, expect, it } from "vitest";
import { summarizeSales } from "../sales-summary";

describe("summarizeSales", () => {
  it("counts placed and fulfilled orders", () => {
    const lines = [
      { orderName: "#1001", fulfillmentStatus: "FULFILLED" },
      { orderName: "#1002", fulfillmentStatus: "UNFULFILLED" },
      { orderName: "#1003", fulfillmentStatus: "PARTIALLY_FULFILLED" },
      { orderName: "#1004", fulfillmentStatus: "FULFILLED" },
    ];
    expect(summarizeSales(lines)).toEqual({ placed: 4, fulfilled: 2 });
  });

  it("counts an order once even when the product is on several lines", () => {
    const lines = [
      { orderName: "#1001", fulfillmentStatus: "FULFILLED" },
      { orderName: "#1001", fulfillmentStatus: "FULFILLED" },
    ];
    expect(summarizeSales(lines)).toEqual({ placed: 1, fulfilled: 1 });
  });

  it("is zero when there are no orders", () => {
    expect(summarizeSales([])).toEqual({ placed: 0, fulfilled: 0 });
  });
});
