import { describe, expect, it } from "vitest";
import {
  buildPortfolioTimeline,
  calculateCurrentValue,
  calculateTotalPayoutsReceived,
  groupPayoutsByInvestment,
  nextPayout,
} from "@/lib/finance/calculations";

describe("calculateCurrentValue", () => {
  it("returns just the principal when there are no paid payouts", () => {
    const result = calculateCurrentValue("100000", []);
    expect(result.currentValue.toFixed(2)).toBe("100000.00");
    expect(result.totalReturn.toFixed(2)).toBe("0.00");
    expect(result.returnPercentage.toFixed(2)).toBe("0.00");
  });

  it("counts only paid payouts as the return", () => {
    const result = calculateCurrentValue("100000", [
      { amount: "3000", status: "paid" },
      { amount: "2000", status: "scheduled" },
      { amount: "1000", status: "cancelled" },
    ]);
    expect(result.totalReturn.toFixed(2)).toBe("3000.00");
    expect(result.currentValue.toFixed(2)).toBe("103000.00");
    expect(result.returnPercentage.toFixed(2)).toBe("3.00");
  });

  it("sums multiple paid payouts", () => {
    const result = calculateCurrentValue("50000", [
      { amount: "1500", status: "paid" },
      { amount: "1500", status: "paid" },
      { amount: "1500", status: "paid" },
    ]);
    expect(result.totalReturn.toFixed(2)).toBe("4500.00");
  });

  it("is unaffected by investment status — the caller no longer passes one", () => {
    // Cancelled/exited investments still show whatever was actually paid;
    // there's no status parameter left to special-case them.
    const result = calculateCurrentValue("10000", [{ amount: "500", status: "paid" }]);
    expect(result.totalReturn.toFixed(2)).toBe("500.00");
  });

  it("does not divide by zero for a zero-principal investment", () => {
    const result = calculateCurrentValue("0", [{ amount: "100", status: "paid" }]);
    expect(result.returnPercentage.toFixed(2)).toBe("0.00");
  });
});

describe("calculateTotalPayoutsReceived", () => {
  it("sums only paid payouts", () => {
    const total = calculateTotalPayoutsReceived([
      { amount: "1000", status: "paid" },
      { amount: "500", status: "scheduled" },
      { amount: "2000", status: "paid" },
      { amount: "300", status: "cancelled" },
    ]);
    expect(total.toFixed(2)).toBe("3000.00");
  });

  it("returns zero for no payouts", () => {
    expect(calculateTotalPayoutsReceived([]).toFixed(2)).toBe("0.00");
  });
});

describe("groupPayoutsByInvestment", () => {
  it("buckets payouts by investment_id", () => {
    const map = groupPayoutsByInvestment([
      { investment_id: "a", amount: "1" },
      { investment_id: "b", amount: "2" },
      { investment_id: "a", amount: "3" },
    ]);
    expect(map.get("a")).toHaveLength(2);
    expect(map.get("b")).toHaveLength(1);
    expect(map.get("c")).toBeUndefined();
  });
});

describe("nextPayout", () => {
  it("picks the earliest upcoming payout, ignoring paid/cancelled/failed", () => {
    const result = nextPayout([
      { payout_date: "2025-12-31", status: "scheduled" },
      { payout_date: "2025-09-30", status: "paid" },
      { payout_date: "2025-10-31", status: "scheduled" },
      { payout_date: "2025-08-01", status: "cancelled" },
    ]);
    expect(result?.payout_date).toBe("2025-10-31");
  });

  it("returns null when nothing is upcoming", () => {
    expect(nextPayout([{ payout_date: "2025-01-01", status: "paid" }])).toBeNull();
  });
});

describe("buildPortfolioTimeline", () => {
  it("includes principal once the investment has started, before any payout", () => {
    const now = new Date();
    const longAgo = new Date(Date.UTC(now.getUTCFullYear() - 2, 0, 1)).toISOString().slice(0, 10);
    const points = buildPortfolioTimeline(
      [{ id: "inv-1", principal_amount: "10000", start_date: longAgo }],
      new Map(),
      3,
    );
    expect(points).toHaveLength(3);
    for (const point of points) {
      expect(point.value).toBe(10000);
    }
  });

  it("excludes an investment before its start date", () => {
    const now = new Date();
    const future = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)).toISOString().slice(0, 10);
    const points = buildPortfolioTimeline(
      [{ id: "inv-1", principal_amount: "10000", start_date: future }],
      new Map(),
      3,
    );
    for (const point of points) {
      expect(point.value).toBe(0);
    }
  });

  it("steps up in the month a paid payout lands, and ignores non-paid payouts", () => {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const currentMonthPayoutDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15),
    )
      .toISOString()
      .slice(0, 10);

    const payoutsByInvestment = new Map([
      [
        "inv-1",
        [
          { amount: "500", status: "paid" as const, payout_date: currentMonthPayoutDate },
          { amount: "999", status: "scheduled" as const, payout_date: currentMonthPayoutDate },
        ],
      ],
    ]);

    const points = buildPortfolioTimeline(
      [{ id: "inv-1", principal_amount: "10000", start_date: startDate }],
      payoutsByInvestment,
      2,
    );

    // Previous month: before the payout — just principal.
    expect(points[0].value).toBe(10000);
    // Current month: principal + the paid payout, scheduled one excluded.
    expect(points[1].value).toBe(10500);
  });
});
