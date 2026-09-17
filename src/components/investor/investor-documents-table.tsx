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
import { DownloadDocumentButton } from "@/components/shared/download-document-button";
import type { Document } from "@/types/database";

const CATEGORY_LABELS: Record<string, string> = {
  agreement: "Investment agreement",
  investment_statement: "Investment statement",
  payout_statement: "Payout statement",
  quarterly_report: "Quarterly report",
  annual_statement: "Annual statement",
  tax_document: "Tax document",
};

export function InvestorDocumentsTable({
  heading,
  description,
  documents,
  emptyMessage,
}: {
  heading: string;
  description: string;
  documents: Document[];
  emptyMessage: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          <CardDescription>{documents.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {!documents.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[doc.category] ?? doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DownloadDocumentButton documentId={doc.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
