import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "StudyOS",
  description: "A harsh but effective full-stack study operating system."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
