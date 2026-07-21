import type { Metadata, Viewport } from "next";
import "./globals.css";

const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const socialImage = `${publicBasePath}/og.png`;

export const metadata: Metadata = {
  metadataBase,
  title: "Sentinel AI | Secure every change",
  description: "AI-assisted code security, policy guardrails, and measurable security evals for every pull request.",
  openGraph: {
    title: "Sentinel AI",
    description: "Secure every change with code analysis, policy guardrails, and measurable evals.",
    type: "website",
    images: [{ url: socialImage, width: 1745, height: 909, alt: "Sentinel AI security command center" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentinel AI",
    description: "Secure every change with code analysis, policy guardrails, and measurable evals.",
    images: [socialImage]
  },
  icons: {
    icon: `${publicBasePath}/favicon.svg`,
    shortcut: `${publicBasePath}/favicon.svg`
  }
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07110f"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
