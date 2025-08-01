import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-6xl font-extrabold">404</h1>
      <p className="text-muted-foreground">
        Sorry, the page you are looking for does not exist.
      </p>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" aria-label="Return to homepage">
            <Link href="/">
              <Home />
              Return to homepage
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Return to homepage</TooltipContent>
      </Tooltip>
    </div>
  );
}
