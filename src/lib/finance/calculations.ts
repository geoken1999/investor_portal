import Decimal from "decimal.js";
import type { Investment, Payout } from "@/types/database";

/**
 * Centralized financial math. Every investment/return/payout number shown
 * anywhere in the app must go through this file — never re-derive these
 * formulas inline in a component or server action.
 *
 * MODEL & ASSUMPTIONS:
 *
 * - `total_return` for an investment is the sum of its **paid** payouts —
 *   not a projected or accrued formula. Nothing is "earned" until an admin
 *   has actually recorded a payout and marked it paid. This applies
 *   uniformly regardless of the investment's status: a cancelled or exited
 *   investment still correctly shows whatever was actually paid out before
 *   or at that point — status is a lifecycle label, it doesn't gate the math.
 * - `current_value = principal_amount + total_return`.
 * - Both are DERIVED, not stored columns — computed fresh from
 *   `principal_amount` and the linked payouts, so they can never go stale
 *   relative to those inputs.
 * - All money math uses decimal.js — Postgres `numeric` columns arrive as
 *   strings specifically to avoid native float precision loss; never coerce
 *   them with `Number(...)` and do arithmetic on the result.
 */

export interface InvestmentValuation {
  currentValue: Decimal;
  totalReturn: Decimal;
  returnPercentage: Decimal;
}

export function calculateCurrentValue(
  principalAmount: string,
  payouts: Pick<Payout, "amount" | "status">[],
): InvestmentValuation {
  const principal = new Decimal(principalAmount);
  const totalReturn = calculateTotalPayoutsReceived(payouts);
  const currentValue = principal.add(totalReturn);
  const returnPercentage = principal.isZero()
    ? new Decimal(0)
    : totalReturn.div(principal).mul(100);

  return { currentValue, totalReturn, returnPercentage };
}

export function calculateTotalPayoutsReceived(
  payouts: Pick<Payout, "amount" | "status">[],
): Decimal {
  return payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum.add(new Decimal(p.amount)), new Decimal(0));
}

/** Groups payouts by `investment_id` — shared by every page that needs to
 * hand each investment its own slice of payouts for `calculateCurrentValue`. */
export function groupPayoutsByInvestment<T extends Pick<Payout, "investment_id">>(
  payouts: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const payout of payouts) {
    const bucket = map.get(payout.investment_id);
    if (bucket) bucket.push(payout);
    else map.set(payout.investment_id, [payout]);
  }
  return map;
}

const UPCOMING_STATUSES = new Set(["scheduled", "pending", "processing"]);

export function nextPayout<T extends Pick<Payout, "payout_date" | "status">>(
  payouts: T[],
): T | null {
  const upcoming = payouts
    .filter((p) => UPCOMING_STATUSES.has(p.status))
    .sort((a, b) => a.payout_date.localeCompare(b.payout_date));
  return upcoming[0] ?? null;
}

/**
 * Portfolio value at the end of each of the last `months` calendar months
 * (inclusive of the current month), summed across every investment that had
 * already started by that point. Since returns only materialize when a
 * payout is paid, this is a step curve (it jumps on payout dates), not a
 * smooth accrual line.
 */
export function buildPortfolioTimeline(
  investments: Pick<Investment, "id" | "principal_amount" | "start_date">[],
  payoutsByInvestment: Map<string, Pick<Payout, "amount" | "status" | "payout_date">[]>,
  months = 12,
): { month: string; value: number }[] {
  const now = new Date();
  const points: { month: string; value: number }[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const pointDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const monthEnd = new Date(Date.UTC(pointDate.getUTCFullYear(), pointDate.getUTCMonth() + 1, 0));
    const asOf = monthEnd.toISOString().slice(0, 10);
    const monthLabel = pointDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });

    const total = investments.reduce((sum, inv) => {
      if (inv.start_date > asOf) return sum;
      const paidSoFar = (payoutsByInvestment.get(inv.id) ?? []).filter(
        (p) => p.status === "paid" && p.payout_date <= asOf,
      );
      return sum
        .add(inv.principal_amount)
        .add(calculateTotalPayoutsReceived(paidSoFar));
    }, new Decimal(0));

    points.push({ month: monthLabel, value: total.toNumber() });
  }

  return points;
}

export function formatCurrency(
  value: Decimal | string | number,
  currency = "INR",
): string {
  const num = value instanceof Decimal ? value.toNumber() : Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercentage(value: Decimal | string | number): string {
  const num = value instanceof Decimal ? value.toNumber() : Number(value);
  return `${num.toFixed(2)}%`;
}
