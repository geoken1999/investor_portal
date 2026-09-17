import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadDialog } from "@/components/admin/document-upload-dialog";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { DownloadDocumentButton } from "@/components/shared/download-document-button";
import { deleteDocument } from "@/actions/admin/documents";
import type { Document, Profile } from "@/types/database";

const CATEGORY_LABELS: Record<string, string> = {
  agreement: "Investment agreement",
  investment_statement: "Investment statement",
  payout_statement: "Payout statement",
  quarterly_report: "Quarterly report",
  annual_statement: "Annual statement",
  tax_document: "Tax document",
};

export function AdminDocumentsSection({
  heading,
  description,
  documents,
  investorMap,
  investors,
  investmentOptions,
  uploadCategories,
  emptyMessage,
}: {
  heading: string;
  description: string;
  documents: Document[];
  investorMap: Map<string, Profile>;
  investors: { id: string; name: string }[];
  investmentOptions: { id: string; label: string; investorId: string }[];
  uploadCategories: readonly string[];
  emptyMessage: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {heading}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <DocumentUploadDialog
          investors={investors}
          investmentOptions={investmentOptions}
          categories={uploadCategories}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All {heading.toLowerCase()}</CardTitle>
          <CardDescription>{documents.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!documents.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-48" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const investor = investorMap.get(doc.investor_id);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        {investor?.full_name || investor?.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <DownloadDocumentButton documentId={doc.id} />
                        <DeleteConfirmDialog
                          action={deleteDocument}
                          hiddenFields={{ documentId: doc.id }}
                          title="Delete this document?"
                          description="This permanently removes the file. This cannot be undone."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
