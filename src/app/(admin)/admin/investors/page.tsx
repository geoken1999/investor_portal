import type { Metadata } from "next";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { AddInvestorForm } from "@/components/admin/add-investor-form";
import { InvestorEditDialog } from "@/components/admin/investor-edit-dialog";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { deleteInvestor } from "@/actions/admin/investors";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Investors" };

export default async function AdminInvestorsPage() {
  const supabase = await createClient();
  const { data: investors } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "investor")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Investors
        </h1>
        <p className="text-sm text-muted-foreground">
          Add investors, and edit their contact details or account status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add an investor</CardTitle>
          <CardDescription>
            They&apos;ll receive an email with a link to set their own password —
            no password ever passes through you or this app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddInvestorForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All investors</CardTitle>
        </CardHeader>
        <CardContent>
          {!investors?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No investors yet. Add your first one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {investors.map((investor) => (
                  <TableRow key={investor.id}>
                    <TableCell className="font-medium">
                      {investor.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {investor.email}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={investor.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(investor.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <InvestorEditDialog investor={investor} />
                      <DeleteConfirmDialog
                        action={deleteInvestor}
                        hiddenFields={{ investorId: investor.id }}
                        title={`Delete ${investor.full_name || investor.email}?`}
                        description="Permanently deletes their account, investments, payouts, and documents. This cannot be undone."
                      />
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
