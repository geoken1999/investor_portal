import type { Metadata } from "next";
import Link from "next/link";
import Decimal from "decimal.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PortfolioChart } from "@/components/investor/portfolio-chart";
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  buildPortfolioTimeline,
  calculateCurrentValue,
  calculateTotalPayoutsReceived,
  formatCurrency,
  formatPercentage,
  groupPayoutsByInvestment,
  nextPayout,
} from "@/lib/finance/calculations";

export const metadata: Metadata = { title: "Dashboard" };

export default async function InvestorDashboardPage() {
  const profile = await requireInvestor();
  const supabase = await createClient();

  const [{ data: investments }, { data: payouts }, { data: documents }] =
    await Promise.all([
      supabase.from("investments").select("*").order("start_date", { ascending: false }),
      supabase.from("payouts").select("*").order("payout_date", { ascending: true }),
      supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const allInvestments = investments ?? [];
  const allPayouts = payouts ?? [];
  const payoutsByInvestment = groupPayoutsByInvestment(allPayouts);

  const totals = allInvestments.reduce(
    (acc, inv) => {
      const { currentValue, totalReturn } = calculateCurrentValue(
        inv.principal_amount,
        payoutsByInvestment.get(inv.id) ?? [],
      );
      return {
        principal: acc.principal.add(inv.principal_amount),
        currentValue: acc.currentValue.add(currentValue),
        totalReturn: acc.totalReturn.add(totalReturn),
      };
    },
    { principal: new Decimal(0), currentValue: new Decimal(0), totalReturn: new Decimal(0) },
  );
  const returnPercentage = totals.principal.isZero()
    ? new Decimal(0)
    : totals.totalReturn.div(totals.principal).mul(100);

  const totalPayoutsReceived = calculateTotalPayoutsReceived(allPayouts);
  const upcoming = nextPayout(allPayouts);
  const timeline = buildPortfolioTimeline(allInvestments, payoutsByInvestment);

  const kpis = [
    { label: "Total Invested", value: formatCurrency(totals.principal) },
    { label: "Current Value", value: formatCurrency(totals.currentValue) },
    { label: "Total Returns", value: formatCurrency(totals.totalReturn) },
    { label: "Return", value: formatPercentage(returnPercentage) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome, {profile.full_name || "Investor"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your investment dashboard.
        </p>
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
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Next Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming ? (
              <>
                <div className="font-heading text-2xl font-semibold">
                  {formatCurrency(upcoming.amount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {upcoming.payout_date}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">None scheduled</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Payouts Received
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl font-semibold">
            {formatCurrency(totalPayoutsReceived)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Performance</CardTitle>
          <CardDescription>
            Illustrative value over the last 12 months, based on each investment&apos;s
            stated return rate. This is not financial, tax, or investment advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allInvestments.length ? (
            <PortfolioChart data={timeline} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Your performance chart will appear once you have an active investment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Investments</CardTitle>
        </CardHeader>
        <CardContent>
          {!allInvestments.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You don&apos;t have any investments yet.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {allInvestments.slice(0, 5).map((inv) => {
                const { currentValue } = calculateCurrentValue(
                  inv.principal_amount,
                  payoutsByInvestment.get(inv.id) ?? [],
                );
                return (
                  <Link
                    key={inv.id}
                    href={`/investments/${inv.id}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{inv.investment_type}</div>
                      <div className="text-muted-foreground">
                        {formatCurrency(inv.principal_amount)} principal
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(currentValue)}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!!documents?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border">
              {documents.map((doc) => (
                <div key={doc.id} className="py-3 text-sm">
                  {doc.title}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
