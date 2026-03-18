"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { useFCMRegistration } from "@/hooks/use-fcm";
import { initAnalytics, trackScreenView } from "@/lib/analytics";

function AppEffects() {
  const pathname = usePathname();

  useFCMRegistration();

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    void trackScreenView(pathname);
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AppEffects />
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
