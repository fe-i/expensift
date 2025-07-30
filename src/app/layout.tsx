import "@/styles/globals.css";
import { Manrope } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";

export { metadata } from "@/lib/metadata";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Expensift" />
        <link rel="apple-touch-icon" href="/icons/icon-192-bg.png" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <main className="min-h-screen pt-16">
              <Header />
              {children}
            </main>
            <footer className="text-muted-foreground bg-background border-border w-full border-t py-4 text-center text-sm">
              Copyright © {new Date().getFullYear()} Expensift. All rights
              reserved.
            </footer>
            <Toaster closeButton />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
