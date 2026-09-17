import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { calculateCurrentValue, formatCurrency, formatPercentage } from "@/lib/finance/calculations";

export const metadata: Metadata = { title: "Investment details" };

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-annual",
  annual: "Annual",
  at_maturity: "At maturity",
};

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInvestor();
  const { id } = await params;
  const supabase = await createClient();

  // RLS (investments_select_own_or_admin) means a mismatched investor simply
  // gets zero rows here, not another investor's data — this 404s cleanly.
  const { data: investment } = await supabase
    .from("investments")
    .select("*")
    .eq("id", id)
    .single();

  if (!investment) notFound();

  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .eq("investment_id", id)
    .order("payout_date", { ascending: false });

  const { currentValue, totalReturn, returnPercentage } = calculateCurrentValue(
    investment.principal_amount,
    payouts ?? [],
  );

  const fields = [
    { label: "Investment ID", value: investment.id.slice(0, 8).toUpperCase() },
    { label: "Investment type", value: investment.investment_type },
    { label: "Principal amount", value: formatCurrency(investment.principal_amount) },
    { label: "Start date", value: investment.start_date },
    { label: "Maturity date", value: investment.maturity_date ?? "—" },
    { label: "Return rate", value: `${investment.return_rate}% / year` },
    {
      label: "Payment frequency",
      value: FREQUENCY_LABELS[investment.payment_frequency] ?? investment.payment_frequency,
    },
    { label: "Current value", value: formatCurrency(currentValue) },
    { label: "Total return", value: `${formatCurrency(totalReturn)} (${formatPercentage(returnPercentage)})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {investment.investment_type}
          </h1>
          <p className="text-sm text-muted-foreground">Investment details</p>
        </div>
        <StatusBadge status={investment.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="flex justify-between border-b border-border pb-2 text-sm">
              <span className="text-muted-foreground">{field.label}</span>
              <span className="font-medium">{field.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {!payouts?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payouts recorded for this investment yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.payout_date}</TableCell>
                    <TableCell>{formatCurrency(payout.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={payout.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.reference_number || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
