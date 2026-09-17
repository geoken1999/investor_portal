"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";
import { connectShopifySchema, setTrackedProductSchema } from "@/lib/validations/shopify";
import { verifyShopifyCredentials } from "@/lib/shopify/products";
import { ShopifyApiError } from "@/lib/shopify/client";
import { SHOPIFY_SETTINGS_ID as SETTINGS_ID } from "@/lib/shopify/settings";
import type { ActionState } from "@/actions/auth";

/**
 * Validates the credentials against Shopify itself before saving — a typo'd
 * domain or a revoked Client Secret fails here with a clear message instead
 * of silently saving something that will fail on every later report render.
 * Uses the service-role client because `shopify_settings` intentionally has
 * no RLS policies (see migration 0004) — this table only ever exists inside
 * server-only code.
 */
export async function connectShopifyStore(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = connectShopifySchema.safeParse({
    shopDomain: formData.get("shopDomain"),
    clientId: formData.get("clientId"),
    clientSecret: formData.get("clientSecret"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let verified;
  try {
    verified = await verifyShopifyCredentials(
      parsed.data.shopDomain,
      parsed.data.clientId,
      parsed.data.clientSecret,
    );
  } catch (err) {
    const message =
      err instanceof ShopifyApiError
        ? err.message
        : "Could not connect to Shopify with those credentials.";
    return { error: message };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("shopify_settings").upsert({
    id: SETTINGS_ID,
    shop_domain: parsed.data.shopDomain,
    client_id: parsed.data.clientId,
    client_secret: parsed.data.clientSecret,
    // Seed the cache with the token we just obtained while verifying, so
    // the very next page render doesn't immediately request a second one.
    cached_access_token: verified.accessToken,
    cached_token_expires_at: new Date(
      Date.now() + verified.expiresInSeconds * 1000,
    ).toISOString(),
    connected_by: admin.id,
    // A fresh connect starts unselected/hidden — admin picks a product and
    // explicitly enables the report as separate, deliberate steps.
    tracked_product_id: null,
    tracked_product_title: null,
    report_enabled: false,
  });
  if (error) {
    return { error: error.message };
  }

  const supabase = await createClient();
  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "shopify_connected",
    entity: "shopify_settings",
    metadata: { shopDomain: parsed.data.shopDomain },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// Takes no fields, but keeps the (state, formData) shape useFormDialogAction expects.
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function disconnectShopifyStore(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const admin = await requireAdmin();

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("shopify_settings")
    .delete()
    .eq("id", SETTINGS_ID);
  if (error) {
    return { error: error.message };
  }

  const supabase = await createClient();
  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "shopify_disconnected",
    entity: "shopify_settings",
  });

  revalidatePath("/admin/settings");
  revalidatePath("/reports");
  return { success: true };
}

export async function setTrackedProduct(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = setTrackedProductSchema.safeParse({
    productId: formData.get("productId"),
    productTitle: formData.get("productTitle"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("shopify_settings")
    .update({
      tracked_product_id: parsed.data.productId,
      tracked_product_title: parsed.data.productTitle,
    })
    .eq("id", SETTINGS_ID);
  if (error) {
    return { error: error.message };
  }

  const supabase = await createClient();
  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "shopify_product_selected",
    entity: "shopify_settings",
    metadata: { productTitle: parsed.data.productTitle },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/reports");
  return { success: true };
}

export async function toggleShopifyReport(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const enabled = formData.get("enabled") === "true";

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("shopify_settings")
    .update({ report_enabled: enabled })
    .eq("id", SETTINGS_ID);
  if (error) {
    return { error: error.message };
  }

  const supabase = await createClient();
  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "shopify_report_toggled",
    entity: "shopify_settings",
    metadata: { enabled },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/reports");
  return { success: true };
}
