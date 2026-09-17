import type { Metadata } from "next";
import Link from "next/link";
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
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  calculateCurrentValue,
  formatCurrency,
  formatPercentage,
  groupPayoutsByInvestment,
} from "@/lib/finance/calculations";

export const metadata: Metadata = { title: "My Investments" };

export default async function InvestorInvestmentsPage() {
  await requireInvestor();
  const supabase = await createClient();
  const [{ data: investments }, { data: payouts }] = await Promise.all([
    supabase.from("investments").select("*").order("start_date", { ascending: false }),
    supabase.from("payouts").select("investment_id, amount, status"),
  ]);

  const rows = investments ?? [];
  const payoutsByInvestment = groupPayoutsByInvestment(payouts ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Investments
        </h1>
        <p className="text-sm text-muted-foreground">
          All investments currently assigned to your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investments</CardTitle>
          <CardDescription>{rows.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You don&apos;t have any investments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Return rate</TableHead>
                  <TableHead>Current value</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((inv) => {
                  const { currentValue, returnPercentage } = calculateCurrentValue(
                    inv.principal_amount,
                    payoutsByInvestment.get(inv.id) ?? [],
                  );
                  return (
                    <TableRow key={inv.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Link href={`/investments/${inv.id}`} className="hover:underline">
                          {inv.investment_type}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(inv.principal_amount)}</TableCell>
                      <TableCell>{inv.return_rate}%</TableCell>
                      <TableCell>{formatCurrency(currentValue)}</TableCell>
                      <TableCell>{formatPercentage(returnPercentage)}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
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
