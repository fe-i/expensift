import { z } from "zod";
import { Receipt } from "@/models/Receipt";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { connectDb } from "@/lib/mongodb";

const ReceiptInput = z.object({
  vendor: z.string(),
  date: z.date(),
  category: z.string(),
  lineItems: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
      assignedTo: z.array(z.string()).optional(),
    }),
  ),
  extras: z
    .array(
      z.object({
        description: z.string(),
        type: z.enum(["fixed", "percentage"]),
        amount: z.number(),
      }),
    )
    .optional(),
  taxType: z.enum(["fixed", "percentage"]).optional(),
  taxAmount: z.number().optional(),
  tipType: z.enum(["fixed", "percentage"]).optional(),
  tipAmount: z.number().optional(),
  splitMode: z.enum(["simple", "advanced"]).optional(),
  splitUsers: z
    .array(
      z.object({
        name: z.string(),
        isPaying: z.boolean().optional(),
        paid: z.boolean().optional(),
        assignedItems: z.array(z.string()).optional(),
        subtotal: z.number().optional(),
        extras: z.number().optional(),
        tax: z.number().optional(),
        tip: z.number().optional(),
      }),
    )
    .optional(),
  user: z.string().optional(),
});

export const receiptRouter = createTRPCRouter({
  upload: protectedProcedure
    .input(ReceiptInput.omit({ user: true }))
    .mutation(async ({ ctx, input }) => {
      await connectDb();
      const userId = ctx.session.user.id;
      const receipt = await Receipt.create({ ...input, user: userId });
      return receipt;
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      await connectDb();
      const userId = ctx.session.user.id;
      const query = Receipt.find({ user: userId }).sort({ date: -1 });
      if (input.limit) query.limit(input.limit);
      return await query.exec();
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: ReceiptInput.partial().omit({ user: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await connectDb();
      const userId = ctx.session.user.id;
      const receipt = await Receipt.findOneAndUpdate(
        { _id: input.id, user: userId },
        { $set: input.data },
        { new: true },
      );
      if (!receipt) throw new Error("Receipt not found or not authorized");
      return receipt;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await connectDb();
      const userId = ctx.session.user.id;
      const result = await Receipt.deleteOne({ _id: input.id, user: userId });
      if (result.deletedCount === 0)
        throw new Error("Receipt not found or not authorized");
      return { success: true };
    }),
});
