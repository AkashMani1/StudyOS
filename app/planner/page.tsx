"use client";

import { Card, Skeleton } from "@/components/ui";
import { PlannerBoard } from "@/components/planner-board";
import { useAuth } from "@/hooks/use-auth";
import { useStudyData } from "@/hooks/use-study-data";
import { getExploreTasks } from "@/lib/explore-data";

export default function PlannerPage() {
  const { user } = useAuth();
  const { tasks, loading } = useStudyData();
  const visibleTasks = user ? tasks : getExploreTasks();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Study plan</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Planner</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Your manual task execution board. Add tasks, lock in, and trigger the accountability engine.</p>
      </header>
      
      {user && loading ? (
        <div className="space-y-8 animate-in mt-10">
          <Skeleton className="h-8 w-64 mb-4" />
          
          {/* Week Tabs Skeleton */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />
            ))}
          </div>

          {/* Timeline Board Skeleton */}
          <div className="rounded-[32px] border border-white/5 bg-[#050505]/50 p-8 space-y-8">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
              <Skeleton className="h-8 w-40 bg-white/10" />
              <Skeleton className="h-10 w-32 rounded-full bg-white/10" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-[24px] bg-white/[0.02]" />
              <Skeleton className="h-24 w-full rounded-[24px] bg-white/[0.02]" />
              <Skeleton className="h-24 w-full rounded-[24px] bg-white/[0.02]" />
            </div>
          </div>
        </div>
      ) : (
        <PlannerBoard tasks={visibleTasks} />
      )}
    </div>
  );
}
