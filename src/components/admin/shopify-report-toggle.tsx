"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleShopifyReport } from "@/actions/admin/shopify";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ShopifyReportToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("enabled", String(next));
      const result = await toggleShopifyReport({}, formData);
      if (result.error) {
        setEnabled(!next);
        toast.error(result.error);
      } else {
        toast.success(next ? "Report is now visible to investors" : "Report hidden from investors");
      }
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <Switch
        id="report-enabled"
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={isPending}
      />
      <Label htmlFor="report-enabled" className="font-normal">
        Show this report to investors
      </Label>
    </div>
  );
}
