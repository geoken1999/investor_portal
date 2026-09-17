import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AuditAction =
  | "login"
  | "logout"
  | "investor_invited"
  | "investor_activated"
  | "investor_updated"
  | "investor_deleted"
  | "password_reset_requested"
  | "password_reset"
  | "password_changed"
  | "investment_created"
  | "investment_updated"
  | "investment_deleted"
  | "payout_created"
  | "payout_updated"
  | "payout_marked_paid"
  | "document_uploaded"
  | "document_downloaded"
  | "document_deleted";

interface LogAuditEventInput {
  userId: string | null;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Single writer for `audit_logs`, used by every server action across every
 * module. Failures are swallowed (logged to console) rather than thrown —
 * an audit-log write must never block the underlying user action.
 */
export async function logAuditEvent(
  supabase: SupabaseClient<Database>,
  { userId, action, entity, entityId, metadata }: LogAuditEventInput,
) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity: entity ?? null,
    entity_id: entityId ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error(`[audit] failed to log "${action}":`, error.message);
  }
}
