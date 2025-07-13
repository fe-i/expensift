"use client";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  if (isPending) return <></>;
  if (!session?.user)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="text-6xl font-extrabold">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be signed in to view this page.
        </p>
        <Button asChild variant="outline">
          <Link href="/">
            <Home />
            Return to homepage
          </Link>
        </Button>
      </div>
    );
  return children;
}
