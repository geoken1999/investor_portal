import type { Metadata } from "next";
import { InvestorDocumentsTable } from "@/components/investor/investor-documents-table";
import { requireInvestor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };

export default async function InvestorDocumentsPage() {
  await requireInvestor();
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <InvestorDocumentsTable
      heading="Documents"
      description="Agreements, statements, and reports shared with you."
      documents={documents ?? []}
      emptyMessage="No documents have been shared with you yet."
    />
  );
}
