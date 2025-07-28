import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Receipt } from "@/models/Receipt";
import { calculateTotal } from "@/lib/utils";
import { zodReceiptInputSchema } from "@/lib/types";

export const receiptRouter = createTRPCRouter({
  create: protectedProcedure
    .input(zodReceiptInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const receipt = await Receipt.create({
        ...input,
        userId,
      });
      return receipt;
    }),

  createMany: protectedProcedure
    .input(z.array(zodReceiptInputSchema))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const receiptsWithUser = input.map((receipt) => ({
        ...receipt,
        userId,
      }));
      const receipts = await Receipt.insertMany(receiptsWithUser);
      return receipts;
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 50;
      const skip = (page - 1) * pageSize;

      const match = { userId };
      const allReceipts = await Receipt.find(match).lean();
      const grandTotal = allReceipts.reduce(
        (sum, receipt) => sum + calculateTotal(receipt),
        0,
      );

      const totalsByCategory: Record<string, number> = {};
      for (const receipt of allReceipts) {
        const total = calculateTotal(receipt);
        const category = receipt.category;
        totalsByCategory[category] = (totalsByCategory[category] ?? 0) + total;
      }

      const categoryBreakdown = Object.entries(totalsByCategory).map(
        ([category, total]) => ({
          category,
          total,
          percentage: grandTotal ? (total / grandTotal) * 100 : 0,
        }),
      );

      const receipts = await Receipt.find(match)
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      const receiptsWithTotal = receipts.map((receipt) => ({
        ...receipt,
        total: calculateTotal(receipt),
      }));

      return {
        receipts: receiptsWithTotal,
        grandTotal,
        categoryBreakdown,
        page,
        totalPages: Math.ceil(allReceipts.length / pageSize),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: zodReceiptInputSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const receipt = await Receipt.findOneAndUpdate(
        { _id: input.id, userId },
        { $set: input.data },
        { new: true },
      );
      return receipt ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const result = await Receipt.deleteOne({ _id: input.id, userId });
      if (result.deletedCount === 0) return { success: false, deletedCount: 0 };
      return { success: true, deletedCount: result.deletedCount };
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const result = await Receipt.deleteMany({ userId });
    return { success: true, deletedCount: result.deletedCount };
  }),
});
