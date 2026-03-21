"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Trophy, Medal, Zap, TrendingUp, Crown, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProGate } from "@/components/pro-gate";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400 ring-1 ring-indigo-500/20">
            <Star className="h-3 w-3 fill-indigo-400" />
            Global Rankings
          </div>
          <h1 className="font-display text-5xl font-black text-white tracking-tight">
            Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">Scholars</span>
          </h1>
          <p className="max-w-md text-sm font-medium text-slate-400 leading-relaxed">
            {lastUpdated ? `Syncing with global wallet: ${lastUpdated.toLocaleTimeString()}` : "Real-time verification of study stakes and achievements."}
          </p>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={loading}
          className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-indigo-400 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          {loading ? "Syncing..." : "Sync Wallet"}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        </button>
      </header>

      <ProGate>
        <div className="space-y-16">
          {/* Top 3 Podium */}
          {sorted.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
              {/* Rank 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="order-2 md:order-1 flex flex-col items-center group"
              >
                <div className="relative mb-4">
                  <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${getDeterministicGradient(sorted[1].uid)} p-1 shadow-[0_0_30px_rgba(148,163,184,0.2)]`}>
                    <div className="h-full w-full rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-3xl font-black text-white overflow-hidden uppercase">
                      {sorted[1].displayName.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white rounded-full p-2 border-4 border-slate-900 shadow-xl">
                    <Medal className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{sorted[1].displayName}</h3>
                <div className="text-indigo-400 font-black text-2xl">{sorted[1].coins.toLocaleString()}<span className="text-xs uppercase ml-1 opacity-50">C</span></div>
              </motion.div>

              {/* Rank 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="order-1 md:order-2 flex flex-col items-center mb-8 md:mb-12 relative"
              >
                <div className="absolute -top-16 animate-bounce">
                  <Crown className="h-12 w-12 text-amber-400 fill-amber-400" />
                </div>
                <div className="relative mb-6">
                  <div className={`h-32 w-32 rounded-full bg-gradient-to-br ${getDeterministicGradient(sorted[0].uid)} p-[6px] shadow-[0_0_50px_rgba(245,158,11,0.3)] ring-4 ring-amber-500/20`}>
                    <div className="h-full w-full rounded-full border-4 border-slate-950 bg-slate-900 flex items-center justify-center text-4xl font-black text-white overflow-hidden uppercase">
                      {sorted[0].displayName.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-amber-500 text-white rounded-full p-3 border-4 border-slate-900 shadow-2xl scale-125">
                    <Trophy className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2">{sorted[0].displayName}</h3>
                <div className="text-amber-500 font-extrabold text-4xl tabular-nums drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  {sorted[0].coins.toLocaleString()}
                  <span className="text-sm uppercase ml-1 opacity-60">Coins</span>
                </div>
              </motion.div>

              {/* Rank 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="order-3 flex flex-col items-center group"
              >
                <div className="relative mb-4">
                  <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${getDeterministicGradient(sorted[2].uid)} p-1 shadow-[0_0_30px_rgba(180,83,9,0.2)]`}>
                    <div className="h-full w-full rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-3xl font-black text-white overflow-hidden uppercase">
                      {sorted[2].displayName.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white rounded-full p-2 border-4 border-slate-900 shadow-xl">
                    <Star className="h-5 w-5 fill-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{sorted[2].displayName}</h3>
                <div className="text-indigo-400 font-black text-2xl">{sorted[2].coins.toLocaleString()}<span className="text-xs uppercase ml-1 opacity-50">C</span></div>
              </motion.div>
            </div>
          )}

          {/* List for the rest */}
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {sorted.slice(3).map((row, index) => {
                const actualIndex = index + 3;
                const isMe = row.uid === user?.uid;
                return (
                  <motion.div
                    key={row.uid}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-6 rounded-[24px] border p-4 md:p-6 transition-all duration-300",
                      isMe 
                        ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                    )}
                  >
                    {isMe && <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />}
                    
                    {/* Rank */}
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 font-black text-slate-500">
                      #{actualIndex + 1}
                    </div>

                    {/* Avatar */}
                    <div className={`shrink-0 h-12 w-12 rounded-full bg-gradient-to-br ${getDeterministicGradient(row.uid)} p-[2px]`}>
                      <div className="h-full w-full rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                        {row.displayName.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className={cn("font-bold text-lg truncate", isMe ? "text-indigo-400" : "text-white")}>
                          {row.displayName}
                        </p>
                        {isMe && <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-indigo-400 border border-indigo-500/20">You</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {row.streak > 0 && <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> {row.streak}D STREAK</span>}
                        {row.completedTasks > 0 && <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-500" /> {row.completedTasks} TASKS</span>}
                      </div>
                    </div>

                    {/* Coins */}
                    <div className="shrink-0 text-right">
                      <p className={cn("text-2xl font-black tabular-nums", isMe ? "text-indigo-400" : "text-white text-opacity-90")}>
                        {row.coins.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {sorted.length === 0 && !loading && (
              <div className="text-center py-20 rounded-[32px] border border-dashed border-white/10 bg-white/[0.02]">
                <Trophy className="h-12 w-12 text-white/5 mx-auto mb-4" />
                <p className="text-sm text-slate-400 font-medium">No scholars ranked yet. Sync your wallet to start the climb!</p>
              </div>
            )}
          </div>
        </div>
      </ProGate>
    </div>
  );
}
