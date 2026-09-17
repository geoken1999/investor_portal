import type { Metadata } from "next";
import { AdminDocumentsSection } from "@/components/admin/admin-documents-section";
import { createClient } from "@/lib/supabase/server";
import {
  getAllInvestments,
  getInvestorProfiles,
  investmentLabel,
  toProfileMap,
} from "@/lib/admin/lookups";
import { REPORT_CATEGORIES } from "@/lib/validations/documents";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const [{ data: documents }, investments, investors] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .in("category", REPORT_CATEGORIES)
      .order("created_at", { ascending: false }),
    getAllInvestments(supabase),
    getInvestorProfiles(supabase),
  ]);
  const investorMap = toProfileMap(investors);

  return (
    <AdminDocumentsSection
      heading="Reports"
      description="Investment statements, payout statements, and periodic/annual reports."
      documents={documents ?? []}
      investorMap={investorMap}
      investors={investors.map((i) => ({ id: i.id, name: i.full_name || i.email }))}
      investmentOptions={investments.map((inv) => ({
        id: inv.id,
        investorId: inv.investor_id,
        label: investmentLabel(
          inv,
          investorMap.get(inv.investor_id)?.full_name ||
            investorMap.get(inv.investor_id)?.email ||
            "Unknown",
        ),
      }))}
      uploadCategories={REPORT_CATEGORIES}
      emptyMessage="No reports yet. Generate one by uploading above."
    />
  );
}
