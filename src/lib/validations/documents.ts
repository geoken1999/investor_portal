import { z } from "zod";

export const DOCUMENT_CATEGORIES = [
  "agreement",
  "investment_statement",
  "payout_statement",
  "quarterly_report",
  "annual_statement",
  "tax_document",
] as const;

export const REPORT_CATEGORIES = [
  "investment_statement",
  "payout_statement",
  "quarterly_report",
  "annual_statement",
  "tax_document",
] as const;

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

export const uploadDocumentSchema = z.object({
  investorId: z.uuid(),
  investmentId: z.uuid().optional().or(z.literal("")),
  category: z.enum(DOCUMENT_CATEGORIES),
  title: z.string().min(1, "Title is required").max(200),
  file: z
    .instanceof(File)
    .refine((f) => f.size > 0, "A file is required")
    .refine((f) => f.size <= MAX_FILE_BYTES, "File must be 20MB or smaller"),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
