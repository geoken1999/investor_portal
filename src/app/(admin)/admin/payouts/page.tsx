import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
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
import { PayoutFormDialog } from "@/components/admin/payout-form-dialog";
import { MarkPayoutPaidButton } from "@/components/admin/mark-payout-paid-button";
import { createClient } from "@/lib/supabase/server";
import {
  getAllInvestments,
  getInvestorProfiles,
  investmentLabel,
  toProfileMap,
} from "@/lib/admin/lookups";
import { formatCurrency } from "@/lib/finance/calculations";

export const metadata: Metadata = { title: "Payouts" };

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const [{ data: payouts }, investments, investors] = await Promise.all([
    supabase.from("payouts").select("*").order("payout_date", { ascending: false }),
    getAllInvestments(supabase),
    getInvestorProfiles(supabase),
  ]);
  const investorMap = toProfileMap(investors);
  const investmentMap = new Map(investments.map((i) => [i.id, i]));

  const investmentOptions = investments.map((inv) => ({
    id: inv.id,
    label: investmentLabel(
      inv,
      investorMap.get(inv.investor_id)?.full_name ||
        investorMap.get(inv.investor_id)?.email ||
        "Unknown",
    ),
  }));

  const rows = payouts ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Payouts
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and track payouts against investments.
          </p>
        </div>
        <PayoutFormDialog investmentOptions={investmentOptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All payouts</CardTitle>
          <CardDescription>{rows.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payouts yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((payout) => {
                  const investor = investorMap.get(payout.investor_id);
                  const investment = investmentMap.get(payout.investment_id);
                  return (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">
                        {investor?.full_name || investor?.email || "—"}
                      </TableCell>
                      <TableCell>{investment?.investment_type ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>{payout.payout_date}</TableCell>
                      <TableCell>
                        <StatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payout.reference_number || "—"}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        {payout.status !== "paid" && (
                          <MarkPayoutPaidButton payout={payout} />
                        )}
                        <PayoutFormDialog
                          investmentOptions={investmentOptions}
                          payout={payout}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
