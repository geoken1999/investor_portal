import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Plain GET form — no client JS needed. Submitting reloads the page with
 * ?from=&to=, and the Server Component re-fetches Shopify with that range.
 */
export function ShopifyDateFilter({ from, to }: { from: string; to: string }) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shopify-from">From</Label>
        <Input id="shopify-from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shopify-to">To</Label>
        <Input id="shopify-to" name="to" type="date" defaultValue={to} />
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
