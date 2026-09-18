"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createPayout, updatePayout } from "@/actions/admin/payouts";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormFieldError } from "@/components/auth/form-field-error";
import type { Payout } from "@/types/database";

const STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export function PayoutFormDialog({
  investmentOptions,
  payout,
  trigger,
}: {
  investmentOptions: { id: string; label: string }[];
  payout?: Payout;
  trigger?: React.ReactElement;
}) {
  const isEdit = !!payout;
  const action = isEdit ? updatePayout : createPayout;
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useFormDialogAction(action, {
    successMessage: isEdit ? "Payout updated" : "Payout created",
    onSuccess: () => setOpen(false),
  });

  // See the comment in investment-form-dialog.tsx: Base UI's <Select> needs
  // this `items` map to resolve the closed trigger's display label.
  const investmentItems = Object.fromEntries(investmentOptions.map((o) => [o.id, o.label]));
  const statusItems = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ??
          (isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit payout">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus />
              New payout
            </Button>
          ))
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit payout" : "New payout"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this payout's amount, date, or status."
              : "Schedule a payout against an investment."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          {isEdit && <input type="hidden" name="payoutId" value={payout.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="investmentId">Investment</Label>
            <Select
              name="investmentId"
              items={investmentItems}
              defaultValue={payout?.investment_id}
              required
            >
              <SelectTrigger id="investmentId" className="w-full">
                <SelectValue placeholder="Select an investment" />
              </SelectTrigger>
              <SelectContent>
                {investmentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError messages={state.fieldErrors?.investmentId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                defaultValue={payout?.amount}
                required
              />
              <FormFieldError messages={state.fieldErrors?.amount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payoutDate">Payout date</Label>
              <Input
                id="payoutDate"
                name="payoutDate"
                type="date"
                defaultValue={payout?.payout_date}
                required
              />
              <FormFieldError messages={state.fieldErrors?.payoutDate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                items={statusItems}
                defaultValue={payout?.status ?? "scheduled"}
                required
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referenceNumber">Reference (optional)</Label>
              <Input
                id="referenceNumber"
                name="referenceNumber"
                defaultValue={payout?.reference_number ?? ""}
              />
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter className="-mx-0 -mb-0 mt-2 border-t-0 bg-transparent p-0">
            <Button type="submit" loading={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create payout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
