import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VENDRE — Private Sales CRM",
  description: "Enterprise Sales CRM with strict multi-workspace isolation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
