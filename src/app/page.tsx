"use client";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Sparkles, Split, PieChart } from "lucide-react";

const features = [
  {
    icon: ScanLine,
    title: "Intelligent Scanning",
    description:
      "Instantly extract merchant, items, and totals from any receipt photo using AI.",
  },
  {
    icon: Sparkles,
    title: "Smart Categorization",
    description:
      "Expenses are automatically categorized to give you a clear overview of your spending.",
  },

  {
    icon: Split,
    title: "Flexible Bill Splitting",
    description:
      "Easily split bills any way you want. Assign items and let the app handle the math.",
  },
  {
    icon: PieChart,
    title: "Data Visualization",
    description:
      "Understand and improve your spending habits with interactive charts and AI-generated summaries.",
  },
];

export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  return (
    <div className="bg-background flex flex-col">
      <section className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-4">
        <h1 className="text-center text-5xl font-medium tracking-tighter md:text-6xl lg:text-7xl">
          All-In-One Expense Tracker
          <br />
          Scan, Split, Share
        </h1>
        <p className="my-[5vh] max-w-[90vw] text-center sm:max-w-[70vw] md:max-w-[50vw] md:text-lg lg:max-w-[40vw]">
          Expensift makes expense management effortless.
          <br />
          Upload your receipts for instant AI parsing, split bills with friends,
          and visualize your spending with interactive charts.
        </p>
        <div className="flex gap-4">
          <Button
            aria-label="Get started"
            onClick={() => void router.push("/dashboard")}
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            aria-label="Learn more"
            onClick={() => {
              featuresRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Learn More
          </Button>
        </div>
      </section>
      <section
        ref={featuresRef}
        className="bg-muted flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-8 py-16"
      >
        <h2 className="mb-2 text-center text-4xl font-medium tracking-tighter md:text-5xl lg:text-6xl">
          Key Features
        </h2>
        <p className="text-muted-foreground mx-auto max-w-xl text-center md:text-lg">
          Expensift provides a powerful suite of features to make expense
          management effortless and accurate.
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 sm:px-64">
          {features.map((feature, _) => (
            <div key={_} className="flex flex-col items-center text-center">
              <feature.icon className="text-primary mb-2 h-8 w-8" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
