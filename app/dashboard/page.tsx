"use client";

import { Coins, Flame, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
import { Card, SectionHeading } from "@/components/ui";
import { useStudyData } from "@/hooks/use-study-data";
import { useAuth } from "@/hooks/use-auth";
import { getExploreDailyPlans, getExploreProfile, getExploreSessions, getExploreTasks } from "@/lib/explore-data";

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
  const { tasks, sessions, dailyPlans } = useStudyData();
  const visibleProfile = user ? profile : getExploreProfile();
  const visibleTasks = user ? tasks : getExploreTasks();
  const visibleSessions = user ? sessions : getExploreSessions();
  const visibleDailyPlans = user ? dailyPlans : getExploreDailyPlans();

  const activeTasks = visibleTasks.filter((task) => !task.completed).length;
  const completedSessions = visibleSessions.filter((session) => session.completed).length;
  const missedSessions = visibleSessions.filter((session) => !session.completed).length;
  const focusScore =
    visibleSessions.length === 0
      ? 0
      : Math.round((completedSessions / visibleSessions.length) * 100);

  const displayName = visibleProfile?.displayName ?? "Student";
  const firstName = displayName.split(" ")[0];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your daily command center — one glance, one action, full momentum."
    >
      <div className="grid gap-6">
        {/* ── Hero Card ── */}
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,rgba(9,17,31,0.97),rgba(28,42,79,0.92),rgba(95,111,255,0.82))] p-6 text-white shadow-glow md:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-sm font-semibold text-white/60">
                {getGreeting()}, <span className="text-white">{firstName}</span>
              </p>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                {getMotivation(focusScore, missedSessions)}
              </h2>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <StatChip icon={Target} label="Tasks left" value={activeTasks} trend={activeTasks > 5 ? "down" : "up"} />
                <StatChip icon={Flame} label="Streak" value={`${completedSessions}`} trend="up" />
                <StatChip icon={Coins} label="Coins" value={visibleProfile?.wallet.coins ?? 0} trend="neutral" />
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
            <div className="rounded-2xl bg-comet/10 p-3">
              <Target className="h-5 w-5 text-comet" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active tasks</p>
              <h3 className="font-display text-2xl font-bold">{activeTasks}</h3>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="rounded-2xl bg-ember/10 p-3">
              <TrendingUp className="h-5 w-5 text-ember" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sessions done</p>
              <h3 className="font-display text-2xl font-bold">{completedSessions}<span className="text-sm font-normal text-slate-400">/{visibleSessions.length}</span></h3>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="rounded-2xl bg-aurora/10 p-3">
              <Coins className="h-5 w-5 text-aurora" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Coins banked</p>
              <h3 className="font-display text-2xl font-bold">{visibleProfile?.wallet.coins ?? 0}</h3>
            </div>
          </Card>
        </section>

        {/* ── Profile ── */}
        <StudentProfileCard profile={visibleProfile} />

        {/* ── Wallet ── */}
        <WalletCard coins={visibleProfile?.wallet.coins ?? 0} transactions={visibleProfile?.wallet.transactions ?? []} />

        {/* ── Plan vs Reality ── */}
        {visibleTasks.length === 0 ? (
          <EmptyState
            title="No study tasks yet"
            description="Finish onboarding so Gemini can split your exam goal into work blocks that actually fit your calendar."
            ctaLabel="Start onboarding"
            ctaHref="/onboarding"
          />
        ) : (
          <PlanRealityWidget tasks={visibleTasks} sessions={visibleSessions} dailyPlans={visibleDailyPlans} />
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
              <div className="rounded-2xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
                <p className="font-semibold">Session reminders</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Push nudges fire 15 minutes before a planned session.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
                <p className="font-semibold">Failure pressure</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Misses trigger automatic rescheduling and coaching interventions.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
                <p className="font-semibold">Coin stakes</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Complete tasks to earn. Miss sessions and the system deducts.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
