import { z } from "zod";

export const zodReceiptSchema = z.object({
  merchant: z.string().min(1).max(50),
  date: z.string(),
  category: z.string().max(50),
  lineItems: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        quantity: z.number().int().min(1).max(1000),
        unitPrice: z.number().min(0).max(10000),
        assignedTo: z.array(z.string()).optional(),
      }),
    )
    .min(1, "At least one line item is required.")
    .max(500),
  surcharges: z
    .array(
      z.object({
        description: z.string().min(1).max(100),
        type: z.enum(["fixed", "percentage"]),
        amount: z.number().min(-10000).max(10000),
      }),
    )
    .max(5)
    .optional(),
  taxType: z.enum(["fixed", "percentage"]).optional(),
  taxValue: z.number().min(0).max(10000).optional(),
  tipType: z.enum(["fixed", "percentage"]).optional(),
  tipValue: z.number().min(0).max(10000).optional(),
  splitMode: z.enum(["simple", "advanced"]).optional(),
  splitUsers: z
    .array(
      z.object({
        name: z.string().max(50),
        isPaying: z.boolean().optional(),
        paid: z.boolean().optional(),
        assignedItems: z.array(z.string()).optional(),
        subtotal: z.number().min(0).max(10000).optional(),
        surcharge: z.number().min(-10000).max(10000).optional(),
        tax: z.number().min(0).max(10000).optional(),
        tip: z.number().min(0).max(10000).optional(),
      }),
    )
    .max(20)
    .optional(),
  userId: z.string(),
});
