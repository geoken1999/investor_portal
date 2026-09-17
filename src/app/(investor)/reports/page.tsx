import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvestorDocumentsTable } from "@/components/investor/investor-documents-table";
import { ShopifyDateFilter } from "@/components/investor/shopify-date-filter";
import { ShopifySalesTable } from "@/components/shared/shopify-sales-table";
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { REPORT_CATEGORIES } from "@/lib/validations/documents";
import { getShopifySettings, getValidAccessToken } from "@/lib/shopify/settings";
import { fetchProductSales } from "@/lib/shopify/sales";

export const metadata: Metadata = { title: "Reports" };

export default async function InvestorReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireInvestor();
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .in("category", REPORT_CATEGORIES)
    .order("created_at", { ascending: false });

  const shopify = await getShopifySettings();
  const showShopifyReport = !!(shopify?.report_enabled && shopify.tracked_product_id);

  const params = await searchParams;
  // No default lower bound — shows full history until the investor narrows
  // it down. "To" defaults to today so the filter always has something sane
  // pre-filled without artificially hiding older orders.
  const from = params.from ?? "";
  const to = params.to || new Date().toISOString().slice(0, 10);

  let salesLines: Awaited<ReturnType<typeof fetchProductSales>> = [];
  let salesError: string | null = null;
  if (showShopifyReport && shopify) {
    try {
      const accessToken = await getValidAccessToken(shopify);
      salesLines = await fetchProductSales(
        shopify.shop_domain,
        accessToken,
        shopify.tracked_product_id!,
        from,
        to,
      );
    } catch {
      salesError = "Could not load sales data right now. Please try again shortly.";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Investment statements, payout statements, and periodic reports.
        </p>
      </div>

      {showShopifyReport && (
        <Card>
          <CardHeader>
            <CardTitle>{shopify!.tracked_product_title} — Sales</CardTitle>
            <CardDescription>
              Order date, quantity, selling price, and fulfillment status — showing full
              history by default, narrow it down with the date filter below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ShopifyDateFilter from={from} to={to} />
            {salesError ? (
              <p className="text-sm text-destructive">{salesError}</p>
            ) : (
              <ShopifySalesTable
                lines={salesLines}
                emptyMessage="No sales in this date range."
              />
            )}
          </CardContent>
        </Card>
      )}

      <InvestorDocumentsTable
        heading="Statements & Documents"
        documents={documents ?? []}
        emptyMessage="No reports are available yet."
      />
    </div>
  );
}
