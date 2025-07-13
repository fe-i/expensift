import { api, HydrateClient } from "@/trpc/server";
import { generateMetadata } from "@/lib/metadata";
import { ProtectedPage } from "@/components/protected-page";

export const metadata = generateMetadata({
  title: "Plan",
  description: "Create a budget and track your financial goals", // budgeting and calculators
});

export default function Plan() {
  return (
    <HydrateClient>
      <ProtectedPage>
        <div className="bg-background flex min-h-screen flex-col">
          <section className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-4">
            <p>Page</p>
          </section>
        </div>
      </ProtectedPage>
    </HydrateClient>
  );
}

// export const dynamic = "force-dynamic";
