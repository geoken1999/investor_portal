import { z } from "zod";
import { decimalString } from "@/lib/validations/money";

const PAYMENT_FREQUENCIES = [
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "at_maturity",
] as const;

const INVESTMENT_STATUSES = [
  "pending",
  "active",
  "matured",
  "cancelled",
  "exited",
] as const;

const baseInvestmentFields = {
  investorId: z.uuid(),
  investmentType: z.string().min(1, "Investment type is required").max(120),
  principalAmount: decimalString("Principal amount"),
  startDate: z.iso.date(),
  maturityDate: z.iso.date().optional().or(z.literal("")),
  returnRate: decimalString("Return rate"),
  paymentFrequency: z.enum(PAYMENT_FREQUENCIES),
  status: z.enum(INVESTMENT_STATUSES),
  notes: z.string().max(2000).optional().or(z.literal("")),
};

export const createInvestmentSchema = z.object(baseInvestmentFields);
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;

export const updateInvestmentSchema = z.object({
  investmentId: z.uuid(),
  ...baseInvestmentFields,
});
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
