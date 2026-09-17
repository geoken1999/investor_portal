"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/auth/form-field-error";

const initialState: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p>
          If an account exists for that email, we&apos;ve sent a link to reset
          your password. Check your inbox.
        </p>
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!state.fieldErrors?.email}
        />
        <FormFieldError messages={state.fieldErrors?.email} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Sending…" : "Send reset link"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
