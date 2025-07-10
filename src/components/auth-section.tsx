"use client";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AuthSection() {
  const { data: session, isPending, error } = useSession();

  return (
    <div className="flex flex-col items-center gap-4">
      {session?.user ? (
        <>
          <p className="text-xl">Welcome, {session.user.name}!</p>
          <Button
            className="rounded-full bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700"
            onClick={async () => {
              await signOut();
            }}
          >
            Sign out
          </Button>
        </>
      ) : (
        <>
          <p className="text-xl">Hey!</p>
          {isPending && <p className="text-sm text-gray-500">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error.message}</p>}
          <Button
            className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
            onClick={async () => {
              await signIn.social({
                provider: "google",
                // callbackURL: "/",
                // errorCallbackURL: "/error",
                // newUserCallbackURL: "/welcome",
              });
            }}
          >
            Sign in with Google
          </Button>
        </>
      )}
    </div>
  );
}
