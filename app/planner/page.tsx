"use client";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PlannerBoard } from "@/components/planner-board";
import { useAuth } from "@/hooks/use-auth";
import { useStudyData } from "@/hooks/use-study-data";
import { getExploreDailyPlans, getExploreTasks } from "@/lib/explore-data";

export default function PlannerPage() {
  const { user } = useAuth();
  const { tasks, dailyPlans } = useStudyData();
  const visibleTasks = user ? tasks : getExploreTasks();
  const visibleDailyPlans = user ? dailyPlans : getExploreDailyPlans();

  return (
    <AppShell
      title="Planner"
      subtitle="Your AI-generated blocks for today and the next week. Start sessions here, then close the loop with completion or misses."
    >
      {visibleTasks.length === 0 ? (
        <EmptyState
          title="No plan exists yet"
          description="Set your goal and subject hours first. The auto-split engine needs something real to work from."
          ctaLabel="Go to onboarding"
          ctaHref="/onboarding"
        />
      ) : (
        <PlannerBoard tasks={visibleTasks} dailyPlans={visibleDailyPlans} />
      )}
    </AppShell>
  );
}
