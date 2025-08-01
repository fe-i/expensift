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
  const image = "/icons/icon-192.png";
  const bgImage = "/icons/icon-192-bg.png";

  return {
    title: _title,
    description,
    manifest: "/manifest.json",
    icons: [
      { rel: "icon", url: "/favicon.ico" },
      { rel: "apple-touch-icon", url: image },
    ],
    keywords: [
      "expense tracker",
      "budget manager",
      "personal finance",
      "money management",
      "receipt scanner",
      "bill splitting",
    ],
    authors: [{ name: "Fei", url: "https://github.com/fe-i/" }],
    robots: "index, follow",
    metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
    openGraph: {
      type: "website",
      title: _title,
      description,
      locale: "en_US",
      images: [
        {
          url: bgImage,
          width: 192,
          height: 192,
          alt: _title,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: _title,
      description,
      images: [bgImage],
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "apple-mobile-web-app-title": "Expensift",
    },
  };
}

export const metadata: Metadata = generateMetadata();
