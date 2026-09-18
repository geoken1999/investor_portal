"use client";

import { connectShopifyStore } from "@/actions/admin/shopify";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/auth/form-field-error";

export function ShopifyConnectForm() {
  const [state, formAction, isPending] = useFormDialogAction(connectShopifyStore, {
    successMessage: "Store connected",
  });

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shopDomain">Shop domain</Label>
        <Input
          id="shopDomain"
          name="shopDomain"
          placeholder="my-store.myshopify.com"
          required
          aria-invalid={!!state.fieldErrors?.shopDomain}
        />
        <FormFieldError messages={state.fieldErrors?.shopDomain} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientId">Client ID</Label>
        <Input
          id="clientId"
          name="clientId"
          autoComplete="off"
          required
          aria-invalid={!!state.fieldErrors?.clientId}
        />
        <FormFieldError messages={state.fieldErrors?.clientId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientSecret">Client secret</Label>
        <Input
          id="clientSecret"
          name="clientSecret"
          type="password"
          autoComplete="off"
          required
          aria-invalid={!!state.fieldErrors?.clientSecret}
        />
        <FormFieldError messages={state.fieldErrors?.clientSecret} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" loading={isPending} className="w-fit">
        {isPending ? "Connecting…" : "Connect store"}
      </Button>
    </form>
  );
}
