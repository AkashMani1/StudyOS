"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ProGate } from "@/components/pro-gate";
import { useAuth } from "@/hooks/use-auth";
import { getExploreLeaderboard } from "@/lib/explore-data";
import { refreshLeaderboard } from "@/services/study-service";
import type { LeaderboardScore } from "@/types/domain";

function getWeekId(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-W${Math.ceil((now.getUTCDate() + 6 - now.getUTCDay()) / 7)}`;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardScore[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const weekId = useMemo(() => getWeekId(), []);

  useEffect(() => {
    if (!user) {
      setRows(getExploreLeaderboard());
      return;
    }

    const load = async () => {
      try {
        setRefreshing(true);
        setRows(await refreshLeaderboard());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh leaderboard.");
      } finally {
        setRefreshing(false);
      }
    };

    void load();
  }, [user, weekId]);

  return (
    <AppShell
      title="Leaderboard"
      subtitle="The weekly ranking board for coins, streaks, completion rate, and optionally public failure visibility."
    >
      <ProGate>
        <LeaderboardTable
          currentUid={user?.uid ?? null}
          onRefresh={user ? () => void refreshLeaderboard().then(setRows).catch((error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Unable to refresh leaderboard.");
          }) : undefined}
          refreshing={refreshing}
          rows={[...rows].sort((left, right) => right.coins - left.coins)}
        />
      </ProGate>
    </AppShell>
  );
}
