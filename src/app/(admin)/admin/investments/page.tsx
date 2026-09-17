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
import { InvestmentFormDialog } from "@/components/admin/investment-form-dialog";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { deleteInvestment } from "@/actions/admin/investments";
import { createClient } from "@/lib/supabase/server";
import { getAllInvestments, getInvestorProfiles, toProfileMap } from "@/lib/admin/lookups";
import {
  calculateCurrentValue,
  formatCurrency,
  groupPayoutsByInvestment,
} from "@/lib/finance/calculations";

export const metadata: Metadata = { title: "Investments" };

export default async function AdminInvestmentsPage() {
  const supabase = await createClient();
  const [investments, investors, { data: payouts }] = await Promise.all([
    getAllInvestments(supabase),
    getInvestorProfiles(supabase),
    supabase.from("payouts").select("investment_id, amount, status"),
  ]);
  const investorMap = toProfileMap(investors);
  const payoutsByInvestment = groupPayoutsByInvestment(payouts ?? []);
  const investorOptions = investors.map((i) => ({ id: i.id, name: i.full_name || i.email }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Investments
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage investments, and assign them to investors.
          </p>
        </div>
        <InvestmentFormDialog investors={investorOptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All investments</CardTitle>
          <CardDescription>{investments.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!investments.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No investments yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Current value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => {
                  const investor = investorMap.get(investment.investor_id);
                  const { currentValue } = calculateCurrentValue(
                    investment.principal_amount,
                    payoutsByInvestment.get(investment.id) ?? [],
                  );
                  return (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">
                        {investor?.full_name || investor?.email || "—"}
                      </TableCell>
                      <TableCell>{investment.investment_type}</TableCell>
                      <TableCell>
                        {formatCurrency(investment.principal_amount)}
                      </TableCell>
                      <TableCell>{formatCurrency(currentValue)}</TableCell>
                      <TableCell>
                        <StatusBadge status={investment.status} />
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <InvestmentFormDialog
                          investors={investorOptions}
                          investment={investment}
                        />
                        <DeleteConfirmDialog
                          action={deleteInvestment}
                          hiddenFields={{ investmentId: investment.id }}
                          title="Delete this investment?"
                          description="This also removes its payout history. This cannot be undone."
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
