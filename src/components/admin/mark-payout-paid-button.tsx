"use client";

import { CheckCircle2 } from "lucide-react";
import { updatePayout } from "@/actions/admin/payouts";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import type { Payout } from "@/types/database";

export function MarkPayoutPaidButton({ payout }: { payout: Payout }) {
  const [, formAction, isPending] = useFormDialogAction(updatePayout, {
    successMessage: "Payout marked as paid",
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="payoutId" value={payout.id} />
      <input type="hidden" name="investmentId" value={payout.investment_id} />
      <input type="hidden" name="amount" value={payout.amount} />
      <input type="hidden" name="payoutDate" value={payout.payout_date} />
      <input type="hidden" name="referenceNumber" value={payout.reference_number ?? ""} />
      <input type="hidden" name="status" value="paid" />
      <Button type="submit" variant="outline" size="sm" loading={isPending}>
        {!isPending && <CheckCircle2 />}
        {isPending ? "Marking…" : "Mark paid"}
      </Button>
    </form>
  );
}
