"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";
import {
  createInvestmentSchema,
  updateInvestmentSchema,
} from "@/lib/validations/investments";
import type { ActionState } from "@/actions/auth";

function readInvestmentFormData(formData: FormData) {
  return {
    investorId: formData.get("investorId"),
    investmentType: formData.get("investmentType"),
    principalAmount: formData.get("principalAmount"),
    startDate: formData.get("startDate"),
    maturityDate: formData.get("maturityDate"),
    returnRate: formData.get("returnRate"),
    paymentFrequency: formData.get("paymentFrequency"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };
}

export async function createInvestment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = createInvestmentSchema.safeParse(readInvestmentFormData(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .insert({
      investor_id: parsed.data.investorId,
      investment_type: parsed.data.investmentType,
      principal_amount: parsed.data.principalAmount,
      start_date: parsed.data.startDate,
      maturity_date: parsed.data.maturityDate || null,
      return_rate: parsed.data.returnRate,
      payment_frequency: parsed.data.paymentFrequency,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create investment" };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investment_created",
    entity: "investments",
    entityId: data.id,
    metadata: { investorId: parsed.data.investorId },
  });

  revalidatePath("/admin/investments");
  return { success: true };
}

export async function updateInvestment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = updateInvestmentSchema.safeParse({
    investmentId: formData.get("investmentId"),
    ...readInvestmentFormData(formData),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("investments")
    .update({
      investor_id: parsed.data.investorId,
      investment_type: parsed.data.investmentType,
      principal_amount: parsed.data.principalAmount,
      start_date: parsed.data.startDate,
      maturity_date: parsed.data.maturityDate || null,
      return_rate: parsed.data.returnRate,
      payment_frequency: parsed.data.paymentFrequency,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.investmentId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investment_updated",
    entity: "investments",
    entityId: parsed.data.investmentId,
  });

  revalidatePath("/admin/investments");
  return { success: true };
}

export async function deleteInvestment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const investmentId = formData.get("investmentId");
  if (typeof investmentId !== "string" || !investmentId) {
    return { error: "Missing investment id" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("investments")
    .delete()
    .eq("id", investmentId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "investment_deleted",
    entity: "investments",
    entityId: investmentId,
  });

  revalidatePath("/admin/investments");
  return { success: true };
}
