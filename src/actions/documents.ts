"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/audit/log";

const DOCUMENTS_BUCKET = "documents";
const SIGNED_URL_TTL_SECONDS = 60;

export interface DownloadUrlResult {
  url?: string;
  error?: string;
}

/**
 * Re-selects the document row under RLS before signing — an investor
 * requesting another investor's document ID gets a clean "not found" here
 * (RLS returns zero rows) rather than a leaked signed URL.
 */
export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<DownloadUrlResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_path, investor_id")
    .eq("id", documentId)
    .single();

  if (!doc) return { error: "Document not found" };

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return { error: error?.message ?? "Failed to create download link" };
  }

  await logAuditEvent(supabase, {
    userId: profile.id,
    action: "document_downloaded",
    entity: "documents",
    entityId: documentId,
  });

  return { url: data.signedUrl };
}
