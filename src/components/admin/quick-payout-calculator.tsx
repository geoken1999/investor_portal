"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateQuickReturn, formatCurrency } from "@/lib/finance/calculations";

const DEFAULT_RATE = "6.4";
const NUMBER = /^\d+(\.\d{1,4})?$/;

/** Type any amount and see the return on it at a yearly rate (6.4% to start with). */
export function QuickPayoutCalculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState(DEFAULT_RATE);

  const valid = NUMBER.test(amount.trim()) && NUMBER.test(rate.trim());
  const r = valid ? calculateQuickReturn(amount.trim(), rate.trim()) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick calculator</CardTitle>
        <CardDescription>Enter any amount to see the return at the rate below. Simple interest, not compounded.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-amount">Amount (₹)</Label>
            <Input id="quick-amount" inputMode="decimal" placeholder="e.g. 100000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-rate">Rate (% per year)</Label>
            <Input id="quick-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
        </div>
        {r ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Figure label="Per year" value={formatCurrency(r.yearly)} />
            <Figure label="Every 6 months" value={formatCurrency(r.halfYearly)} />
            <Figure label="Every quarter" value={formatCurrency(r.quarterly)} />
            <Figure label="Per month" value={formatCurrency(r.monthly)} />
            <Figure label="Per day" value={formatCurrency(r.daily)} />
            <Figure label="Value after 1 year" value={formatCurrency(r.valueAfterYear)} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{amount || rate !== DEFAULT_RATE ? "Enter the amount and rate as plain numbers." : "Type an amount to see the return."}</p>
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
