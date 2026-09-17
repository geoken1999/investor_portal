import { z } from "zod";

export const updateInvestorSchema = z.object({
  investorId: z.uuid(),
  fullName: z.string().min(1, "Full name is required").max(200),
  phone: z.string().max(30).optional().or(z.literal("")),
  status: z.enum(["invited", "active", "disabled"]),
});
export type UpdateInvestorInput = z.infer<typeof updateInvestorSchema>;
