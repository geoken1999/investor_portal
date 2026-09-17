"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateInvestor } from "@/actions/admin/investors";
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
import type { Profile } from "@/types/database";

export function InvestorEditDialog({ investor }: { investor: Profile }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useFormDialogAction(updateInvestor, {
    successMessage: "Investor updated",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Edit investor">
            <Pencil />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit investor</DialogTitle>
          <DialogDescription>{investor.email}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          <input type="hidden" name="investorId" value={investor.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={investor.full_name}
              required
            />
            <FormFieldError messages={state.fieldErrors?.fullName} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={investor.phone ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              items={{ active: "Active", invited: "Invited", disabled: "Disabled" }}
              defaultValue={investor.status}
              required
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Disabling does not delete their account — it blocks login server-side.
            </p>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter className="-mx-0 -mb-0 mt-2 border-t-0 bg-transparent p-0">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
