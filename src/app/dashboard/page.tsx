import { api, HydrateClient } from "@/trpc/server";
import { LatestPost } from "@/components/post";
import { generateMetadata } from "@/lib/metadata";
import ProtectedPage from "@/components/protected-page";

export const metadata = generateMetadata({
  title: "Dashboard",
  description: "Manage your expenses and track your budget",
});

export default function Dashboard() {
  void api.post.getLatestMongoose.prefetch();

  return (
    <HydrateClient>
      <ProtectedPage>
        <div className="bg-background flex min-h-screen flex-col">
          <section className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-4">
            <LatestPost />
          </section>
        </div>
      </ProtectedPage>
    </HydrateClient>
  );
}

export const dynamic = "force-dynamic";
