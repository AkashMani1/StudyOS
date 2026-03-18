"use client";

import { BellDot, Target, TimerReset } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CoachChat } from "@/components/coach-chat";
import { EmptyState } from "@/components/empty-state";
import { PlanRealityWidget } from "@/components/plan-reality-widget";
import { StudentProfileCard } from "@/components/student-profile-card";
import { WalletCard } from "@/components/wallet-card";
import { Card, SectionHeading } from "@/components/ui";
import { useStudyData } from "@/hooks/use-study-data";
import { useAuth } from "@/hooks/use-auth";
import { getExploreDailyPlans, getExploreProfile, getExploreSessions, getExploreTasks } from "@/lib/explore-data";

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { tasks, sessions, dailyPlans } = useStudyData();
  const visibleProfile = user ? profile : getExploreProfile();
  const visibleTasks = user ? tasks : getExploreTasks();
  const visibleSessions = user ? sessions : getExploreSessions();
  const visibleDailyPlans = user ? dailyPlans : getExploreDailyPlans();

  return (
    <AppShell
      title="Dashboard"
      subtitle="A high-pressure snapshot of your plan, your execution, and the places where the story is falling apart."
    >
      <div className="grid gap-6">
        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <Target className="h-6 w-6 text-comet" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Active tasks</p>
            <h3 className="mt-2 font-display text-4xl font-bold">{visibleTasks.filter((task) => !task.completed).length}</h3>
          </Card>
          <Card>
            <TimerReset className="h-6 w-6 text-ember" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Missed sessions</p>
            <h3 className="mt-2 font-display text-4xl font-bold">{visibleSessions.filter((session) => !session.completed).length}</h3>
          </Card>
          <Card>
            <BellDot className="h-6 w-6 text-aurora" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Notifications</p>
            <h3 className="mt-2 font-display text-4xl font-bold">
              {visibleProfile?.preferences.notificationsEnabled ? "On" : "Off"}
            </h3>
          </Card>
        </section>

        <StudentProfileCard profile={visibleProfile} />

        <WalletCard coins={visibleProfile?.wallet.coins ?? 0} transactions={visibleProfile?.wallet.transactions ?? []} />

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

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <CoachChat />
          <Card className="space-y-4">
            <SectionHeading
              eyebrow="Daily review"
              title="What StudyOS is watching"
              description="These reminders line up with the nudge engine, streak logic, and your current settings."
            />
            <div className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
                <p className="font-semibold">Session reminders</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Push nudges fire 15 minutes before a planned session.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
                <p className="font-semibold">Failure pressure</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Misses are stored for rescheduling, public logging, and harsh weekly coaching.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
                <p className="font-semibold">Coins and stakes</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Task completion writes feed the wallet transaction trigger atomically.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
