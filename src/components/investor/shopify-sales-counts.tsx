import type { SalesCounts } from "@/lib/shopify/sales-summary";

/** The two order counts an investor sees; no order-level details are passed to this component. */
export function ShopifySalesCounts({ counts }: { counts: SalesCounts }) {
  const items = [
    { label: "Orders placed", value: counts.placed },
    { label: "Orders fulfilled", value: counts.fulfilled },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{item.value.toLocaleString("en-IN")}</p>
        </div>
      ))}
    </div>
  );
}
