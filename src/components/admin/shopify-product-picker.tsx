"use client";

import { useState } from "react";
import { setTrackedProduct } from "@/actions/admin/shopify";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShopifyProduct } from "@/lib/shopify/products";

export function ShopifyProductPicker({
  products,
  currentProductId,
}: {
  products: ShopifyProduct[];
  currentProductId: string | null;
}) {
  const [selected, setSelected] = useState<ShopifyProduct | undefined>(
    products.find((p) => p.id === currentProductId),
  );
  const [state, formAction, isPending] = useFormDialogAction(setTrackedProduct, {
    successMessage: "Tracked product updated",
  });

  const productItems = Object.fromEntries(products.map((p) => [p.id, p.title]));

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="productId">Tracked product</Label>
        <Select
          items={productItems}
          value={selected?.id}
          onValueChange={(id) => setSelected(products.find((p) => p.id === id))}
        >
          <SelectTrigger id="productId" className="w-full">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!products.length && (
          <p className="text-sm text-muted-foreground">No products found in this store.</p>
        )}
      </div>
      <input type="hidden" name="productId" value={selected?.id ?? ""} />
      <input type="hidden" name="productTitle" value={selected?.title ?? ""} />
      <Button type="submit" disabled={isPending || !selected}>
        {isPending ? "Saving…" : "Save tracked product"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
