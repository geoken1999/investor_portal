"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { uploadDocument } from "@/actions/admin/documents";
import { useFormDialogAction } from "@/hooks/use-form-dialog-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormFieldError } from "@/components/auth/form-field-error";

const CATEGORY_LABELS: Record<string, string> = {
  agreement: "Investment agreement",
  investment_statement: "Investment statement",
  payout_statement: "Payout statement",
  quarterly_report: "Quarterly report",
  annual_statement: "Annual statement",
  tax_document: "Tax document",
};

export function DocumentUploadDialog({
  investors,
  investmentOptions,
  categories,
}: {
  investors: { id: string; name: string }[];
  investmentOptions: { id: string; label: string; investorId: string }[];
  categories: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<string>("");
  const [state, formAction, isPending] = useFormDialogAction(uploadDocument, {
    successMessage: "Document uploaded",
    onSuccess: () => {
      setOpen(false);
      setSelectedInvestor("");
    },
  });

  const filteredInvestments = investmentOptions.filter(
    (o) => !selectedInvestor || o.investorId === selectedInvestor,
  );

  // See the comment in investment-form-dialog.tsx: Base UI's <Select> needs
  // this `items` map to resolve the closed trigger's display label.
  const investorItems = Object.fromEntries(investors.map((inv) => [inv.id, inv.name]));
  const investmentItems = Object.fromEntries(
    filteredInvestments.map((o) => [o.id, o.label]),
  );
  const categoryItems = Object.fromEntries(
    categories.map((c) => [c, CATEGORY_LABELS[c] ?? c]),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Upload />
            Upload document
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>
            Uploads to secure storage — only this investor and admins can access it.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="investorId">Investor</Label>
            <Select
              name="investorId"
              items={investorItems}
              value={selectedInvestor}
              onValueChange={(value) => setSelectedInvestor(value ?? "")}
              required
            >
              <SelectTrigger id="investorId" className="w-full">
                <SelectValue placeholder="Select an investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError messages={state.fieldErrors?.investorId} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="investmentId">Related investment (optional)</Label>
            <Select
              key={selectedInvestor}
              name="investmentId"
              items={investmentItems}
              disabled={!selectedInvestor}
            >
              <SelectTrigger id="investmentId" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {filteredInvestments.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              name="category"
              items={categoryItems}
              defaultValue={categories[0]}
              required
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Q2 2026 Investment Statement"
              required
            />
            <FormFieldError messages={state.fieldErrors?.title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">File</Label>
            <Input id="file" name="file" type="file" required />
            <FormFieldError messages={state.fieldErrors?.file} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter className="-mx-0 -mb-0 mt-2 border-t-0 bg-transparent p-0">
            <Button type="submit" loading={isPending}>
              {isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
