import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Investment, Profile } from "@/types/database";
import { formatCurrency } from "@/lib/finance/calculations";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * `investments.investor_id` / `documents.investor_id` / `audit_logs.user_id`
 * reference `auth.users`, not `public.profiles` — PostgREST can only
 * auto-embed relationships between tables it can see (the `public` schema),
 * so there's no FK-based embedded select available here. These small
 * in-memory lookup maps are the deliberate, simple alternative for the data
 * volumes an MVP admin portal deals with.
 */
export async function getInvestorProfiles(supabase: Supabase): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "investor")
    .order("full_name", { ascending: true });
  return data ?? [];
}

export async function getAllProfiles(supabase: Supabase): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*");
  return data ?? [];
}

export function toProfileMap(profiles: Profile[]): Map<string, Profile> {
  return new Map(profiles.map((p) => [p.id, p]));
}

export async function getAllInvestments(supabase: Supabase): Promise<Investment[]> {
  const { data } = await supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export function toInvestmentMap(investments: Investment[]): Map<string, Investment> {
  return new Map(investments.map((i) => [i.id, i]));
}

export function investmentLabel(
  investment: Pick<Investment, "investment_type" | "principal_amount">,
  investorName: string,
): string {
  return `${investment.investment_type} — ${investorName} — ${formatCurrency(investment.principal_amount)}`;
}
