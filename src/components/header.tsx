"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { LogIn, LogOut, Settings, Home } from "lucide-react";
import { signIn, useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Image from "next/image";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: <Home /> },
  { href: "/settings", label: "Settings", icon: <Settings /> },
];

export function Header() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onError: () => {
          toast.error("Sign out failed", {
            description: "Could not sign you out. Please try again.",
          });
        },
        onSuccess: () => {
          void router.push("/");
          toast.success("Signed out", {
            description: "You have been signed out.",
          });
        },
      },
    });
  }

  async function handleSignIn(provider: string) {
    await signIn.social(
      { provider, callbackURL: "/dashboard" },
      {
        onError: () => {
          toast.error("Sign in failed", {
            description: "Could not sign you in. Please try again.",
          });
        },
        onSuccess: () => {
          void router.push("/");
          toast.success("Signed in", {
            description: "You have been signed in successfully.",
          });
        },
      },
    );
  }

  return (
    <header
      className="bg-background/90 fixed top-0 right-0 left-0 z-50 flex w-full items-center justify-between border-b px-4 py-3"
      aria-label="Main header"
    >
      <Link href="/" aria-label="Go to home">
        <Image
          src="/logo.svg"
          alt="Expensift logo"
          width={152 * 1.1}
          height={28 * 1.1}
        />
      </Link>
      {session?.user ? (
        <Sheet>
          <SheetTrigger asChild>
            <Avatar aria-label="Open user menu" className="cursor-pointer">
              <AvatarImage
                src={session?.user.image ?? ""}
                alt={session?.user.name ?? "User avatar"}
              />
              <AvatarFallback>
                {session?.user.name?.at(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                Welcome, {session?.user.name}!
                <SheetDescription>{session?.user.email}</SheetDescription>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4">
              {LINKS.map((link, _) => (
                <Link
                  key={_}
                  href={link.href}
                  aria-label={link.label}
                  tabIndex={pathname === link.href ? -1 : 0}
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-3 transition-all",
                    pathname === link.href
                      ? "bg-muted cursor-not-allowed opacity-80"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  <LogOut />
                  Sign Out
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className={cn(
                "flex gap-2",
                isPending && "visible sm:invisible sm:hidden",
              )}
              variant="outline"
              disabled={isPending}
              aria-label="Sign in"
            >
              <LogIn />
              Sign In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Sign In</DialogTitle>
              <DialogDescription className="text-sm">
                To use <strong>Expensift</strong> you must log into an existing
                account or create one using one of the options below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-between gap-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="flex w-full items-center gap-2"
                  disabled={isPending}
                  onClick={async () => await handleSignIn("google")}
                  aria-label="Sign in with Google"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="0.98em"
                    height="1em"
                    viewBox="0 0 256 262"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="#4285F4"
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    />
                    <path
                      fill="#34A853"
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    />
                    <path
                      fill="#FBBC05"
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                    />
                    <path
                      fill="#EB4335"
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </DialogClose>
            </div>
            <DialogFooter>
              <DialogDescription className="w-full text-xs">
                By signing in, you accept the{" "}
                <Link
                  href="/terms"
                  className="hover:bg-accent font-semibold"
                  aria-label="Terms of Service"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="hover:bg-accent font-semibold"
                  aria-label="Privacy Policy"
                >
                  Privacy Policy
                </Link>
                .
              </DialogDescription>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}
