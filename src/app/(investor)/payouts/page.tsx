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
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/finance/calculations";
import type { Payout } from "@/types/database";

export const metadata: Metadata = { title: "Payouts" };

const UPCOMING_STATUSES = new Set(["scheduled", "pending", "processing"]);

function PayoutsTable({ payouts, emptyMessage }: { payouts: Payout[]; emptyMessage: string }) {
  if (!payouts.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }
  return (
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
  );
}

export default async function InvestorPayoutsPage() {
  await requireInvestor();
  const supabase = await createClient();
  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .order("payout_date", { ascending: true });

  const rows = payouts ?? [];
  const upcoming = rows.filter((p) => UPCOMING_STATUSES.has(p.status));
  const history = rows
    .filter((p) => !UPCOMING_STATUSES.has(p.status))
    .sort((a, b) => b.payout_date.localeCompare(a.payout_date));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming and past payouts across all your investments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming payouts</CardTitle>
          <CardDescription>{upcoming.length} scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <PayoutsTable payouts={upcoming} emptyMessage="No upcoming payouts." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
          <CardDescription>{history.length} recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <PayoutsTable payouts={history} emptyMessage="No payout history yet." />
        </CardContent>
      </Card>
    </div>
  );
}
