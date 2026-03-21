"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { RefreshCw, Trophy, Medal, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProGate } from "@/components/pro-gate";
import { useAuth } from "@/hooks/use-auth";
import { getExploreLeaderboard } from "@/lib/explore-data";
import { db } from "@/lib/firebase";
import { refreshLeaderboard } from "@/services/study-service";
import type { LeaderboardScore } from "@/types/domain";

const CACHE_KEY = "lb_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const gradients = [
  "from-rose-400 to-red-500", "from-blue-400 to-emerald-400",
  "from-violet-400 to-fuchsia-500", "from-amber-400 to-orange-500",
  "from-cyan-400 to-indigo-500", "from-teal-400 to-blue-500",
  "from-pink-400 to-rose-400", "from-indigo-400 to-purple-500"
];

function getDeterministicGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

async function readPublicLeaderboard(): Promise<LeaderboardScore[] | null> {
  try {
    const weekId = getWeekId();
    const snap = await getDocs(
      query(collection(db, "leaderboard", weekId, "scores"), orderBy("coins", "desc"))
    );
    if (snap.empty) return null;
    return snap.docs.map((d) => d.data() as LeaderboardScore);
  } catch {
    return null;
  }
}

function loadCache(): LeaderboardScore[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { rows, ts } = JSON.parse(raw) as { rows: LeaderboardScore[]; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return rows;
  } catch {
    return null;
  }
}

function saveCache(rows: LeaderboardScore[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rows, ts: Date.now() }));
  } catch {
    /* quota exceeded — ignore */
  }
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (force = false) => {
    if (!user) {
      setRows(getExploreLeaderboard());
      return;
    }

    // On normal mount: try cache → Firestore only (never hit the API)
    if (!force) {
      const cached = loadCache();
      if (cached) { setRows(cached); return; }

      try {
        setLoading(true);
        const firestoreRows = await readPublicLeaderboard();
        if (firestoreRows && firestoreRows.length > 0) {
          setRows(firestoreRows);
          saveCache(firestoreRows);
          setLastUpdated(new Date());
        }
        // If Firestore is empty, just show the empty state — do NOT call API
      } catch {
        /* silently show empty state */
      } finally {
        setLoading(false);
      }
      return;
    }

    // force=true: user clicked Refresh → call API → it writes to Firestore
    try {
      setLoading(true);
      const apiRows = await refreshLeaderboard();
      setRows(apiRows);
      saveCache(apiRows);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rate limit hit. Wait a minute and try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(false); }, [load]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.coins - a.coins), [rows]);
  const topTen = sorted.slice(0, 10);
  const meIndex = sorted.findIndex((r) => r.uid === user?.uid);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 max-w-3xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Weekly Rankings</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Reads from Firebase instantly."}
          </p>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={loading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>
      <ProGate>
        <div className="max-w-3xl space-y-8">

          {/* User is outside top 10 */}
          {meIndex >= 10 && user && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 px-5 py-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">Your Position</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{sorted[meIndex]?.displayName}</p>
              </div>
              <p className="font-display font-bold text-3xl text-indigo-600 dark:text-indigo-400">#{meIndex + 1}</p>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-3">
            {topTen.map((row, index) => {
              const isTop = index === 0;
              const isSilver = index === 1;
              const isBronze = index === 2;
              const isMe = row.uid === user?.uid;
              return (
                <motion.div
                  key={row.uid}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className={`flex items-center gap-4 rounded-xl border p-4 md:p-5 transition-all duration-200 ${
                    isMe && !isTop
                      ? "border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10"
                      : isTop
                        ? "border-amber-400/50 bg-amber-50 shadow-sm dark:border-amber-500/50 dark:bg-amber-500/10 ring-1 ring-amber-400"
                        : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Rank badge */}
                  <div className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl font-bold text-sm ${
                    isTop
                      ? "bg-amber-500 text-white shadow-sm"
                      : isSilver
                        ? "bg-slate-400 text-white shadow-sm"
                        : isBronze
                          ? "bg-amber-700 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {isTop ? <Trophy className="h-5 w-5" /> : isSilver ? <Medal className="h-5 w-5" /> : index + 1}
                  </div>

                  {/* Avatar */}
                  <div className={`shrink-0 h-11 w-11 rounded-full bg-gradient-to-br ${getDeterministicGradient(row.uid)} flex items-center justify-center text-white font-black text-lg shadow-inner border border-white/20`}>
                    {row.displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-bold text-base truncate ${
                        isTop ? "text-amber-700 dark:text-amber-400"
                          : isMe ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-900 dark:text-slate-100"
                      }`}>
                        {row.displayName}
                      </p>
                      {isMe && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md">You</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {row.streak > 0 && <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" />{row.streak}d streak</span>}
                      {row.completedTasks > 0 && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-500" />{row.completedTasks} tasks</span>}
                      {row.failureSummary && <span className="text-rose-500">{row.failureSummary}</span>}
                    </div>
                  </div>

                  {/* Coins */}
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-black tabular-nums ${
                      isTop ? "text-amber-600 dark:text-amber-400"
                        : isMe ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-800 dark:text-slate-100"
                    }`}>
                      {row.coins.toLocaleString()}
                    </p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">coins</p>
                  </div>
                </motion.div>
              );
            })}

            {topTen.length === 0 && !loading && (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No scholars ranked yet. Click Refresh to compute the first ranking!</p>
              </div>
            )}
          </div>
        </div>
      </ProGate>
    </div>
  );
}
