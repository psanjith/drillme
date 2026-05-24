import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DrillMe — AI Interview & Speaking Coach",
  description: "AI-powered interview prep and speaking coach. Practice with realistic panellists, get instant feedback, and track your growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
