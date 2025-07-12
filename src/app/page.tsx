import { api, HydrateClient } from "@/trpc/server";
import { LatestPost } from "@/components/post";

export default async function Home() {
  void api.post.getLatestMongoose.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="rounded-lg bg-gray-600 p-10 text-white">
          <LatestPost />
        </div>
      </main>
    </HydrateClient>
  );
}

export const dynamic = "force-dynamic";
