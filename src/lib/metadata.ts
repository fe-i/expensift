import { env } from "@/env";
import { type Metadata } from "next";

interface MetadataOptions {
  title?: string;
  description?: string;
}

export function generateMetadata({
  title,
  description = "Multipurpose expense and budget manager",
}: MetadataOptions = {}): Metadata {
  const _title = title ? `${title} | Expensift` : "Expensift";
  const image = "/favicon.ico";

  return {
    title: _title,
    description,
    icons: [{ rel: "icon", url: image }],
    keywords: [
      "expense tracker",
      "budget manager",
      "personal finance",
      "money management",
      "receipt scanner",
      "bill splitting",
    ],
    authors: [{ name: "Fei" }],
    robots: "index, follow",
    other: {
      thumbnail: image,
    },
    metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
    openGraph: {
      type: "website",
      title: _title,
      description,
      locale: "en_US",
      images: [
        {
          url: image,
          width: 400,
          height: 400,
          alt: _title,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: _title,
      description,
      images: [image],
    },
  };
}

export const metadata: Metadata = generateMetadata();
