"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createInvestment, updateInvestment } from "@/actions/admin/investments";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Investment } from "@/types/database";

const PAYMENT_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annual", label: "Semi-annual" },
  { value: "annual", label: "Annual" },
  { value: "at_maturity", label: "At maturity" },
];

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "matured", label: "Matured" },
  { value: "exited", label: "Exited" },
  { value: "cancelled", label: "Cancelled" },
];

export function InvestmentFormDialog({
  investors,
  investment,
}: {
  investors: { id: string; name: string }[];
  investment?: Investment;
}) {
  const isEdit = !!investment;
  const action = isEdit ? updateInvestment : createInvestment;
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useFormDialogAction(action, {
    successMessage: isEdit ? "Investment updated" : "Investment created",
    onSuccess: () => setOpen(false),
  });

  // Base UI's <Select> only resolves the closed trigger's display label from
  // this `items` map — without it, it falls back to showing the raw value
  // (a UUID, or the lowercase enum) instead of the item's label.
  const investorItems = Object.fromEntries(investors.map((inv) => [inv.id, inv.name]));
  const frequencyItems = Object.fromEntries(PAYMENT_FREQUENCIES.map((f) => [f.value, f.label]));
  const statusItems = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit investment">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus />
              New investment
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit investment" : "New investment"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this investment's terms and status."
              : "Assign a new investment to an investor."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          {isEdit && (
            <input type="hidden" name="investmentId" value={investment.id} />
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="investorId">Investor</Label>
            <Select
              name="investorId"
              items={investorItems}
              defaultValue={investment?.investor_id}
              required
            >
              <SelectTrigger id="investorId" className="w-full">
                <SelectValue placeholder="Select an investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError messages={state.fieldErrors?.investorId} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="investmentType">Investment type</Label>
            <Input
              id="investmentType"
              name="investmentType"
              placeholder="e.g. Fixed Deposit"
              defaultValue={investment?.investment_type}
              required
            />
            <FormFieldError messages={state.fieldErrors?.investmentType} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="principalAmount">Principal (₹)</Label>
              <Input
                id="principalAmount"
                name="principalAmount"
                inputMode="decimal"
                defaultValue={investment?.principal_amount}
                required
              />
              <FormFieldError messages={state.fieldErrors?.principalAmount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="returnRate">Annual return rate (%)</Label>
              <Input
                id="returnRate"
                name="returnRate"
                inputMode="decimal"
                defaultValue={investment?.return_rate}
                required
              />
              <FormFieldError messages={state.fieldErrors?.returnRate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={investment?.start_date}
                required
              />
              <FormFieldError messages={state.fieldErrors?.startDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maturityDate">Maturity date</Label>
              <Input
                id="maturityDate"
                name="maturityDate"
                type="date"
                defaultValue={investment?.maturity_date ?? ""}
              />
              <FormFieldError messages={state.fieldErrors?.maturityDate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentFrequency">Payment frequency</Label>
              <Select
                name="paymentFrequency"
                items={frequencyItems}
                defaultValue={investment?.payment_frequency ?? "annual"}
                required
              >
                <SelectTrigger id="paymentFrequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                items={statusItems}
                defaultValue={investment?.status ?? "pending"}
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={investment?.notes ?? ""} />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter className="-mx-0 -mb-0 mt-2 border-t-0 bg-transparent p-0">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
