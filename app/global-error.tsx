"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

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

  return (
    <html>
      <body className="bg-night text-white">
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-lg space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ember">App error</p>
            <h1 className="font-display text-3xl font-bold">StudyOS hit something ugly.</h1>
            <p className="text-sm text-white/75">
              The error was logged. Try reloading the view, then retry the last action.
            </p>
            <button
              className="rounded-2xl bg-comet px-4 py-3 text-sm font-semibold text-white"
              onClick={() => reset()}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
