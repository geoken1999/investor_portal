import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Fetches the current session's profile row directly from Postgres (RLS:
 * `profiles_select_own_or_admin`). Returns null when there is no session —
 * callers decide whether that's an error.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

/**
 * Signs out a session whose profile has since been disabled (e.g. an admin
 * disabled the investor mid-session) and sends them to /login with a
 * message, rather than letting `redirect("/login")` alone leave a live
 * session sitting in their cookies.
 */
async function signOutDisabledAccount(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?error=This account has been disabled. Contact your administrator.");
}

/**
 * Server-side gate for every (investor) route. Redirects to /login when
 * unauthenticated, or to the admin home when the caller is an admin —
 * so a wrong-surface visit never silently renders investor data.
 */
export async function requireInvestor(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "investor") redirect("/admin/dashboard");
  if (profile.status === "disabled") await signOutDisabledAccount();
  if (profile.status !== "active") redirect("/activate");
  return profile;
}

/**
 * Server-side gate for every (admin) route.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");
  if (profile.status === "disabled") await signOutDisabledAccount();
  return profile;
}
