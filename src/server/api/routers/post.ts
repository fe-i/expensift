import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { connectDb, db } from "@/lib/db";
import { Post } from "@/models/Post";

export const postRouter = createTRPCRouter({
  // Mongoose
  createMongoose: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await connectDb();
      const post = await Post.create({ text: input.text });
      return { id: String(post._id), text: post.text };
    }),

  getLatestMongoose: publicProcedure.query(async () => {
    await connectDb();
    const post = await Post.findOne().sort({ _id: -1 });
    if (!post) return null;
    return { id: String(post._id), text: post.text };
  }),

  // // MongoDB native
  // createNative: protectedProcedure
  //   .input(z.object({ text: z.string().min(1) }))
  //   .mutation(async ({ input }) => {
  //     const result = await db
  //       .collection("posts")
  //       .insertOne({ text: input.text });
  //     return { id: result.insertedId.toString(), text: input.text };
  //   }),

  // getLatestNative: publicProcedure.query(async () => {
  //   const post = await db
  //     .collection("posts")
  //     .find()
  //     .sort({ _id: -1 })
  //     .limit(1)
  //     .next();
  //   if (!post) return null;
  //   return { id: post._id.toString(), text: post.text };
  // }),
});
