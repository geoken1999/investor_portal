"use client";

import { useActionState } from "react";
import { activateAccount, type ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/auth/form-field-error";

const initialState: ActionState = {};

export function ActivateForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(
    activateAccount,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          aria-invalid={!!state.fieldErrors?.fullName}
        />
        <FormFieldError messages={state.fieldErrors?.fullName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        <FormFieldError messages={state.fieldErrors?.phone} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Create a password</Label>
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
        <Label htmlFor="confirmPassword">Confirm password</Label>
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
        {isPending ? "Activating…" : "Activate account"}
      </Button>
    </form>
  );
}
