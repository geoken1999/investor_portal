"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";
import { createPayoutSchema, updatePayoutSchema } from "@/lib/validations/payouts";
import type { ActionState } from "@/actions/auth";

function readPayoutFormData(formData: FormData) {
  return {
    investmentId: formData.get("investmentId"),
    amount: formData.get("amount"),
    payoutDate: formData.get("payoutDate"),
    status: formData.get("status"),
    referenceNumber: formData.get("referenceNumber"),
  };
}

async function investorIdForInvestment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  investmentId: string,
) {
  const { data } = await supabase
    .from("investments")
    .select("investor_id")
    .eq("id", investmentId)
    .single();
  return data?.investor_id ?? null;
}

export async function createPayout(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = createPayoutSchema.safeParse(readPayoutFormData(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const investorId = await investorIdForInvestment(supabase, parsed.data.investmentId);
  if (!investorId) {
    return { error: "Investment not found" };
  }

  const { data, error } = await supabase
    .from("payouts")
    .insert({
      investment_id: parsed.data.investmentId,
      investor_id: investorId,
      amount: parsed.data.amount,
      payout_date: parsed.data.payoutDate,
      status: parsed.data.status,
      reference_number: parsed.data.referenceNumber || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create payout" };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "payout_created",
    entity: "payouts",
    entityId: data.id,
    metadata: { investmentId: parsed.data.investmentId },
  });

  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function updatePayout(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = updatePayoutSchema.safeParse({
    payoutId: formData.get("payoutId"),
    ...readPayoutFormData(formData),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const investorId = await investorIdForInvestment(supabase, parsed.data.investmentId);
  if (!investorId) {
    return { error: "Investment not found" };
  }

  const { error } = await supabase
    .from("payouts")
    .update({
      investment_id: parsed.data.investmentId,
      investor_id: investorId,
      amount: parsed.data.amount,
      payout_date: parsed.data.payoutDate,
      status: parsed.data.status,
      reference_number: parsed.data.referenceNumber || null,
    })
    .eq("id", parsed.data.payoutId);

  if (error) {
    return { error: error.message };
  }

  const action = parsed.data.status === "paid" ? "payout_marked_paid" : "payout_updated";
  await logAuditEvent(supabase, {
    userId: admin.id,
    action,
    entity: "payouts",
    entityId: parsed.data.payoutId,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/admin/payouts");
  return { success: true };
}
