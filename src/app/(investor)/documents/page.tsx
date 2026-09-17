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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Documents
        </h1>
        <p className="text-sm text-muted-foreground">
          Agreements, statements, and reports shared with you.
        </p>
      </div>
      <InvestorDocumentsTable
        heading="Documents"
        documents={documents ?? []}
        emptyMessage="No documents have been shared with you yet."
      />
    </div>
  );
}
