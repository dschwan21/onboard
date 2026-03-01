import type { Metadata } from "next";

import "@/app/globals.css";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: "Onboard",
  description:
    "Structured AI education, productivity tools, and community learning for non-technical professionals."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-[var(--font-body)]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
