import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Outfit } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { WorkspaceShell } from "@/components/workspace-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "StudyOS — The Study Operating System for Serious Students",
    template: "%s | StudyOS"
  },
  description:
    "AI-powered study planner with accountability rooms, leaderboards, and streak-based motivation. Plan smarter, stay consistent, and see real progress.",
  metadataBase: new URL("https://studyos.app"),
  openGraph: {
    title: "StudyOS — The Study Operating System for Serious Students",
    description:
      "AI-powered study planner with accountability rooms, leaderboards, and streak-based motivation.",
    siteName: "StudyOS",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyOS — The Study Operating System",
    description:
      "Plan smarter, stay consistent, compete with peers. The study app students actually open every day."
  },
  robots: {
    index: true,
    follow: true
  },
  other: {
    "theme-color": "#5f6fff"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-body selection:bg-indigo-500/30 selection:text-ink dark:selection:text-white">
        <Providers>
          <WorkspaceShell>
            {children}
          </WorkspaceShell>
        </Providers>
      </body>
    </html>
  );
}
