"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { addInvestor } from "@/actions/admin/investors";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormFieldError } from "@/components/auth/form-field-error";

export function AddInvestorForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(
    null,
  );

  const [state, formAction, isPending] = useFormDialogAction(addInvestor, {
    successMessage: "Investor added",
    onSuccess: (result) => {
      const emailInput = formRef.current?.elements.namedItem("email");
      const email = emailInput instanceof HTMLInputElement ? emailInput.value : "";
      formRef.current?.reset();
      if (result.generatedPassword) {
        setCredentials({ email, password: result.generatedPassword });
      }
    },
  });

  async function copyCredentials() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(
        `Email: ${credentials.email}\nTemporary password: ${credentials.password}`,
      );
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  }

  return (
    <>
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
          {isPending ? "Adding…" : "Add investor"}
        </Button>
      </form>

      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Investor added</DialogTitle>
            <DialogDescription>
              Share these credentials with {credentials?.email} securely (not over
              email). This password is shown only once — they can change it from
              their Profile page after logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">Email: </span>
              {credentials?.email}
            </div>
            <div>
              <span className="text-muted-foreground">Password: </span>
              {credentials?.password}
            </div>
          </div>
          <DialogFooter className="-mx-0 -mb-0 mt-2 border-t-0 bg-transparent p-0">
            <Button type="button" onClick={copyCredentials}>
              <Copy />
              Copy credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
