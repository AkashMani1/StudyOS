"use client";

import { useState, useMemo } from "react";
import { Coins, Flame, Target, TrendingUp, Plus } from "lucide-react";
import { CoachChat } from "@/components/coach-chat";
import { EmptyState } from "@/components/empty-state";
import { ProgressRing } from "@/components/progress-ring";
import { StatChip } from "@/components/stat-chip";
import dynamic from "next/dynamic";

const PlanRealityWidget = dynamic(
  () => import("@/components/plan-reality-widget").then((mod) => mod.PlanRealityWidget),
  {
    ssr: false,
    loading: () => <div className="h-96 w-full animate-pulse rounded-[32px] bg-white/50 dark:bg-slate-900/50" />
  }
);
import { StudentProfileCard } from "@/components/student-profile-card";
import { WalletCard } from "@/components/wallet-card";
import { Card, SectionHeading, Button } from "@/components/ui";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { useStudyData } from "@/hooks/use-study-data";
import { useAuth } from "@/hooks/use-auth";
import { getExploreProfile, getExploreSessions, getExploreTasks } from "@/lib/explore-data";
import { strapi } from "@/lib/strapi";
import { useEffect } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late night grind";
}

function getMotivation(focusScore: number, missedCount: number): string {
  if (focusScore >= 80) return "You're on fire. Keep this energy going.";
  if (focusScore >= 50) return "Solid momentum. One more session will push you higher.";
  if (missedCount > 3) return "Behind today — but one focused block can change the story.";
  return "Start your first session and build from there.";
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { tasks, sessions } = useStudyData();
  
  // Local state for dynamically fetched explore data
  const [exploreProfile, setExploreProfile] = useState(getExploreProfile());
  const [exploreTasks, setExploreTasks] = useState(getExploreTasks());
  const [exploreSessions, setExploreSessions] = useState(getExploreSessions());

  useEffect(() => {
    // If user is not logged in, attempt to fetch fresh explore data from Strapi
    if (!user) {
      const fetchExploreContent = async () => {
        const [p, t, s] = await Promise.all([
          strapi.getExploreProfile(),
          strapi.getExploreTasks(),
          strapi.getExploreSessions(),
        ]);
        if (p) setExploreProfile(p);
        if (t) setExploreTasks(t);
        if (s) setExploreSessions(s);
      };
      fetchExploreContent();
    }
  }, [user]);

  const visibleProfile = user ? profile : exploreProfile;
  const visibleSessions = user ? sessions : exploreSessions;
  const visibleTasks = user ? tasks : exploreTasks;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  
  const todayTasks = useMemo(() => 
    visibleTasks.filter((task) => task.suggestedDay === today),
    [visibleTasks, today]
  );

  const activeTasks = todayTasks.filter((task) => !task.completed).length;
  const completedToday = todayTasks.filter((task) => task.completed).length;
  const missedToday = todayTasks.filter((task) => !task.completed).length;
  
  const focusScore =
    todayTasks.length === 0
      ? 0
      : Math.round((completedToday / todayTasks.length) * 100);

  const displayName = visibleProfile?.displayName ?? "Student";
  const firstName = displayName.split(" ")[0];
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl">
      <CreateTaskDialog 
        isOpen={isTaskDialogOpen} 
        onClose={() => setIsTaskDialogOpen(false)} 
        onSuccess={() => window.location.reload()} 
      />

      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Command Center</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Your daily command center — one glance, one action, full momentum.</p>
        </div>
        <Button 
          onClick={() => setIsTaskDialogOpen(true)}
          className="shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          Quick Task
        </Button>
      </header>

      <div className="grid gap-6">
        {/* ── Hero Card ── */}
        <section className="overflow-hidden rounded-2xl bg-slate-900 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(49,46,129,0.95),rgba(79,70,229,0.9))] p-6 text-white shadow-md md:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-sm font-semibold text-white/60">
                {getGreeting()}, <span className="text-white">{firstName}</span>
              </p>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                {getMotivation(focusScore, missedToday)}
              </h2>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <StatChip icon={Target} label="Tasks left" value={activeTasks} trend={activeTasks > 5 ? "down" : "up"} />
                <StatChip icon={Flame} label="Done Today" value={`${completedToday}`} trend="up" />
                <StatChip icon={Coins} label="Coins" value={visibleProfile?.wallet?.coins ?? 0} trend="neutral" />
              </div>
            </div>
            <div className="shrink-0">
              <ProgressRing
                value={focusScore}
                size="lg"
                label="Focus"
                color="stroke-aurora"
              />
            </div>
          </div>
        </section>

        {/* ── Quick Stats Row ── */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active tasks</p>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{activeTasks}</h3>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
              <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sessions done</p>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{completedToday}<span className="text-sm font-medium text-slate-400 ml-1">/{todayTasks.length}</span></h3>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
              <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Coins banked</p>
              <h3 className="font-display text-2xl font-bold">{visibleProfile?.wallet?.coins ?? 0}</h3>
            </div>
          </Card>
        </section>

        {/* ── Profile ── */}
        <StudentProfileCard profile={visibleProfile} />

        {/* ── Wallet ── */}
        <WalletCard coins={visibleProfile?.wallet?.coins ?? 0} transactions={visibleProfile?.wallet?.transactions ?? []} />

        {/* ── Plan vs Reality ── */}
        {visibleTasks.length === 0 ? (
          <EmptyState
            title="No study tasks yet"
            description="Finish onboarding so Gemini can split your exam goal into work blocks that actually fit your calendar."
            ctaLabel="Start onboarding"
            ctaHref="/onboarding"
          />
        ) : (
          <PlanRealityWidget tasks={visibleTasks} sessions={visibleSessions} />
        )}

        {/* ── Coach + Insights ── */}
        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <CoachChat />
          <Card className="space-y-4">
            <SectionHeading
              eyebrow="How it works"
              title="Your study engine"
              description="StudyOS watches your execution and adapts your plan in real-time."
            />
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
                <p className="font-semibold text-slate-900 dark:text-white">Session reminders</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Push nudges fire 15 minutes before a planned session.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
                <p className="font-semibold text-slate-900 dark:text-white">Failure pressure</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Misses trigger automatic rescheduling and coaching interventions.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
                <p className="font-semibold text-slate-900 dark:text-white">Coin stakes</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Complete tasks to earn. Miss sessions and the system deducts.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
