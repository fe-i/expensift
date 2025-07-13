"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut } from "lucide-react";
import { signIn, useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { ColorModeToggle } from "@/components/color-mode-toggle";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Receipts", href: "/receipts" },
  { name: "Plan", href: "/plan" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  return (
    <header className="bg-background/90 fixed top-0 right-0 left-0 z-50 flex w-full items-center justify-between border-b px-6 py-4">
      <Link
        href="/"
        className="flex items-center gap-4"
        aria-label="Go to home"
      >
        <img
          src="https://placehold.co/32"
          alt="Expensift"
          className="h-8 w-8"
        />
        <span className="text-2xl font-extrabold">expensift</span>
      </Link>
      {session?.user && (
        <div className="flex items-center gap-4">
          <nav
            className="invisible hidden items-center gap-2 sm:visible sm:flex"
            aria-label="Main navigation"
          >
            {links.map((link, _) => (
              <Link
                key={_}
                href={link.href}
                className={cn(
                  "hover:bg-accent rounded-md px-2 py-1 transition-all",
                  pathname === link.href && "font-bold",
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar aria-label="User menu">
                <AvatarImage
                  src={session?.user.image ?? ""}
                  alt={session?.user.name}
                />
                <AvatarFallback>
                  {session?.user.name.at(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="p-2">
                <p className="text-md font-medium">{session?.user.name}</p>
                <p className="text-muted-foreground text-xs">
                  {session?.user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => signOut()}
                disabled={isPending}
                aria-label="Sign out"
              >
                <LogOut />
                Sign Out
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2 sm:hidden" />
              {links.map((link, _) => (
                <DropdownMenuItem key={_} asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      "visible sm:invisible sm:hidden",
                      pathname === link.href && "font-bold",
                    )}
                  >
                    {link.name}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-2" />
              <ColorModeToggle />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {!session?.user && (
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
                account or create one using one of the options below
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-between gap-4">
              <Button
                variant="outline"
                className="flex w-full items-center gap-2"
                disabled={isPending}
                onClick={async () => {
                  await signIn.social({
                    provider: "google",
                    callbackURL: "/dashboard",
                    // newUserCallbackURL: "/welcome",
                  });
                }}
                aria-label="Sign in with Google"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="0.98em"
                  height="1em"
                  viewBox="0 0 256 262"
                >
                  <path
                    fill="#4285F4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  ></path>
                  <path
                    fill="#EB4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  ></path>
                </svg>
                Sign in with Google
              </Button>
            </div>
            <DialogFooter>
              <DialogDescription className="w-full text-xs">
                By signing in, you accept the{" "}
                <Link href="/terms" className="hover:bg-accent font-semibold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="hover:bg-accent font-semibold">
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
