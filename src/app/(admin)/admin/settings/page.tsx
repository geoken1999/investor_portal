import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { ShopifyConnectForm } from "@/components/admin/shopify-connect-form";
import { ShopifyProductPicker } from "@/components/admin/shopify-product-picker";
import { ShopifyReportToggle } from "@/components/admin/shopify-report-toggle";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { ShopifySalesTable } from "@/components/shared/shopify-sales-table";
import { disconnectShopifyStore } from "@/actions/admin/shopify";
import { requireAdmin } from "@/lib/auth/guards";
import { getShopifySettings, getValidAccessToken } from "@/lib/shopify/settings";
import { fetchShopifyProducts } from "@/lib/shopify/products";
import { fetchProductSales } from "@/lib/shopify/sales";

export const metadata: Metadata = { title: "Settings" };

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default async function AdminSettingsPage() {
  const profile = await requireAdmin();
  const shopify = await getShopifySettings();

  let products: { id: string; title: string }[] = [];
  let previewLines: Awaited<ReturnType<typeof fetchProductSales>> = [];
  let productsError: string | null = null;

  if (shopify) {
    try {
      const accessToken = await getValidAccessToken(shopify);
      products = await fetchShopifyProducts(shopify.shop_domain, accessToken);
      if (shopify.tracked_product_id) {
        const { from, to } = defaultDateRange();
        previewLines = await fetchProductSales(
          shopify.shop_domain,
          accessToken,
          shopify.tracked_product_id,
          from,
          to,
        );
      }
    } catch {
      productsError = "Could not reach Shopify with the saved credentials. They may have been revoked — try disconnecting and reconnecting.";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your admin account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Shopify integration</CardTitle>
          <CardDescription>
            Only admins can connect a store or control what investors see from it.
            Track one product&apos;s sales — order date, quantity, selling price, and
            fulfillment status. Customer names and other personal details are never
            fetched or shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {!shopify ? (
            <>
              <p className="text-sm text-muted-foreground">
                In{" "}
                <a
                  href="https://dev.shopify.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Shopify&apos;s Dev Dashboard
                </a>
                , create an app in the same organization as this store, give it the{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">read_orders</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">read_all_orders</code>,
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">read_products</code>{" "}
                Admin API scopes, install it on this store, then open the app&apos;s{" "}
                <strong>Settings</strong> tab and copy its Client ID and Client secret below.
              </p>
              <ShopifyConnectForm />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                <div className="text-sm">
                  <div className="font-medium">Connected to {shopify.shop_domain}</div>
                  {shopify.tracked_product_id && (
                    <div className="text-muted-foreground">
                      Tracking: {shopify.tracked_product_title}
                    </div>
                  )}
                </div>
                <DeleteConfirmDialog
                  action={disconnectShopifyStore}
                  hiddenFields={{}}
                  title="Disconnect this store?"
                  description="Removes the saved credentials and hides the sales report from investors. This cannot be undone — you'll need to reconnect with the Client ID and Secret again."
                />
              </div>

              {productsError ? (
                <p className="text-sm text-destructive">{productsError}</p>
              ) : (
                <>
                  <ShopifyProductPicker
                    products={products}
                    currentProductId={shopify.tracked_product_id}
                  />

                  {shopify.tracked_product_id && (
                    <>
                      <ShopifyReportToggle initialEnabled={shopify.report_enabled} />

                      <div>
                        <h3 className="mb-2 text-sm font-medium">
                          Preview — last 30 days
                        </h3>
                        <ShopifySalesTable
                          lines={previewLines}
                          emptyMessage="No sales for this product in the last 30 days."
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
