"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PayoutFormDialog } from "@/components/admin/payout-form-dialog";
import { calculatePayoutDue, formatCurrency } from "@/lib/finance/calculations";
import type { Investment, Payout } from "@/types/database";

type CalcInvestment = Pick<
  Investment,
  "id" | "principal_amount" | "return_rate" | "payment_frequency" | "start_date" | "maturity_date"
> & { label: string };
type CalcPayout = Pick<Payout, "investment_id" | "amount" | "status" | "payout_date">;

const FREQUENCY_LABELS: Record<Investment["payment_frequency"], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Every 6 months",
  annual: "Yearly",
  at_maturity: "At maturity",
};

const today = () => new Date().toISOString().slice(0, 10);

/** Works out what an investment owes its investor, and starts a payout for it with the amount filled in. */
export function PayoutCalculator({
  investments,
  payouts,
  investmentOptions,
}: {
  investments: CalcInvestment[];
  payouts: CalcPayout[];
  investmentOptions: { id: string; label: string }[];
}) {
  const [investmentId, setInvestmentId] = useState(investments[0]?.id ?? "");
  const [asOf, setAsOf] = useState(today);
  const items = Object.fromEntries(investments.map((i) => [i.id, i.label]));
  const investment = investments.find((i) => i.id === investmentId);

  const result = useMemo(() => {
    if (!investment || !asOf) return null;
    return calculatePayoutDue(
      investment,
      payouts.filter((p) => p.investment_id === investment.id),
      asOf,
    );
  }, [investment, payouts, asOf]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout calculator</CardTitle>
        <CardDescription>
          Return is the yearly rate on the principal, simple (not compounded), over a 365-day year.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {investments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add an investment to use the calculator.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="calc-investment">Investment</Label>
                <Select items={items} value={investmentId} onValueChange={(v) => setInvestmentId(v as string)}>
                  <SelectTrigger id="calc-investment" className="w-full">
                    <SelectValue placeholder="Select an investment" />
                  </SelectTrigger>
                  <SelectContent>
                    {investments.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="calc-date">Calculate up to</Label>
                <Input id="calc-date" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
              </div>
            </div>

            {investment && result && (
              <>
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Figure label={`${FREQUENCY_LABELS[investment.payment_frequency]} payment`} value={result.perPeriod ? formatCurrency(result.perPeriod) : "Set a maturity date"} />
                  <Figure label={`Rate (${investment.return_rate}% / year)`} value={`${formatCurrency(result.annualReturn)} / year`} />
                  <Figure label={`Accrued since ${result.accruedFrom}`} value={formatCurrency(result.accrued)} />
                  <Figure label="Paid so far" value={formatCurrency(result.paidSoFar)} />
                </dl>
                <div className="flex flex-wrap gap-2">
                  {result.perPeriod && (
                    <PayoutFormDialog
                      key={`${investment.id}-period-${result.perPeriod.toFixed(2)}`}
                      investmentOptions={investmentOptions}
                      defaults={{ investmentId: investment.id, amount: result.perPeriod.toFixed(2), payoutDate: asOf }}
                      trigger={<button type="button" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Create payout for this amount</button>}
                    />
                  )}
                  {result.accrued.gt(0) && (
                    <PayoutFormDialog
                      key={`${investment.id}-accrued-${result.accrued.toFixed(2)}-${asOf}`}
                      investmentOptions={investmentOptions}
                      defaults={{ investmentId: investment.id, amount: result.accrued.toFixed(2), payoutDate: asOf }}
                      trigger={<button type="button" className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">Create payout for accrued amount</button>}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading text-lg font-semibold">{value}</dd>
    </div>
  );
}
