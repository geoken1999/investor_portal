"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";
import { addInvestorSchema } from "@/lib/validations/auth";
import { updateInvestorSchema } from "@/lib/validations/investors";
import type { ActionState } from "@/actions/auth";

/**
 * Invites the investor by email rather than setting a password directly —
 * no password is ever generated, displayed, or transmitted by this app.
 * Supabase sends its own invite email (built-in template, no extra service
 * needed) with a link to /auth/callback?next=/activate, where the investor
 * sets their own password. The handle_new_user trigger defaults their
 * profile status to 'invited'; activateAccount (actions/auth.ts) flips it
 * to 'active' once they complete that flow.
 */
export async function addInvestor(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Re-verify the caller is an admin server-side, independent of the layout
  // guard — this action could in principle be invoked directly.
  const admin = await requireAdmin();

  const parsed = addInvestorSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/activate`,
    },
  );

  if (error) {
    return { error: error.message };
  }

  const supabase = await createClient();
  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investor_invited",
    entity: "profiles",
    entityId: data.user?.id,
    metadata: { email: parsed.data.email, fullName: parsed.data.fullName },
  });

  revalidatePath("/admin/investors");
  return { success: true };
}

export async function updateInvestor(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = updateInvestorSchema.safeParse({
    investorId: formData.get("investorId"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.investorId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investor_updated",
    entity: "profiles",
    entityId: parsed.data.investorId,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/admin/investors");
  return { success: true };
}

const DOCUMENTS_BUCKET = "documents";

/**
 * Permanently deletes an investor's account. Postgres cascade (`on delete
 * cascade`, migrations 0001/0002) cleans up their profiles/investments/
 * payouts/documents rows automatically once the auth user is gone — but
 * cascade only deletes DB rows, not the actual files in Supabase Storage,
 * so those are removed explicitly first (same gap already handled in
 * deleteDocument).
 */
export async function deleteInvestor(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const investorId = formData.get("investorId");
  if (typeof investorId !== "string" || !investorId) {
    return { error: "Missing investor id" };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", investorId)
    .single();

  // Defense in depth: this action must never be usable to delete an admin,
  // even if called directly rather than through the investors-only UI.
  if (!target || target.role !== "investor") {
    return { error: "Investor not found" };
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("investor_id", investorId);

  const adminClient = createAdminClient();

  if (documents?.length) {
    await adminClient.storage
      .from(DOCUMENTS_BUCKET)
      .remove(documents.map((d) => d.storage_path));
  }

  const { error } = await adminClient.auth.admin.deleteUser(investorId);
  if (error) {
    return { error: error.message };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investor_deleted",
    entity: "profiles",
    entityId: investorId,
    metadata: { email: target.email, fullName: target.full_name },
  });

  revalidatePath("/admin/investors");
  return { success: true };
}
