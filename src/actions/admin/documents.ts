"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";
import { uploadDocumentSchema } from "@/lib/validations/documents";
import type { ActionState } from "@/actions/auth";

const DOCUMENTS_BUCKET = "documents";

export async function uploadDocument(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = uploadDocumentSchema.safeParse({
    investorId: formData.get("investorId"),
    investmentId: formData.get("investmentId"),
    category: formData.get("category"),
    title: formData.get("title"),
    file: formData.get("file"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { investorId, investmentId, category, title, file } = parsed.data;
  const documentId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storagePath = `${investorId}/${documentId}-${safeName}`;

  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    investor_id: investorId,
    investment_id: investmentId || null,
    category,
    title,
    storage_path: storagePath,
    file_size: file.size,
    uploaded_by: admin.id,
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { error: insertError.message };
  }

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "document_uploaded",
    entity: "documents",
    entityId: documentId,
    metadata: { investorId, category, title },
  });

  revalidatePath("/admin/documents");
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function deleteDocument(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const documentId = formData.get("documentId");
  if (typeof documentId !== "string" || !documentId) {
    return { error: "Missing document id" };
  }

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (!doc) {
    return { error: "Document not found" };
  }

  const { error: deleteRowError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);
  if (deleteRowError) {
    return { error: deleteRowError.message };
  }

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);

  await logAuditEvent(supabase, {
    userId: admin.id,
    action: "document_deleted",
    entity: "documents",
    entityId: documentId,
  });

  revalidatePath("/admin/documents");
  revalidatePath("/admin/reports");
  return { success: true };
}
