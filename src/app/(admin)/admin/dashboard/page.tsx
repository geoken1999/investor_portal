import type { Metadata } from "next";
import Decimal from "decimal.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/finance/calculations";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "profiles" | "investments" | "payouts",
  filters: Record<string, string>,
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { count: total } = await query;
  return total ?? 0;
}

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [
    totalInvestors,
    activeInvestors,
    activeInvestments,
    upcomingPayouts,
    paidPayouts,
    pendingPayouts,
    { data: capitalRows },
  ] = await Promise.all([
    count(supabase, "profiles", { role: "investor" }),
    count(supabase, "profiles", { role: "investor", status: "active" }),
    count(supabase, "investments", { status: "active" }),
    count(supabase, "payouts", { status: "scheduled" }),
    count(supabase, "payouts", { status: "paid" }),
    count(supabase, "payouts", { status: "pending" }),
    supabase.from("investments").select("principal_amount").in("status", ["active", "matured"]),
  ]);

  const totalCapital = (capitalRows ?? []).reduce(
    (sum, row) => sum.add(new Decimal(row.principal_amount)),
    new Decimal(0),
  );

  const kpis = [
    { label: "Total investors", value: totalInvestors },
    { label: "Active investors", value: activeInvestors },
    { label: "Active investments", value: activeInvestments },
    { label: "Total capital invested", value: formatCurrency(totalCapital) },
    { label: "Upcoming payouts", value: upcomingPayouts },
    { label: "Paid payouts", value: paidPayouts },
    { label: "Pending payouts", value: pendingPayouts },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome, {profile.full_name || "Admin"}
        </h1>
        <p className="text-sm text-muted-foreground">Portal overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="font-heading text-2xl font-semibold">
              {kpi.value}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
