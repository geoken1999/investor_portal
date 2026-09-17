import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client — bypasses RLS entirely. Server-only, and only for
 * privileged operations the anon-key server client cannot perform (e.g.
 * `auth.admin.inviteUserByEmail`). Never import this from a Client Component
 * or anywhere reachable from the browser bundle. The `server-only` import
 * above makes any such accidental import fail the build.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
