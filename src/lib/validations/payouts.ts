import { z } from "zod";
import { decimalString } from "@/lib/validations/money";

const PAYOUT_STATUSES = [
  "scheduled",
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
] as const;

const baseFields = {
  investmentId: z.uuid(),
  amount: decimalString("Amount"),
  payoutDate: z.iso.date(),
  status: z.enum(PAYOUT_STATUSES),
  referenceNumber: z.string().max(100).optional().or(z.literal("")),
};

export const createPayoutSchema = z.object(baseFields);
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

export const updatePayoutSchema = z.object({
  payoutId: z.uuid(),
  ...baseFields,
});
export type UpdatePayoutInput = z.infer<typeof updatePayoutSchema>;
