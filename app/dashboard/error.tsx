"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Button, Card, SectionHeading } from "@/components/ui";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch("/api/session/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      window.location.href = "/login";
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <Card className="max-w-lg space-y-6 text-center border-rose-500/20 bg-rose-500/5">
        <SectionHeading
          eyebrow="Session Error"
          title="Something went wrong"
          description="We hit a snag while loading your dashboard. This usually happens if your session expired or there was a sync issue."
        />
        
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="ghost" className="flex-1" onClick={handleSignOut}>
            Sign out & Login again
          </Button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ref: {error.digest || "Internal UI Error"}
        </p>
      </Card>
    </main>
  );
}
