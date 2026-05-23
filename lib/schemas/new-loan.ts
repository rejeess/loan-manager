import { z } from "zod";

const MOBILE_RE = /^\+91[6-9]\d{9}$/;

export const newLoanSchema = z.object({
  companyId: z.string().min(1),
  customerName: z.string().min(1, "Customer name is required"),
  coApplicantName: z.string().optional(),
  phone: z.string().regex(MOBILE_RE, "Enter a valid Indian mobile number (+91XXXXXXXXXX)"),
  coApplicantPhone: z.string().regex(MOBILE_RE, "Enter a valid Indian mobile number").or(z.literal("")).optional(),
  area: z.string().optional(),
  pinCode: z.string().regex(/^\d{6}$/, "Pin code must be 6 digits").or(z.literal("")).optional(),
  referredBy: z.string().optional(),
  amountRupees: z.coerce.number().int("Amount must be a whole number").positive("Amount must be positive"),
  product: z.enum(["dp", "wb", "db", "el"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export type NewLoanInput = z.infer<typeof newLoanSchema>;
