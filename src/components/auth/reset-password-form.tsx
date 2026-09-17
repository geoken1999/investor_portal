"use client";

import { useActionState } from "react";
import { resetPassword, type ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/auth/form-field-error";

const initialState: ActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!state.fieldErrors?.password}
        />
        <FormFieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!state.fieldErrors?.confirmPassword}
        />
        <FormFieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
