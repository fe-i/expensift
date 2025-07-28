import { type Document } from "mongoose";
import { z } from "zod";

export const zodLineItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(1000),
  unitPrice: z.number().min(0.01).max(10000),
  assignedTo: z.array(z.string()).optional(),
});

export const zodSurchargeSchema = z.object({
  description: z.string().min(1).max(100),
  type: z.enum(["fixed", "percentage"]),
  value: z.number().min(-10000).max(10000),
});

export const zodSplitSchema = z.object({
  name: z.string().max(50),
  paid: z.boolean(),
  isPaying: z.boolean(),
});

export const zodReceiptSchema = z.object({
  merchant: z.string().min(1).max(50),
  date: z.string(),
  category: z.string().max(50),
  lineItems: z
    .array(zodLineItemSchema)
    .min(1, "At least one line item is required.")
    .max(500),
  surcharges: z.array(zodSurchargeSchema).max(5).optional(),
  taxType: z.enum(["fixed", "percentage"]).optional(),
  taxValue: z.number().min(0).max(10000).optional(),
  tipType: z.enum(["fixed", "percentage"]).optional(),
  tipValue: z.number().min(0).max(10000).optional(),
  splitMode: z.enum(["simple", "advanced"]).optional(),
  splits: z.array(zodSplitSchema).max(20).optional(),
  userId: z.string(),
});

export const zodReceiptInputSchema = zodReceiptSchema.omit({
  userId: true,
});

export type LineItem = z.infer<typeof zodLineItemSchema>;
export type Surcharge = z.infer<typeof zodSurchargeSchema>;
export type Receipt = z.infer<typeof zodReceiptSchema>;
export type Split = z.infer<typeof zodSplitSchema>;
export type WithDocument<T> = T & Document;

export type ReceiptInput = z.infer<typeof zodReceiptInputSchema>;
