import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Receipt } from "@/models/Receipt";
import { zodReceiptSchema } from "@/lib/zod";
import { calculateTotal } from "@/lib/utils";

export const receiptRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      zodReceiptSchema.omit({
        splitMode: true,
        splitUsers: true,
        userId: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const receipt = await Receipt.create({
        ...input,
        userId,
      });
      return receipt;
    }),

  createMany: protectedProcedure
    .input(
      z.array(
        zodReceiptSchema.omit({
          splitMode: true,
          splitUsers: true,
          userId: true,
        }),
      ),
    )
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
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const query = Receipt.find({ userId }).sort({ date: "desc" });
      if (input.limit) query.limit(input.limit);
      return await query.exec();
    }),

  list2: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).max(100).optional(),
        merchant: z.string().optional(),
        category: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const query: Record<string, unknown> = { userId };
      if (input.merchant) query.merchant = input.merchant;
      if (input.category) query.category = input.category;
      if (input.startDate)
        (query.date as unknown as { $gte: Date }).$gte = new Date(
          input.startDate,
        );
      if (input.endDate)
        (query.date as unknown as { $lte: Date }).$lte = new Date(
          input.endDate,
        );

      let dbQuery = Receipt.find(query).sort({ date: "desc" });

      let page = input.page ?? 1;
      let pageSize = input.pageSize ?? input.limit ?? 20;
      if (input.page || input.pageSize) {
        dbQuery = dbQuery.skip((page - 1) * pageSize).limit(pageSize);
      } else if (input.limit) {
        dbQuery = dbQuery.limit(input.limit);
      }

      const receipts = await dbQuery.exec();
      const total = await Receipt.countDocuments(query);

      return {
        receipts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: zodReceiptSchema.partial().omit({ userId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const receipt = await Receipt.findOneAndUpdate(
        { _id: input.id, userId },
        { $set: input.data },
        { new: true },
      );
      if (!receipt) throw new Error("Receipt not found or not authorized");
      return receipt;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const result = await Receipt.deleteOne({ _id: input.id, userId });
      if (result.deletedCount === 0)
        throw new Error("Receipt not found or not authorized");
      return { success: true };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const result = await Receipt.deleteMany({
        _id: { $in: input.ids },
        userId,
      });
      if (result.deletedCount === 0)
        throw new Error("No receipts deleted or not authorized");
      return { success: true, deletedCount: result.deletedCount };
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const result = await Receipt.deleteMany({ userId });
    return { success: true, deletedCount: result.deletedCount };
  }),

  aggregateTotals: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const receipts = await Receipt.find({ userId }).lean();

    const totalsByCategory: Record<string, number> = {};
    let grandTotal = 0;

    for (const receipt of receipts) {
      const total = calculateTotal(receipt);
      const category = receipt.category;
      totalsByCategory[category] = (totalsByCategory[category] ?? 0) + total;
      grandTotal += total;
    }

    const breakdown = Object.entries(totalsByCategory).map(
      ([category, total]) => ({
        category,
        total,
        percentage: grandTotal ? (total / grandTotal) * 100 : 0,
      }),
    );

    return {
      grandTotal,
      breakdown,
    };
  }),
});
