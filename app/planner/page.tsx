"use client";

import { AppShell } from "@/components/app-shell";
import { Card, Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { PlannerBoard } from "@/components/planner-board";
import { useAuth } from "@/hooks/use-auth";
import { useStudyData } from "@/hooks/use-study-data";
import { getExploreDailyPlans, getExploreTasks } from "@/lib/explore-data";

export default function PlannerPage() {
  const { user } = useAuth();
  const { goals, tasks, dailyPlans, loading } = useStudyData();
  const visibleTasks = user ? tasks : getExploreTasks();
  const visibleDailyPlans = user ? dailyPlans : getExploreDailyPlans();

  return (
    <AppShell
      title="Planner"
      subtitle="Your AI-generated blocks for today and the next week. Start sessions here, then close the loop with completion or misses."
    >
      {user && loading ? (
        <Card className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Card>
      ) : user && goals.length > 0 && visibleTasks.length === 0 ? (
        <EmptyState
          title="Your plan is still syncing"
          description="Your goal was saved, but the generated tasks have not finished loading into the planner yet. Give it a moment and refresh once."
          ctaLabel="Refresh planner"
          ctaHref="/planner"
        />
      ) : visibleTasks.length === 0 ? (
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
