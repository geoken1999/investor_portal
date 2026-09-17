import type { Metadata } from "next";
import { InvestorDocumentsTable } from "@/components/investor/investor-documents-table";
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { REPORT_CATEGORIES } from "@/lib/validations/documents";

export const metadata: Metadata = { title: "Reports" };

export default async function InvestorReportsPage() {
  await requireInvestor();
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .in("category", REPORT_CATEGORIES)
    .order("created_at", { ascending: false });

  return (
    <InvestorDocumentsTable
      heading="Reports"
      description="Investment statements, payout statements, and periodic reports."
      documents={documents ?? []}
      emptyMessage="No reports are available yet."
    />
  );
}
