"use client";

import { useRef } from "react";
import { addInvestor } from "@/actions/admin/investors";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/auth/form-field-error";

export function AddInvestorForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useFormDialogAction(addInvestor, {
    successMessage: "Invitation sent",
    onSuccess: () => formRef.current?.reset(),
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3"
      noValidate
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          aria-invalid={!!state.fieldErrors?.fullName}
        />
        <FormFieldError messages={state.fieldErrors?.fullName} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          aria-invalid={!!state.fieldErrors?.email}
        />
        <FormFieldError messages={state.fieldErrors?.email} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Add investor"}
      </Button>
    </form>
  );
}
