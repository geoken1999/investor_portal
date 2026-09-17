"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";
import { addInvestorSchema } from "@/lib/validations/auth";
import { updateInvestorSchema } from "@/lib/validations/investors";
import { generateTemporaryPassword } from "@/lib/auth/generate-password";
import type { ActionState } from "@/actions/auth";

/**
 * Creates the investor's account directly with a generated temporary
 * password, rather than emailing an invite link — Supabase's invite email
 * proved unreliable to depend on (default shared email service is
 * rate-limited, and custom SMTP wasn't reliably in place either). The admin
 * hands the password to the investor out-of-band, and the investor changes
 * it from their Profile page (see changePassword in actions/auth.ts). The
 * account is created pre-confirmed and active, so they can log in immediately.
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

  const temporaryPassword = generateTemporaryPassword();
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (error) {
    return { error: error.message };
  }

  const supabase = await createClient();

  // The handle_new_user trigger defaults status to 'invited' — this flow
  // has no separate activation step, so mark it active immediately.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", data.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investor_created",
    entity: "profiles",
    entityId: data.user.id,
    metadata: { email: parsed.data.email, fullName: parsed.data.fullName },
  });

  revalidatePath("/admin/investors");
  return { success: true, generatedPassword: temporaryPassword };
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
