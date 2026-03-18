"use client";

import { Medal } from "lucide-react";
import { Card, SectionHeading } from "@/components/ui";
import { initials } from "@/lib/utils";
import type { LeaderboardScore } from "@/types/domain";

export function LeaderboardTable({
  rows,
  currentUid,
  onRefresh,
  refreshing
}: {
  rows: LeaderboardScore[];
  currentUid: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const topTen = rows.slice(0, 10);
  const currentUserRow = rows.find((row) => row.uid === currentUid);

  return (
    <Card className="space-y-5">
      <SectionHeading
        eyebrow="Weekly leaderboard"
        title="Top ten this week"
        description="Coins, streaks, and completion rates are refreshed on demand from current student data."
      />
      {onRefresh ? (
        <div className="flex justify-end">
          <button
            className="rounded-2xl bg-comet px-4 py-2 text-sm font-semibold text-white transition hover:bg-comet/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={refreshing}
            onClick={onRefresh}
            type="button"
          >
            {refreshing ? "Refreshing..." : "Refresh leaderboard"}
          </button>
        </div>
      ) : null}
      <div className="space-y-3">
        {topTen.map((row, index) => (
          <div
            key={row.uid}
            className={`flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
              row.uid === currentUid
                ? "border-comet bg-comet/10"
                : "border-white/10 bg-white/70 dark:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                {initials(row.displayName)}
              </div>
              <div>
                <p className="font-semibold">
                  #{index + 1} · {row.displayName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {row.coins} coins · {row.streak} day streak
                </p>
                {row.failureSummary ? (
                  <p className="mt-1 text-xs text-ember dark:text-ember">{row.failureSummary}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>{row.completedTasks} tasks</span>
              <span>{row.completionPercentage}% completion</span>
              <Medal className="h-4 w-4 text-ember" />
            </div>
          </div>
        ))}
      </div>

      {currentUserRow && !topTen.some((entry) => entry.uid === currentUid) ? (
        <div className="rounded-3xl border border-dashed border-comet/40 px-4 py-4 text-sm">
          Your current rank is outside the top ten: {currentUserRow.displayName} at {currentUserRow.coins} coins.
        </div>
      ) : null}
    </Card>
  );
}
