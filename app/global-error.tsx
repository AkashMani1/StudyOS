"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function GlobalError({
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
    <html>
      <body className="bg-night text-white font-sans">
        <main className="flex min-h-screen items-center justify-center px-6 text-center">
          <div className="max-w-lg space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ember">System Crash</p>
            <h1 className="font-display text-3xl font-bold">StudyOS hit something ugly.</h1>
            <p className="text-sm text-white/75 leading-relaxed">
              We encountered a critical error. This often happens if your login session is corrupted.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
                onClick={() => reset()}
              >
                Try again
              </button>
              <button
                className="w-full rounded-2xl bg-white/5 px-4 py-4 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 border border-white/10"
                onClick={handleSignOut}
              >
                Sign out & Login again
              </button>
            </div>

            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-6">
              Digest: {error.digest || "Internal UI Error"}
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
